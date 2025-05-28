# apps/reports/views.py - COMPLETE FIXED VERSION WITHOUT CIRCULAR IMPORTS
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse, Http404, FileResponse
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
from django.db import IntegrityError
import json
import mimetypes
import os

from .models import InspectionReport, ReportImage, ERPCalculation
from .serializers import (
    InspectionReportSerializer, ReportImageSerializer, 
    ERPCalculationSerializer, ReportGenerationSerializer
)
from .services import (
    DocumentGenerationService, ViolationDetectionService, 
    ERPCalculationService
)
from .renderers import PDFRenderer, DOCXRenderer  # Import from separate module
from apps.inspections.models import Inspection

class InspectionReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing inspection reports"""
    queryset = InspectionReport.objects.all()
    serializer_class = InspectionReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter reports by user and parameters"""
        queryset = super().get_queryset()
        
        # Filter by inspection
        inspection_id = self.request.query_params.get('inspection')
        if inspection_id:
            queryset = queryset.filter(inspection_id=inspection_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by broadcaster
        broadcaster = self.request.query_params.get('broadcaster')
        if broadcaster:
            queryset = queryset.filter(inspection__broadcaster__name__icontains=broadcaster)
        
        return queryset.select_related('inspection', 'inspection__broadcaster', 'created_by')
    
    def perform_create(self, serializer):
        """Create report with automatic analysis"""
        inspection = serializer.validated_data['inspection']
        
        # Detect violations automatically
        violation_service = ViolationDetectionService(inspection)
        violations = violation_service.detect_violations()
        
        # Determine compliance status
        if not violations:
            compliance_status = 'compliant'
        elif any(v['severity'] == 'major' for v in violations):
            compliance_status = 'major_violations'
        else:
            compliance_status = 'minor_violations'
        
        # Save report
        report = serializer.save(
            created_by=self.request.user,
            last_modified_by=self.request.user,
            violations_found=violations,
            compliance_status=compliance_status
        )
        
        # Create ERP calculations if equipment data available
        self._create_erp_calculations(report)
        
        return report
    
    def _create_erp_calculations(self, report):
        """Create ERP calculations from inspection data"""
        inspection = report.inspection
        
        try:
            forward_power = float(inspection.amplifier_actual_reading or 0)
            antenna_gain = float(inspection.antenna_gain or 11.0)
            frequency = inspection.transmit_frequency or "Unknown"
            
            if forward_power > 0:
                ERPCalculation.objects.create(
                    report=report,
                    channel_number="CH.1",
                    frequency_mhz=frequency,
                    forward_power_w=forward_power,
                    antenna_gain_dbd=antenna_gain,
                    losses_db=1.5
                )
        except (ValueError, TypeError):
            pass
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Enhanced bulk upload with category-based image handling"""
        report_id = request.data.get('report_id')
        if not report_id:
            return Response({
                'error': 'Report ID required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        report = get_object_or_404(InspectionReport, id=report_id)
        
        uploaded_images = []
        errors = []
        
        # Process multiple files with enhanced metadata
        for key, file in request.FILES.items():
            try:
                # Extract metadata from form data
                image_type = request.data.get(f'{key}_type', 'other')
                caption = request.data.get(f'{key}_caption', file.name.split('.')[0])
                position = request.data.get(f'{key}_position', 'equipment_section')
                
                # Validate image type
                valid_types = [
                    'site_overview', 'tower_structure', 'exciter', 'amplifier',
                    'antenna_system', 'filter', 'studio_link', 'transmitter_room',
                    'equipment_rack', 'other'
                ]
                
                if image_type not in valid_types:
                    errors.append({
                        'filename': file.name,
                        'error': f'Invalid image type: {image_type}'
                    })
                    continue
                
                # Validate file size (max 10MB)
                max_size = 10 * 1024 * 1024  # 10MB
                if file.size > max_size:
                    errors.append({
                        'filename': file.name,
                        'error': 'File size exceeds 10MB limit'
                    })
                    continue
                
                # Validate file type
                allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
                if hasattr(file, 'content_type') and file.content_type not in allowed_types:
                    errors.append({
                        'filename': file.name,
                        'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed'
                    })
                    continue
                
                # Create image record with enhanced positioning
                image = ReportImage.objects.create(
                    report=report,
                    image=file,
                    image_type=image_type,
                    caption=caption,
                    position_in_report=position,
                    uploaded_by=request.user,
                    # Set order based on image type for consistent layout
                    order_in_section=ReportImage.objects.filter(
                        report=report, 
                        image_type=image_type
                    ).count() + 1
                )
                
                uploaded_images.append({
                    'id': image.id,
                    'filename': file.name,
                    'type': image_type,
                    'caption': caption,
                    'position': position,
                    'file_size': file.size,
                    'url': request.build_absolute_uri(image.image.url) if image.image else None
                })
                
            except Exception as e:
                errors.append({
                    'filename': file.name,
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'uploaded_images': uploaded_images,
            'errors': errors,
            'total_uploaded': len(uploaded_images),
            'total_errors': len(errors),
            'report_id': str(report.id)
        })

    @action(detail=True, methods=['post'])
    def generate_documents(self, request, pk=None):
        """Generate professional documents using enhanced generator"""
        try:
            report = self.get_object()
            
            # Import the enhanced document generator
            from .document_generator import ProfessionalDocumentGenerator
            
            # Get generation parameters
            formats = request.data.get('formats', ['pdf'])
            include_images = request.data.get('include_images', True)
            custom_observations = request.data.get('custom_observations', '')
            custom_conclusions = request.data.get('custom_conclusions', '')
            custom_recommendations = request.data.get('custom_recommendations', '')
            
            # Validate formats
            valid_formats = ['pdf', 'docx']
            formats = [f for f in formats if f in valid_formats]
            
            if not formats:
                return Response({
                    'error': 'At least one valid format (pdf, docx) must be specified'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update report with custom content
            if custom_observations:
                report.observations = custom_observations
            if custom_conclusions:
                report.conclusions = custom_conclusions
            if custom_recommendations:
                report.recommendations = custom_recommendations
            
            report.save()
            
            # Generate documents using professional generator
            doc_generator = ProfessionalDocumentGenerator(report)
            generated_files = doc_generator.generate_documents(formats)
            
            # Prepare response with file URLs
            file_urls = {}
            for format_type, file_path in generated_files.items():
                if format_type == 'pdf' and report.generated_pdf:
                    file_urls['pdf'] = request.build_absolute_uri(report.generated_pdf.url)
                elif format_type == 'docx' and report.generated_docx:
                    file_urls['docx'] = request.build_absolute_uri(report.generated_docx.url)
            
            return Response({
                'success': True,
                'message': 'Professional documents generated successfully',
                'files': file_urls,
                'report_id': str(report.id),
                'reference_number': report.reference_number,
                'generation_info': {
                    'formats_generated': list(generated_files.keys()),
                    'include_images': include_images,
                    'total_images': report.images.count(),
                    'generated_at': report.date_completed.isoformat() if report.date_completed else None
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log the error for debugging
            import traceback
            print(f"Document generation error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            
            return Response({
                'success': False,
                'error': f'Failed to generate documents: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], renderer_classes=[PDFRenderer])
    def download_pdf(self, request, pk=None):
        """Download generated PDF with proper content negotiation"""
        report = self.get_object()
        
        if not report.generated_pdf:
            raise Http404("PDF not generated yet")
        
        try:
            # Get the file path
            file_path = report.generated_pdf.path
            
            # Check if file exists
            if not os.path.exists(file_path):
                raise Http404("PDF file not found on disk")
            
            # Create filename
            filename = f"{report.reference_number.replace('/', '_')}.pdf"
            
            # Return FileResponse for better file handling
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                as_attachment=True,
                filename=filename
            )
            
            # Add additional headers for better browser compatibility
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = os.path.getsize(file_path)
            response['Cache-Control'] = 'no-cache'
            
            return response
            
        except Exception as e:
            print(f"PDF download error: {str(e)}")
            return Response({
                'error': f'Failed to download PDF: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], renderer_classes=[DOCXRenderer])
    def download_docx(self, request, pk=None):
        """Download generated Word document with proper content negotiation"""
        report = self.get_object()
        
        if not report.generated_docx:
            raise Http404("Word document not generated yet")
        
        try:
            # Get the file path
            file_path = report.generated_docx.path
            
            # Check if file exists
            if not os.path.exists(file_path):
                raise Http404("DOCX file not found on disk")
            
            # Create filename
            filename = f"{report.reference_number.replace('/', '_')}.docx"
            
            # Return FileResponse for better file handling
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                as_attachment=True,
                filename=filename
            )
            
            # Add additional headers for better browser compatibility
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = os.path.getsize(file_path)
            response['Cache-Control'] = 'no-cache'
            
            return response
            
        except Exception as e:
            print(f"DOCX download error: {str(e)}")
            return Response({
                'error': f'Failed to download Word document: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def preview_data(self, request, pk=None):
        """Get preview data for report generation"""
        report = self.get_object()
        inspection = report.inspection
        
        # Detect violations
        violation_service = ViolationDetectionService(inspection)
        violations = violation_service.detect_violations()
        
        # Get ERP calculations
        erp_calculations = list(report.erp_details.all().values())
        
        # Preview data
        preview_data = {
            'report_info': {
                'reference_number': report.reference_number,
                'title': report.title,
                'inspection_date': inspection.inspection_date,
                'inspector': inspection.inspector.get_full_name(),
                'broadcaster': inspection.broadcaster.name if inspection.broadcaster else None,
            },
            'site_info': {
                'name': inspection.transmitting_site_name,
                'coordinates': {
                    'longitude': inspection.longitude,
                    'latitude': inspection.latitude
                },
                'elevation': inspection.altitude,
                'physical_location': inspection.physical_location,
            },
            'tower_info': {
                'owner': inspection.tower_owner_name,
                'height': inspection.height_above_ground,
                'type': inspection.get_tower_type_display() if inspection.tower_type else None,
                'manufacturer': inspection.manufacturer_name,
            },
            'transmitter_info': {
                'exciter': {
                    'manufacturer': inspection.exciter_manufacturer,
                    'model': inspection.exciter_model_number,
                    'serial': inspection.exciter_serial_number,
                    'power': inspection.exciter_actual_reading,
                },
                'amplifier': {
                    'manufacturer': inspection.amplifier_manufacturer,
                    'model': inspection.amplifier_model_number,
                    'serial': inspection.amplifier_serial_number,
                    'power': inspection.amplifier_actual_reading,
                },
                'frequency': inspection.transmit_frequency,
            },
            'antenna_info': {
                'manufacturer': inspection.antenna_manufacturer,
                'model': inspection.antenna_model_number,
                'type': inspection.antenna_type,
                'gain': inspection.antenna_gain,
                'height_on_tower': inspection.height_on_tower,
                'polarization': inspection.get_polarization_display() if inspection.polarization else None,
            },
            'erp_calculations': erp_calculations,
            'violations': violations,
            'images': list(report.images.all().values(
                'id', 'image_type', 'caption', 'position_in_report', 'image'
            )),
            'compliance_status': report.compliance_status,
        }
        
        return Response(preview_data)

    @action(detail=True, methods=['get'])
    def image_requirements(self, request, pk=None):
        """Get image requirements based on station type"""
        report = self.get_object()
        inspection = report.inspection
        
        # Define image requirements based on station type
        base_requirements = {
            'site_overview': {'required': False, 'description': 'Overall view of the transmitter site'},
            'tower_structure': {'required': True, 'description': 'Tower or mast supporting the antenna'},
            'exciter': {'required': True, 'description': 'Exciter unit and related equipment'},
            'amplifier': {'required': True, 'description': 'Power amplifier and associated equipment'},
            'antenna_system': {'required': True, 'description': 'Antenna and mounting hardware'},
            'filter': {'required': False, 'description': 'Band pass filters and combiners'},
            'studio_link': {'required': False, 'description': 'STL equipment and connections'},
            'transmitter_room': {'required': False, 'description': 'Interior view of transmitter facility'},
            'equipment_rack': {'required': False, 'description': 'Equipment racks and installations'},
            'other': {'required': False, 'description': 'Any other relevant equipment'}
        }
        
        # Adjust requirements based on station type
        if inspection.station_type == 'TV':
            base_requirements['filter']['required'] = True  # TV usually has combiners
        
        # Check current status
        current_images = {}
        for image_type in base_requirements.keys():
            current_images[image_type] = {
                'count': report.images.filter(image_type=image_type).count(),
                'images': list(report.images.filter(image_type=image_type).values(
                    'id', 'caption', 'image', 'uploaded_at'
                ))
            }
        
        return Response({
            'requirements': base_requirements,
            'current_status': current_images,
            'station_type': inspection.station_type,
            'total_required': len([r for r in base_requirements.values() if r['required']]),
            'total_completed': len([
                k for k, v in current_images.items() 
                if v['count'] > 0 and base_requirements[k]['required']
            ])
        })

    @action(detail=True, methods=['get'])
    def enhanced_preview_data(self, request, pk=None):
        """Get enhanced preview data for report generation"""
        report = self.get_object()
        inspection = report.inspection
        
        # Import violation detection service
        from .services import ViolationDetectionService
        
        # Detect violations
        violation_service = ViolationDetectionService(inspection)
        violations = violation_service.detect_violations()
        
        # Get ERP calculations
        erp_calculations = list(report.erp_details.all().values())
        
        # Get images organized by category
        images_by_category = {}
        for image_type in ['site_overview', 'tower_structure', 'exciter', 'amplifier', 
                          'antenna_system', 'filter', 'studio_link', 'transmitter_room',
                          'equipment_rack', 'other']:
            images = list(report.images.filter(image_type=image_type).values(
                'id', 'image', 'caption', 'image_type', 'uploaded_at'
            ))
            if images:
                images_by_category[image_type] = images
        
        # Enhanced preview data
        preview_data = {
            'report_info': {
                'id': str(report.id),
                'reference_number': report.reference_number,
                'title': report.title,
                'report_type': report.report_type,
                'status': report.status,
                'inspection_date': inspection.inspection_date,
                'inspector': inspection.inspector.get_full_name(),
                'broadcaster': inspection.broadcaster.name if inspection.broadcaster else None,
                'station_type': inspection.station_type,
                'created_at': report.created_at,
            },
            'site_info': {
                'name': inspection.transmitting_site_name,
                'coordinates': {
                    'longitude': inspection.longitude,
                    'latitude': inspection.latitude
                },
                'elevation': inspection.altitude,
                'physical_location': inspection.physical_location,
                'contact_name': inspection.contact_name,
                'contact_phone': inspection.contact_phone,
            },
            'tower_info': {
                'owner': inspection.tower_owner_name,
                'height': inspection.height_above_ground,
                'type': inspection.get_tower_type_display() if inspection.tower_type else None,
                'manufacturer': inspection.manufacturer_name,
                'building_height': inspection.building_height,
                'above_building_roof': inspection.above_building_roof,
            },
            'transmitter_info': {
                'exciter': {
                    'manufacturer': inspection.exciter_manufacturer,
                    'model': inspection.exciter_model_number,
                    'serial': inspection.exciter_serial_number,
                    'nominal_power': inspection.exciter_nominal_power,
                    'actual_power': inspection.exciter_actual_reading,
                },
                'amplifier': {
                    'manufacturer': inspection.amplifier_manufacturer,
                    'model': inspection.amplifier_model_number,
                    'serial': inspection.amplifier_serial_number,
                    'nominal_power': inspection.amplifier_nominal_power,
                    'actual_power': inspection.amplifier_actual_reading,
                },
                'frequency': inspection.transmit_frequency,
                'frequency_stability': inspection.frequency_stability,
            },
            'antenna_info': {
                'manufacturer': inspection.antenna_manufacturer,
                'model': inspection.antenna_model_number,
                'type': inspection.antenna_type,
                'gain': inspection.antenna_gain,
                'height_on_tower': inspection.height_on_tower,
                'polarization': inspection.get_polarization_display() if inspection.polarization else None,
                'beam_width': inspection.beam_width_3db,
            },
            'filter_info': {
                'manufacturer': inspection.filter_manufacturer,
                'model': inspection.filter_model_number,
                'serial': inspection.filter_serial_number,
                'frequency': inspection.filter_frequency,
            },
            'studio_link_info': {
                'manufacturer': inspection.studio_manufacturer,
                'model': inspection.studio_model_number,
                'serial': inspection.studio_serial_number,
                'frequency': inspection.studio_frequency,
                'signal_description': inspection.signal_description,
            },
            'erp_calculations': erp_calculations,
            'violations': violations,
            'images_by_category': images_by_category,
            'compliance_status': report.compliance_status,
            'content': {
                'observations': report.observations,
                'conclusions': report.conclusions,
                'recommendations': report.recommendations,
            },
            'generation_status': {
                'can_generate': report.status in ['draft', 'pending_review'],
                'pdf_available': bool(report.generated_pdf),
                'docx_available': bool(report.generated_docx),
                'last_generated': report.date_completed,
            }
        }
        
        return Response(preview_data)
    
    @action(detail=True, methods=['post'])
    def analyze_violations(self, request, pk=None):
        """Analyze inspection for violations"""
        report = self.get_object()
        inspection = report.inspection
        
        # Run violation detection
        violation_service = ViolationDetectionService(inspection)
        violations = violation_service.detect_violations()
        
        # Update report
        report.violations_found = violations
        
        # Update compliance status
        if not violations:
            report.compliance_status = 'compliant'
        elif any(v['severity'] == 'major' for v in violations):
            report.compliance_status = 'major_violations'
        else:
            report.compliance_status = 'minor_violations'
        
        report.save()
        
        return Response({
            'violations': violations,
            'compliance_status': report.compliance_status,
            'total_violations': len(violations),
            'major_violations': len([v for v in violations if v['severity'] == 'major']),
            'minor_violations': len([v for v in violations if v['severity'] == 'minor']),
        })

class ERPCalculationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing ERP calculations"""
    queryset = ERPCalculation.objects.all()
    serializer_class = ERPCalculationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter calculations by report"""
        queryset = super().get_queryset()
        
        report_id = self.request.query_params.get('report')
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        
        return queryset.select_related('report')
    
    @action(detail=False, methods=['post'])
    def calculate_erp(self, request):
        """Calculate ERP from provided values"""
        try:
            forward_power = float(request.data.get('forward_power_w', 0))
            antenna_gain = float(request.data.get('antenna_gain_dbd', 11.0))
            losses = float(request.data.get('losses_db', 1.5))
            
            if forward_power <= 0:
                return Response({
                    'error': 'Forward power must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate ERP
            erp_calc = ERPCalculationService.calculate_erp(
                forward_power, antenna_gain, losses
            )
            
            # Check compliance
            authorized_kw = float(request.data.get('authorized_kw', 10.0))
            compliance = ERPCalculationService.check_compliance(
                erp_calc['erp_kw'], authorized_kw
            )
            
            return Response({
                'calculations': erp_calc,
                'compliance': compliance,
                'formula': f"ERP = 10*log10({forward_power}) + {antenna_gain} - {losses} = {erp_calc['erp_dbw']} dBW ({erp_calc['erp_kw']} kW)"
            })
            
        except (ValueError, TypeError) as e:
            return Response({
                'error': f'Invalid input values: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_calculate(self, request):
        """Calculate ERP for multiple channels"""
        report_id = request.data.get('report_id')
        channels = request.data.get('channels', [])
        
        if not report_id:
            return Response({
                'error': 'Report ID required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        report = get_object_or_404(InspectionReport, id=report_id)
        
        calculations = []
        errors = []
        
        for channel_data in channels:
            try:
                # Extract channel data
                channel_number = channel_data.get('channel_number', 'CH.1')
                frequency_mhz = channel_data.get('frequency_mhz', 'Unknown')
                forward_power = float(channel_data.get('forward_power_w', 0))
                antenna_gain = float(channel_data.get('antenna_gain_dbd', 11.0))
                losses = float(channel_data.get('losses_db', 1.5))
                
                if forward_power <= 0:
                    errors.append({
                        'channel': channel_number,
                        'error': 'Forward power must be greater than 0'
                    })
                    continue
                
                # Create or update ERP calculation
                calc, created = ERPCalculation.objects.update_or_create(
                    report=report,
                    channel_number=channel_number,
                    defaults={
                        'frequency_mhz': frequency_mhz,
                        'forward_power_w': forward_power,
                        'antenna_gain_dbd': antenna_gain,
                        'losses_db': losses
                    }
                )
                
                calculations.append({
                    'id': calc.id,
                    'channel_number': calc.channel_number,
                    'frequency_mhz': calc.frequency_mhz,
                    'erp_dbw': float(calc.erp_dbw),
                    'erp_kw': float(calc.erp_kw),
                    'is_compliant': calc.is_compliant,
                    'created': created
                })
                
            except (ValueError, TypeError) as e:
                errors.append({
                    'channel': channel_data.get('channel_number', 'Unknown'),
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'calculations': calculations,
            'errors': errors,
            'total_calculated': len(calculations),
            'total_errors': len(errors)
        })

class ReportImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report images"""
    queryset = ReportImage.objects.all()
    serializer_class = ReportImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Filter images by report"""
        queryset = super().get_queryset()
        
        report_id = self.request.query_params.get('report')
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        
        return queryset.select_related('report', 'uploaded_by')
    
    def perform_create(self, serializer):
        """Upload image with metadata"""
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_position(self, request, pk=None):
        """Update image position in report"""
        image = self.get_object()
        
        position = request.data.get('position_in_report')
        order = request.data.get('order_in_section', 1)
        
        if position:
            image.position_in_report = position
            image.order_in_section = order
            image.save()
            
            return Response({
                'success': True,
                'message': 'Image position updated'
            })
        
        return Response({
            'error': 'Position required'
        }, status=status.HTTP_400_BAD_REQUEST)

# Additional utility views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report_from_inspection(request, inspection_id):
    """Create a new report from an existing inspection"""
    import traceback
    
    try:
        print(f"=== CREATING REPORT FOR INSPECTION {inspection_id} ===")
        
        inspection = get_object_or_404(Inspection, id=inspection_id)
        print(f"✅ Found inspection: {inspection}")
        
        # Check if report already exists for this inspection
        existing_report = InspectionReport.objects.filter(inspection=inspection).first()
        if existing_report:
            print(f"ℹ️ Report already exists: {existing_report.id}")
            return Response({
                'success': True,
                'report_id': str(existing_report.id),
                'message': 'Report already exists for this inspection',
                'existing': True
            })
        
        # Determine report type from inspection
        station_type = inspection.station_type
        print(f"📻 Station type: {station_type}")
        
        if station_type == 'FM':
            report_type = 'fm_radio'
        elif station_type == 'TV':
            report_type = 'tv_broadcast'
        elif station_type == 'AM':
            report_type = 'am_radio'
        else:
            report_type = 'fm_radio'  # Default
        
        print(f"📋 Report type determined: {report_type}")
        
        # Create new report with retry mechanism for reference number conflicts
        print("🔨 Creating new report...")
        
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Create report
                report = InspectionReport(
                    inspection=inspection,
                    report_type=report_type,
                    created_by=request.user,
                    last_modified_by=request.user
                )
                
                # Save the report (this will auto-generate reference_number)
                report.save()
                print(f"✅ Report created with ID: {report.id} and reference: {report.reference_number}")
                break
                
            except IntegrityError as ie:
                if 'reference_number' in str(ie) and attempt < max_retries - 1:
                    print(f"⚠️ Reference number collision, retry {attempt + 1}/{max_retries}")
                    continue
                else:
                    raise
        else:
            # If we exhausted all retries
            raise Exception(f"Failed to create report after {max_retries} attempts due to reference number conflicts")
        
        # Auto-analyze violations
        print("🔍 Starting violation detection...")
        
        try:
            violation_service = ViolationDetectionService(inspection)
            print("✅ ViolationDetectionService created")
            
            print("🔍 Calling detect_violations()...")
            violations = violation_service.detect_violations()
            print(f"✅ Violations detected: {len(violations)}")
            
        except Exception as violation_error:
            print(f"❌ VIOLATION DETECTION FAILED: {str(violation_error)}")
            print(f"❌ Error type: {type(violation_error).__name__}")
            traceback.print_exc()
            
            # Set empty violations to continue
            violations = []
        
        # Update compliance status
        if not violations:
            compliance_status = 'compliant'
        elif any(v['severity'] == 'major' for v in violations):
            compliance_status = 'major_violations'
        else:
            compliance_status = 'minor_violations'
        
        print(f"📊 Compliance status: {compliance_status}")
        
        report.violations_found = violations
        report.compliance_status = compliance_status
        report.save()
        print("✅ Report updated with violations")
        
        # Create ERP calculation if possible
        print("⚡ Creating ERP calculation...")
        try:
            forward_power = float(inspection.amplifier_actual_reading or 0)
            antenna_gain = float(inspection.antenna_gain or 11.0)
            frequency = inspection.transmit_frequency or "Unknown"
            
            print(f"⚡ Power: {forward_power}W, Gain: {antenna_gain}dBd, Freq: {frequency}")
            
            if forward_power > 0:
                erp_calc = ERPCalculation.objects.create(
                    report=report,
                    channel_number="CH.1",
                    frequency_mhz=frequency,
                    forward_power_w=forward_power,
                    antenna_gain_dbd=antenna_gain,
                    losses_db=1.5
                )
                print(f"✅ ERP calculation created: {erp_calc.id}")
            else:
                print("ℹ️ No forward power, skipping ERP calculation")
                
        except (ValueError, TypeError) as erp_error:
            print(f"⚠️ ERP calculation failed: {str(erp_error)}")
        
        print("🎉 SUCCESS: Report creation completed")
        
        return Response({
            'success': True,
            'report_id': str(report.id),
            'message': 'Report created successfully',
            'violations_detected': len(violations),
            'compliance_status': compliance_status
        })
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in create_report_from_inspection: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        print("❌ Full traceback:")
        traceback.print_exc()
        
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_templates(request):
    """Get available report templates"""
    templates = [
        {
            'id': 'fm_radio',
            'name': 'FM Radio Inspection Report',
            'description': 'Standard template for FM radio station inspections',
            'sections': [
                'Site Information',
                'Tower/Mast Details',
                'Transmitter Equipment',
                'Antenna System',
                'ERP Calculations',
                'Observations',
                'Conclusions',
                'Recommendations'
            ]
        },
        {
            'id': 'tv_broadcast',
            'name': 'TV Broadcast Inspection Report',
            'description': 'Template for television broadcast station inspections',
            'sections': [
                'Site Information',
                'Tower/Mast Details',
                'Multi-Channel Transmitters',
                'Antenna Systems',
                'ERP Calculations (Multiple Channels)',
                'Observations',
                'Conclusions',
                'Recommendations'
            ]
        },
        {
            'id': 'am_radio',
            'name': 'AM Radio Inspection Report',
            'description': 'Template for AM radio station inspections',
            'sections': [
                'Site Information',
                'Antenna Array',
                'Transmitter Equipment',
                'Ground System',
                'Power Calculations',
                'Observations',
                'Conclusions',
                'Recommendations'
            ]
        }
    ]
    
    return Response({
        'templates': templates,
        'default_settings': {
            'page_margins': {
                'top': 72,
                'bottom': 72,
                'left': 72,
                'right': 72
            },
            'font_settings': {
                'body_font': 'Helvetica',
                'body_size': 10,
                'heading_font': 'Helvetica-Bold',
                'heading_size': 12
            }
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_report_data(request):
    """Validate report data before generation"""
    errors = []
    warnings = []
    
    # Required fields check
    required_fields = [
        'inspection_id',
        'report_type',
        'title'
    ]
    
    for field in required_fields:
        if not request.data.get(field):
            errors.append(f"{field} is required")
    
    # Inspection data validation
    inspection_id = request.data.get('inspection_id')
    if inspection_id:
        try:
            inspection = Inspection.objects.get(id=inspection_id)
            
            # Check for missing critical data
            if not inspection.transmitting_site_name:
                warnings.append("Transmitting site name is missing")
            
            if not inspection.amplifier_actual_reading:
                warnings.append("Amplifier power reading is missing")
            
            if not inspection.antenna_gain:
                warnings.append("Antenna gain is missing")
            
            if not inspection.contact_name:
                warnings.append("Contact person name is missing")
                
        except Inspection.DoesNotExist:
            errors.append("Invalid inspection ID")
    
    # ERP calculation validation
    erp_data = request.data.get('erp_calculations', [])
    for i, calc in enumerate(erp_data):
        try:
            power = float(calc.get('forward_power_w', 0))
            if power <= 0:
                errors.append(f"ERP calculation {i+1}: Forward power must be greater than 0")
        except (ValueError, TypeError):
            errors.append(f"ERP calculation {i+1}: Invalid power value")
    
    return Response({
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'can_generate': len(errors) == 0,
        'total_issues': len(errors) + len(warnings)
    })
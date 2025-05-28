# apps/reports/serializers.py
from rest_framework import serializers
from .models import InspectionReport, ReportImage, ERPCalculation, ReportTemplate
from apps.inspections.models import Inspection

class ERPCalculationSerializer(serializers.ModelSerializer):
    """Serializer for ERP calculations"""
    
    class Meta:
        model = ERPCalculation
        fields = [
            'id', 'channel_number', 'frequency_mhz', 'forward_power_w',
            'antenna_gain_dbd', 'losses_db', 'erp_dbw', 'erp_kw',
            'authorized_erp_dbw', 'authorized_erp_kw', 'is_compliant',
            'excess_power_kw'
        ]
        read_only_fields = ['erp_dbw', 'erp_kw', 'is_compliant', 'excess_power_kw']

class ReportImageSerializer(serializers.ModelSerializer):
    """Serializer for report images"""
    image_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = ReportImage
        fields = [
            'id', 'image', 'image_url', 'image_type', 'caption', 'description',
            'position_in_report', 'order_in_section', 'width_percentage',
            'alignment', 'equipment_manufacturer', 'equipment_model',
            'equipment_serial', 'uploaded_at', 'uploaded_by', 'uploaded_by_name',
            'file_size'
        ]
        read_only_fields = ['uploaded_by', 'uploaded_at', 'file_size']
    
    def get_image_url(self, obj):
        """Get full URL for image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_file_size(self, obj):
        """Get image file size in bytes"""
        if obj.image and hasattr(obj.image, 'size'):
            return obj.image.size
        return None

class InspectionReportSerializer(serializers.ModelSerializer):
    """Serializer for inspection reports"""
    inspection_details = serializers.SerializerMethodField()
    broadcaster_name = serializers.CharField(source='inspection.broadcaster.name', read_only=True)
    inspector_name = serializers.CharField(source='inspection.inspector.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Related data
    images = ReportImageSerializer(many=True, read_only=True)
    erp_details = ERPCalculationSerializer(many=True, read_only=True)
    
    # Computed fields
    total_images = serializers.SerializerMethodField()
    violation_summary = serializers.SerializerMethodField()
    generation_status = serializers.SerializerMethodField()
    
    class Meta:
        model = InspectionReport
        fields = [
            'id', 'inspection', 'inspection_details', 'broadcaster_name',
            'inspector_name', 'report_type', 'status', 'title',
            'reference_number', 'date_created', 'date_completed',
            'findings', 'observations', 'conclusions', 'recommendations',
            'erp_calculations', 'violations_found', 'compliance_status',
            'preferred_format', 'generated_pdf', 'generated_docx',
            'created_by', 'created_by_name', 'last_modified_by',
            'created_at', 'updated_at', 'images', 'erp_details',
            'total_images', 'violation_summary', 'generation_status'
        ]
        read_only_fields = [
            'reference_number', 'title', 'date_created', 'created_by',
            'created_at', 'updated_at', 'total_images', 'violation_summary',
            'generation_status'
        ]
    
    def get_inspection_details(self, obj):
        """Get basic inspection details"""
        inspection = obj.inspection
        return {
            'id': inspection.id,
            'form_number': inspection.form_number,
            'inspection_date': inspection.inspection_date,
            'status': inspection.status,
            'transmitting_site_name': inspection.transmitting_site_name,
            'station_type': inspection.station_type,
            'broadcaster_name': inspection.broadcaster.name if inspection.broadcaster else None
        }
    
    def get_total_images(self, obj):
        """Get total number of images"""
        return obj.images.count()
    
    def get_violation_summary(self, obj):
        """Get summary of violations"""
        violations = obj.violations_found or []
        
        return {
            'total': len(violations),
            'major': len([v for v in violations if v.get('severity') == 'major']),
            'minor': len([v for v in violations if v.get('severity') == 'minor']),
            'types': list(set(v.get('type', 'unknown') for v in violations))
        }
    
    def get_generation_status(self, obj):
        """Get document generation status"""
        return {
            'pdf_generated': bool(obj.generated_pdf),
            'docx_generated': bool(obj.generated_docx),
            'can_generate': obj.status in ['draft', 'pending_review'],
            'last_generated': obj.date_completed
        }

class SimpleInspectionReportSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    broadcaster_name = serializers.CharField(source='inspection.broadcaster.name', read_only=True)
    inspector_name = serializers.CharField(source='inspection.inspector.get_full_name', read_only=True)
    inspection_date = serializers.DateField(source='inspection.inspection_date', read_only=True)
    total_images = serializers.SerializerMethodField()
    total_violations = serializers.SerializerMethodField()
    
    class Meta:
        model = InspectionReport
        fields = [
            'id', 'reference_number', 'title', 'report_type', 'status',
            'broadcaster_name', 'inspector_name', 'inspection_date',
            'compliance_status', 'date_created', 'date_completed',
            'total_images', 'total_violations', 'generated_pdf',
            'generated_docx', 'created_at'
        ]
    
    def get_total_images(self, obj):
        """Get total number of images"""
        return obj.images.count()
    
    def get_total_violations(self, obj):
        """Get total number of violations"""
        return len(obj.violations_found or [])

class ReportGenerationSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    formats = serializers.ListField(
        child=serializers.ChoiceField(choices=['pdf', 'docx']),
        default=['pdf'],
        help_text="List of formats to generate"
    )
    include_images = serializers.BooleanField(
        default=True,
        help_text="Whether to include images in generated documents"
    )
    custom_observations = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Custom observations to include"
    )
    custom_conclusions = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Custom conclusions to include"
    )
    custom_recommendations = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Custom recommendations to include"
    )
    erp_calculations = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Custom ERP calculations"
    )
    
    def validate_formats(self, value):
        """Validate format list"""
        if not value:
            raise serializers.ValidationError("At least one format must be specified")
        
        valid_formats = ['pdf', 'docx']
        for format_type in value:
            if format_type not in valid_formats:
                raise serializers.ValidationError(f"Invalid format: {format_type}")
        
        return value
    
    def validate_erp_calculations(self, value):
        """Validate ERP calculations"""
        if not value:
            return value
        
        for calc in value:
            required_fields = ['forward_power_w', 'antenna_gain_dbd']
            for field in required_fields:
                if field not in calc:
                    raise serializers.ValidationError(f"Missing required field: {field}")
                
                try:
                    float(calc[field])
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"Invalid numeric value for {field}")
        
        return value

class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for report templates"""
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'report_type', 'template_structure',
            'header_template', 'findings_template', 'calculations_template',
            'conclusions_template', 'recommendations_template',
            'page_margins', 'font_settings', 'is_active',
            'created_at', 'updated_at'
        ]

class ViolationAnalysisSerializer(serializers.Serializer):
    """Serializer for violation analysis results"""
    violations = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of detected violations"
    )
    compliance_status = serializers.ChoiceField(
        choices=['compliant', 'minor_violations', 'major_violations', 'non_compliant']
    )
    total_violations = serializers.IntegerField()
    major_violations = serializers.IntegerField()
    minor_violations = serializers.IntegerField()
    violation_types = serializers.ListField(
        child=serializers.CharField(),
        help_text="Types of violations found"
    )
    
class ReportPreviewSerializer(serializers.Serializer):
    """Serializer for report preview data"""
    report_info = serializers.DictField()
    site_info = serializers.DictField()
    tower_info = serializers.DictField()
    transmitter_info = serializers.DictField()
    antenna_info = serializers.DictField()
    erp_calculations = serializers.ListField(child=serializers.DictField())
    violations = serializers.ListField(child=serializers.DictField())
    images = serializers.ListField(child=serializers.DictField())
    compliance_status = serializers.CharField()

class BulkImageUploadSerializer(serializers.Serializer):
    """Serializer for bulk image upload"""
    report_id = serializers.UUIDField()
    images = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of image data with metadata"
    )
    
    def validate_images(self, value):
        """Validate image data"""
        if not value:
            raise serializers.ValidationError("At least one image must be provided")
        
        for i, img_data in enumerate(value):
            # Check required fields
            if 'image_type' not in img_data:
                raise serializers.ValidationError(f"Image {i+1}: image_type is required")
            
            # Validate image type
            valid_types = [
                'site_overview', 'tower_structure', 'exciter', 'amplifier',
                'antenna_system', 'filter', 'studio_link', 'transmitter_room',
                'equipment_rack', 'other'
            ]
            
            if img_data['image_type'] not in valid_types:
                raise serializers.ValidationError(f"Image {i+1}: invalid image_type")
        
        return value

class ERPBulkCalculationSerializer(serializers.Serializer):
    """Serializer for bulk ERP calculations"""
    report_id = serializers.UUIDField()
    channels = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of channel data for ERP calculations"
    )
    
    def validate_channels(self, value):
        """Validate channel data"""
        if not value:
            raise serializers.ValidationError("At least one channel must be provided")
        
        for i, channel in enumerate(value):
            # Check required fields
            required_fields = ['channel_number', 'forward_power_w', 'antenna_gain_dbd']
            for field in required_fields:
                if field not in channel:
                    raise serializers.ValidationError(f"Channel {i+1}: {field} is required")
            
            # Validate numeric fields
            numeric_fields = ['forward_power_w', 'antenna_gain_dbd', 'losses_db']
            for field in numeric_fields:
                if field in channel:
                    try:
                        float(channel[field])
                    except (ValueError, TypeError):
                        raise serializers.ValidationError(f"Channel {i+1}: {field} must be numeric")
        
        return value
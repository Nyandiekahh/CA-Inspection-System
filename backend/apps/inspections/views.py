# apps/inspections/views.py - COMPLETE FIXED VERSION
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Inspection
from .serializers import InspectionSerializer, SimpleInspectionSerializer
from apps.broadcasters.models import Broadcaster
from django.contrib.auth import get_user_model
import json

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def test_inspections(request):
    """Test endpoint for inspections"""
    try:
        count = Inspection.objects.count()
        inspections = [i.form_number for i in Inspection.objects.all()[:5]]
        return Response({
            'message': 'Inspections API working!',
            'count': count,
            'inspections': inspections,
            'status': 'success'
        })
    except Exception as e:
        return Response({
            'message': 'Inspections API has issues',
            'error': str(e),
            'status': 'error'
        }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class InspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.select_related('broadcaster', 'inspector').all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'retrieve':
            # For getting individual inspections (like the preview page), return ALL fields
            return InspectionSerializer
        else:
            # For list view and other operations, use simplified serializer
            return SimpleInspectionSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"🔍 CREATE request data: {request.data}")
        
        # Prepare data for creation
        data = request.data.copy()
        
        # FIXED: Handle optional broadcaster - let serializer handle defaults
        if not data.get('broadcaster') and not data.get('broadcaster_name'):
            print("📝 No broadcaster provided, serializer will create default")
        
        # Get or create a default inspector for development
        inspector = None
        if request.user.is_authenticated:
            inspector = request.user
        else:
            # Use first available user or create a test user
            inspector = User.objects.first()
            if not inspector:
                inspector = User.objects.create_user(
                    username='test_inspector',
                    email='test@example.com',
                    first_name='Test',
                    last_name='Inspector'
                )
        
        # Ensure we have required data
        if not data.get('inspection_date'):
            from datetime import date
            data['inspection_date'] = date.today().isoformat()
        
        if not data.get('status'):
            data['status'] = 'draft'
        
        # Set inspector
        data['inspector'] = inspector.id
        
        # FIXED: Ensure air_status has a default
        if not data.get('air_status'):
            data['air_status'] = 'on_air'
        
        print(f"📝 Prepared CREATE data: {data}")
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            inspection = serializer.save()
            print(f"✅ Inspection created: {inspection.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ CREATE Validation errors: {serializer.errors}")
            
            # FIXED: Better error handling - show specific field errors
            error_details = {}
            for field, errors in serializer.errors.items():
                error_details[field] = errors if isinstance(errors, list) else [str(errors)]
            
            return Response({
                'errors': error_details,
                'message': 'Validation failed on CREATE',
                'received_data': {k: v for k, v in data.items() if k != 'inspector'}  # Don't expose inspector in error
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, *args, **kwargs):
        """Get individual inspection with ALL fields"""
        print(f"🔍 RETRIEVE request for inspection {kwargs.get('pk')}")
        
        try:
            instance = self.get_object()
            serializer = InspectionSerializer(instance)  # Force use of complete serializer
            print(f"✅ Retrieved inspection: {instance.form_number}")
            print(f"📊 Serialized fields count: {len(serializer.data.keys())}")
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Failed to retrieve inspection: {e}")
            return Response({
                'error': f'Inspection not found: {e}',
                'pk': kwargs.get('pk')
            }, status=status.HTTP_404_NOT_FOUND)
    
    def update(self, request, *args, **kwargs):
        print(f"🔍 UPDATE request data: {request.data}")
        print(f"🔍 UPDATE kwargs: {kwargs}")
        print(f"🔍 UPDATE pk: {kwargs.get('pk')}")
        
        # Get the instance
        try:
            instance = self.get_object()
            print(f"📝 Found inspection to update: {instance.id} - {instance.form_number}")
        except Exception as e:
            print(f"❌ Failed to get inspection object: {e}")
            return Response({
                'error': f'Inspection not found: {e}',
                'pk': kwargs.get('pk')
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prepare data for update
        data = request.data.copy()
        
        # FIXED: Preserve existing values if not provided in update
        if 'inspector' not in data and instance.inspector:
            data['inspector'] = instance.inspector.id
        
        if 'broadcaster' not in data and instance.broadcaster:
            data['broadcaster'] = instance.broadcaster.id
        
        # Make sure we have basic required fields
        if not data.get('inspection_date'):
            data['inspection_date'] = instance.inspection_date
        
        if not data.get('status'):
            data['status'] = instance.status or 'draft'
        
        # FIXED: Preserve air_status and off_air_reason if not provided
        if not data.get('air_status'):
            data['air_status'] = instance.air_status or 'on_air'
        
        # FIXED: If air_status is off_air but no off_air_reason provided, preserve existing one
        if data.get('air_status') == 'off_air' and not data.get('off_air_reason'):
            if instance.off_air_reason:
                data['off_air_reason'] = instance.off_air_reason
                print(f"📝 [Views] Preserving existing off_air_reason: {instance.off_air_reason}")
            else:
                data['off_air_reason'] = 'Pending completion'
                print(f"📝 [Views] Setting placeholder off_air_reason")
        
        print(f"📝 Prepared update data: {data}")
        
        # Use the complete serializer for updates to handle all fields
        serializer = InspectionSerializer(instance, data=data, partial=True)
        if serializer.is_valid():
            updated_inspection = serializer.save()
            print(f"✅ Inspection updated: {updated_inspection.id}")
            return Response(serializer.data)
        else:
            print(f"❌ UPDATE Validation errors: {serializer.errors}")
            
            # FIXED: Better error handling for updates - removed non_field_errors() call
            error_details = {}
            for field, errors in serializer.errors.items():
                error_details[field] = errors if isinstance(errors, list) else [str(errors)]
            
            return Response({
                'errors': error_details,
                'message': 'Validation failed on UPDATE',
                'received_data': {k: v for k, v in data.items() if k not in ['inspector', 'broadcaster']}
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, *args, **kwargs):
        print(f"🔍 PARTIAL UPDATE request")
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        print(f"🔍 LIST request")
        return super().list(request, *args, **kwargs)

@method_decorator(csrf_exempt, name='dispatch')
class AutoSaveView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, inspection_id):
        print(f"🔍 AUTO-SAVE request for inspection {inspection_id}")
        print(f"🔍 AUTO-SAVE data: {request.data}")
        
        try:
            inspection = Inspection.objects.get(id=inspection_id)
            inspection.is_auto_saved = True
            inspection.save()
            print(f"✅ Auto-save successful for inspection {inspection_id}")
            return Response({
                'message': 'Auto-saved successfully',
                'inspection_id': inspection_id,
                'last_saved': inspection.last_saved
            })
        except Inspection.DoesNotExist:
            print(f"❌ Inspection {inspection_id} not found for auto-save")
            return Response({
                'error': 'Inspection not found',
                'inspection_id': inspection_id
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Auto-save failed for inspection {inspection_id}: {e}")
            return Response({
                'error': f'Auto-save failed: {str(e)}',
                'inspection_id': inspection_id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
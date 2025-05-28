# apps/towers/views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Tower
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def test_towers(request):
    """Test endpoint for towers"""
    try:
        count = Tower.objects.count()
        towers = [f"Tower {t.id}" for t in Tower.objects.all()[:5]]
        return Response({
            'message': 'Towers API working!',
            'count': count,
            'towers': towers,
            'status': 'success'
        })
    except Exception as e:
        return Response({
            'message': 'Towers API has issues',
            'error': str(e),
            'status': 'error'
        }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class TowerViewSet(viewsets.ModelViewSet):
    queryset = Tower.objects.all()
    permission_classes = [AllowAny]  # SAME AS INSPECTIONS
    
    def get_serializer_class(self):
        # Simple serializer without complex relationships
        from rest_framework import serializers
        
        class SimpleTowerSerializer(serializers.ModelSerializer):            
            class Meta:
                model = Tower
                fields = '__all__'
                read_only_fields = ('created_at', 'updated_at')
        
        return SimpleTowerSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"🔍 [Towers] CREATE request data: {request.data}")
        
        # Ensure we have required data
        data = request.data.copy()
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            tower = serializer.save()
            print(f"✅ [Towers] Tower created: {tower.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ [Towers] CREATE Validation errors: {serializer.errors}")
            return Response({
                'errors': serializer.errors,
                'message': 'Validation failed on CREATE'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        print(f"🔍 [Towers] UPDATE request data: {request.data}")
        print(f"🔍 [Towers] UPDATE kwargs: {kwargs}")
        
        # Get the instance
        try:
            instance = self.get_object()
            print(f"📝 [Towers] Found tower to update: {instance.id}")
        except Exception as e:
            print(f"❌ [Towers] Failed to get tower object: {e}")
            return Response({
                'error': f'Tower not found: {e}',
                'pk': kwargs.get('pk')
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prepare data for update
        data = request.data.copy()
        print(f"📝 [Towers] Prepared update data: {data}")
        
        # Use partial update
        serializer = self.get_serializer(instance, data=data, partial=True)
        if serializer.is_valid():
            updated_tower = serializer.save()
            print(f"✅ [Towers] Tower updated: {updated_tower.id}")
            return Response(serializer.data)
        else:
            print(f"❌ [Towers] UPDATE Validation errors: {serializer.errors}")
            return Response({
                'errors': serializer.errors,
                'message': 'Validation failed on UPDATE',
                'received_data': data
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request, *args, **kwargs):
        print(f"🔍 [Towers] LIST request")
        return super().list(request, *args, **kwargs)
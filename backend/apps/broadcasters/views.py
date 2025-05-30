from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Broadcaster, GeneralData, ProgramName
from .serializers import (
    BroadcasterSerializer, 
    GeneralDataSerializer, 
    ProgramNameSerializer,
    BroadcasterProgramSerializer
)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_broadcasters(request):
    """Test endpoint for broadcasters"""
    return Response({
        'message': 'Broadcasters API working!',
        'broadcasters_count': Broadcaster.objects.count(),
        'programs_count': ProgramName.objects.count(),
        'broadcasters': [b.name for b in Broadcaster.objects.all()[:5]],
        'programs': [p.name for p in ProgramName.objects.all()[:5]]
    })


class BroadcasterViewSet(viewsets.ModelViewSet):
    queryset = Broadcaster.objects.prefetch_related('programs')
    serializer_class = BroadcasterSerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['get'])
    def programs(self, request, pk=None):
        """Get all programs for a specific broadcaster"""
        broadcaster = self.get_object()
        programs = broadcaster.programs.all()
        serializer = ProgramNameSerializer(programs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_programs(self, request, pk=None):
        """Add programs to a broadcaster"""
        broadcaster = self.get_object()
        serializer = BroadcasterProgramSerializer(data=request.data)
        
        if serializer.is_valid():
            program_ids = serializer.validated_data['program_ids']
            programs = ProgramName.objects.filter(id__in=program_ids)
            
            added_programs = []
            already_associated = []
            
            for program in programs:
                if broadcaster not in program.broadcasters.all():
                    program.add_broadcaster(broadcaster)
                    added_programs.append(program.name)
                else:
                    already_associated.append(program.name)
            
            return Response({
                'message': f'Programs processing completed',
                'added_programs': added_programs,
                'already_associated': already_associated
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def remove_programs(self, request, pk=None):
        """Remove programs from a broadcaster"""
        broadcaster = self.get_object()
        program_ids = request.data.get('program_ids', [])
        
        if not program_ids:
            return Response(
                {'error': 'program_ids is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        programs = ProgramName.objects.filter(id__in=program_ids)
        removed_programs = []
        
        for program in programs:
            if broadcaster in program.broadcasters.all():
                program.broadcasters.remove(broadcaster)
                removed_programs.append(program.name)
        
        return Response({
            'message': f'Removed {len(removed_programs)} programs from broadcaster',
            'removed_programs': removed_programs
        })


class ProgramNameViewSet(viewsets.ModelViewSet):
    queryset = ProgramName.objects.prefetch_related('broadcasters')
    serializer_class = ProgramNameSerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['get'])
    def broadcasters(self, request, pk=None):
        """Get all broadcasters for a specific program"""
        program = self.get_object()
        broadcasters = program.broadcasters.all()
        serializer = BroadcasterSerializer(broadcasters, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_broadcaster(self, request, pk=None):
        """Add a broadcaster to a program"""
        program = self.get_object()
        broadcaster_id = request.data.get('broadcaster_id')
        
        if not broadcaster_id:
            return Response(
                {'error': 'broadcaster_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            broadcaster = Broadcaster.objects.get(id=broadcaster_id)
            
            if broadcaster in program.broadcasters.all():
                return Response(
                    {'error': 'Broadcaster is already associated with this program'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            program.add_broadcaster(broadcaster)
            return Response({
                'message': f'Broadcaster "{broadcaster.name}" added to program "{program.name}"'
            })
            
        except Broadcaster.DoesNotExist:
            return Response(
                {'error': 'Broadcaster not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_broadcaster(self, request, pk=None):
        """Remove a broadcaster from a program"""
        program = self.get_object()
        broadcaster_id = request.data.get('broadcaster_id')
        
        if not broadcaster_id:
            return Response(
                {'error': 'broadcaster_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            broadcaster = Broadcaster.objects.get(id=broadcaster_id)
            
            if broadcaster not in program.broadcasters.all():
                return Response(
                    {'error': 'Broadcaster is not associated with this program'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            program.broadcasters.remove(broadcaster)
            return Response({
                'message': f'Broadcaster "{broadcaster.name}" removed from program "{program.name}"'
            })
            
        except Broadcaster.DoesNotExist:
            return Response(
                {'error': 'Broadcaster not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class GeneralDataViewSet(viewsets.ModelViewSet):
    queryset = GeneralData.objects.select_related('broadcaster')
    serializer_class = GeneralDataSerializer
    permission_classes = [AllowAny]
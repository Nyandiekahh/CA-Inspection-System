from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Broadcaster, GeneralData
from .serializers import BroadcasterSerializer, GeneralDataSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def test_broadcasters(request):
    """Test endpoint for broadcasters"""
    return Response({
        'message': 'Broadcasters API working!',
        'count': Broadcaster.objects.count(),
        'broadcasters': [b.name for b in Broadcaster.objects.all()[:5]]
    })

class BroadcasterViewSet(viewsets.ModelViewSet):
    queryset = Broadcaster.objects.all()
    serializer_class = BroadcasterSerializer
    permission_classes = [AllowAny]  # NO AUTHENTICATION

class GeneralDataViewSet(viewsets.ModelViewSet):
    queryset = GeneralData.objects.select_related('broadcaster')
    serializer_class = GeneralDataSerializer
    permission_classes = [AllowAny]  # NO AUTHENTICATION
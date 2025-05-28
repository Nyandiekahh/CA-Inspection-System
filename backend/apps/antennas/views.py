# apps/antennas/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AntennaSystem
from rest_framework import serializers

class AntennaSystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntennaSystem
        fields = '__all__'

class AntennaSystemViewSet(viewsets.ModelViewSet):
    queryset = AntennaSystem.objects.select_related('general_data__broadcaster')
    serializer_class = AntennaSystemSerializer
    permission_classes = [IsAuthenticated]
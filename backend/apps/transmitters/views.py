# apps/transmitters/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Exciter, Amplifier, Filter, StudioTransmitterLink
from rest_framework import serializers

class ExciterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exciter
        fields = '__all__'

class AmplifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Amplifier
        fields = '__all__'

class FilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filter
        fields = '__all__'

class StudioTransmitterLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudioTransmitterLink
        fields = '__all__'

class ExciterViewSet(viewsets.ModelViewSet):
    queryset = Exciter.objects.select_related('general_data__broadcaster')
    serializer_class = ExciterSerializer
    permission_classes = [IsAuthenticated]

class AmplifierViewSet(viewsets.ModelViewSet):
    queryset = Amplifier.objects.select_related('general_data__broadcaster')
    serializer_class = AmplifierSerializer
    permission_classes = [IsAuthenticated]

class FilterViewSet(viewsets.ModelViewSet):
    queryset = Filter.objects.select_related('general_data__broadcaster')
    serializer_class = FilterSerializer
    permission_classes = [IsAuthenticated]

class StudioTransmitterLinkViewSet(viewsets.ModelViewSet):
    queryset = StudioTransmitterLink.objects.select_related('general_data__broadcaster')
    serializer_class = StudioTransmitterLinkSerializer
    permission_classes = [IsAuthenticated]
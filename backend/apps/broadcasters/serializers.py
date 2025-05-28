from rest_framework import serializers
from .models import Broadcaster, GeneralData

class BroadcasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broadcaster
        fields = '__all__'

class GeneralDataSerializer(serializers.ModelSerializer):
    broadcaster_name = serializers.CharField(source='broadcaster.name', read_only=True)
    
    class Meta:
        model = GeneralData
        fields = '__all__'
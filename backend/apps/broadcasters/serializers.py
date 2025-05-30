from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Broadcaster, GeneralData, ProgramName

class ProgramNameSerializer(serializers.ModelSerializer):
    broadcasters_count = serializers.SerializerMethodField()
    broadcaster_names = serializers.SerializerMethodField()
    
    class Meta:
        model = ProgramName
        fields = ['id', 'name', 'description', 'broadcasters', 'broadcasters_count', 
                 'broadcaster_names', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_broadcasters_count(self, obj):
        return obj.broadcasters.count()
    
    def get_broadcaster_names(self, obj):
        return [broadcaster.name for broadcaster in obj.broadcasters.all()]


class BroadcasterSerializer(serializers.ModelSerializer):
    programs_count = serializers.SerializerMethodField()
    program_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Broadcaster
        fields = ['id', 'name', 'po_box', 'postal_code', 'town', 'location', 'street',
                 'phone_numbers', 'contact_name', 'contact_address', 'contact_phone',
                 'contact_email', 'programs_count', 'program_names', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_programs_count(self, obj):
        return obj.programs.count()
    
    def get_program_names(self, obj):
        return [program.name for program in obj.programs.all()]


class GeneralDataSerializer(serializers.ModelSerializer):
    broadcaster_name = serializers.CharField(source='broadcaster.name', read_only=True)
    program_name_display = serializers.CharField(source='program_name.name', read_only=True)
    air_status_display = serializers.CharField(source='get_air_status_display', read_only=True)
    
    class Meta:
        model = GeneralData
        fields = '__all__'
        
    def validate(self, data):
        """Custom validation for air status and reason"""
        air_status = data.get('air_status')
        off_air_reason = data.get('off_air_reason', '').strip()
        
        if air_status == 'off_air' and not off_air_reason:
            raise serializers.ValidationError({
                'off_air_reason': 'This field is required when station is OFF AIR.'
            })
        
        return data


# Specialized serializer for adding/removing programs from broadcasters
class BroadcasterProgramSerializer(serializers.Serializer):
    program_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of program IDs to associate with this broadcaster"
    )
    
    def validate_program_ids(self, value):
        """Validate that all program IDs exist"""
        programs = ProgramName.objects.filter(id__in=value)
        
        if len(programs) != len(value):
            raise serializers.ValidationError("One or more program IDs are invalid.")
        
        return value
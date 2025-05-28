# apps/inspections/serializers.py - FIXED VERSION
from rest_framework import serializers
from .models import Inspection
from apps.broadcasters.models import Broadcaster

class InspectionSerializer(serializers.ModelSerializer):
    """Complete serializer with ALL fields for detailed views"""
    broadcaster_name = serializers.CharField(source='broadcaster.name', read_only=True, allow_null=True)
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Inspection
        fields = '__all__'  # This includes ALL fields from the model
        read_only_fields = ('form_number', 'last_saved', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        # Get or create broadcaster if needed
        broadcaster = validated_data.get('broadcaster')
        if not broadcaster:
            # If no broadcaster provided, create a default one
            broadcaster, created = Broadcaster.objects.get_or_create(
                name='Default Broadcaster',
                defaults={'po_box': '', 'town': '', 'location': ''}
            )
            validated_data['broadcaster'] = broadcaster
        
        return super().create(validated_data)

class SimpleInspectionSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views and basic operations"""
    broadcaster_name = serializers.CharField(source='broadcaster.name', read_only=True, allow_null=True)
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Inspection
        fields = [
            'id', 'form_number', 'broadcaster', 'broadcaster_name', 
            'inspection_date', 'status', 'inspector', 'inspector_name',
            'technical_personnel', 'other_observations', 'last_saved',
            'is_auto_saved', 'created_at', 'updated_at'
        ]
        read_only_fields = ('form_number', 'last_saved', 'created_at', 'updated_at')
    
    def validate(self, data):
        """Custom validation"""
        print(f"🔍 Serializer validating data: {data}")
        
        # Check if this is an update
        if self.instance:
            print(f"📝 This is an UPDATE for inspection {self.instance.id}")
            # For updates, we can be more flexible
            if 'broadcaster' not in data and self.instance.broadcaster:
                data['broadcaster'] = self.instance.broadcaster
            if 'inspector' not in data and self.instance.inspector:
                data['inspector'] = self.instance.inspector
        else:
            print(f"🆕 This is a CREATE operation")
            # For creates, ensure we have required fields
            if 'broadcaster' not in data:
                raise serializers.ValidationError("Broadcaster is required for new inspections")
        
        return data
    
    def update(self, instance, validated_data):
        """Custom update method"""
        print(f"📝 Updating inspection {instance.id} with data: {validated_data}")
        
        # Update only the fields that are provided
        for field, value in validated_data.items():
            if hasattr(instance, field):
                setattr(instance, field, value)
        
        instance.save()
        print(f"✅ Inspection {instance.id} updated successfully")
        return instance
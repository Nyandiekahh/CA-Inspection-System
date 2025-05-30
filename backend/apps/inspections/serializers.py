# apps/inspections/serializers.py - COMPLETE FIXED VERSION
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
    
    def validate(self, data):
        """Custom validation"""
        print(f"🔍 [InspectionSerializer] Validating data: {data}")
        
        # Validate air status and off_air_reason - BUT ONLY FOR COMPLETE FORMS
        air_status = data.get('air_status')
        off_air_reason = data.get('off_air_reason', '').strip() if data.get('off_air_reason') else ''
        
        # FIXED: Only validate off_air_reason if this is a complete form submission
        # For partial updates (like between steps), be more lenient
        if air_status == 'off_air' and not off_air_reason:
            # Check if this is an update and preserve existing off_air_reason
            if self.instance and hasattr(self.instance, 'off_air_reason') and self.instance.off_air_reason:
                # Use existing off_air_reason from database
                data['off_air_reason'] = self.instance.off_air_reason
                print(f"📝 [InspectionSerializer] Preserving existing off_air_reason: {self.instance.off_air_reason}")
            else:
                # Only raise error if this seems like a final submission (has meaningful data)
                status = data.get('status', '')
                has_significant_data = any([
                    data.get('technical_personnel'),
                    data.get('other_observations'),
                    data.get('inspector_signature_date'),
                    status == 'completed'
                ])
                
                if has_significant_data:
                    raise serializers.ValidationError({
                        'off_air_reason': 'This field is required when station is OFF AIR.'
                    })
                else:
                    # For drafts/partial updates, just set a placeholder
                    data['off_air_reason'] = 'Pending completion'
                    print(f"📝 [InspectionSerializer] Setting placeholder off_air_reason for draft")
        
        return data
    
    def create(self, validated_data):
        print(f"🆕 [InspectionSerializer] Creating inspection with data: {validated_data}")
        
        # Handle broadcaster - make it optional for draft inspections
        if 'broadcaster' not in validated_data or not validated_data['broadcaster']:
            # Create a default broadcaster if none provided
            default_broadcaster, created = Broadcaster.objects.get_or_create(
                name='Unknown Broadcaster',
                defaults={
                    'po_box': '',
                    'town': '',
                    'location': '',
                    'contact_name': 'TBD',
                    'contact_phone': '',
                    'contact_email': ''
                }
            )
            validated_data['broadcaster'] = default_broadcaster
            print(f"📝 [InspectionSerializer] Using default broadcaster: {default_broadcaster}")
        
        # Set default inspector if not provided (for auto-save scenarios)
        if 'inspector' not in validated_data or not validated_data['inspector']:
            # Try to get the first available user (inspector)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            inspector = User.objects.filter(is_staff=True).first()
            if inspector:
                validated_data['inspector'] = inspector
                print(f"📝 [InspectionSerializer] Using default inspector: {inspector}")
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        print(f"📝 [InspectionSerializer] Updating inspection {instance.id} with data: {validated_data}")
        
        # Update only the fields that are provided
        for field, value in validated_data.items():
            if hasattr(instance, field):
                setattr(instance, field, value)
        
        instance.save()
        print(f"✅ [InspectionSerializer] Inspection {instance.id} updated successfully")
        return instance


class SimpleInspectionSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views and basic operations"""
    broadcaster_name = serializers.CharField(source='broadcaster.name', read_only=True, allow_null=True)
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Inspection
        fields = [
            'id', 'form_number', 'broadcaster', 'broadcaster_name', 
            'inspection_date', 'status', 'inspector', 'inspector_name',
            'program_name', 'air_status', 'off_air_reason', 'program',  # ADDED THESE FIELDS
            'technical_personnel', 'other_observations', 'last_saved',
            'is_auto_saved', 'created_at', 'updated_at'
        ]
        read_only_fields = ('form_number', 'last_saved', 'created_at', 'updated_at')
    
    def validate(self, data):
        """Custom validation"""
        print(f"🔍 [SimpleInspectionSerializer] Validating data: {data}")
        
        # Validate air status and off_air_reason - BUT ONLY FOR COMPLETE FORMS
        air_status = data.get('air_status')
        off_air_reason = data.get('off_air_reason', '').strip() if data.get('off_air_reason') else ''
        
        # FIXED: Only validate off_air_reason if this is a complete form submission
        if air_status == 'off_air' and not off_air_reason:
            # Check if this is an update and preserve existing off_air_reason
            if self.instance and hasattr(self.instance, 'off_air_reason') and self.instance.off_air_reason:
                # Use existing off_air_reason from database
                data['off_air_reason'] = self.instance.off_air_reason
                print(f"📝 [SimpleInspectionSerializer] Preserving existing off_air_reason: {self.instance.off_air_reason}")
            else:
                # Only raise error if this seems like a final submission
                status = data.get('status', '')
                has_significant_data = any([
                    data.get('technical_personnel'),
                    data.get('other_observations'),
                    status == 'completed'
                ])
                
                if has_significant_data:
                    raise serializers.ValidationError({
                        'off_air_reason': 'This field is required when station is OFF AIR.'
                    })
                else:
                    # For drafts/partial updates, just set a placeholder
                    data['off_air_reason'] = 'Pending completion'
                    print(f"📝 [SimpleInspectionSerializer] Setting placeholder off_air_reason for draft")
        
        # Check if this is an update
        if self.instance:
            print(f"📝 This is an UPDATE for inspection {self.instance.id}")
            # For updates, we can be more flexible with broadcaster
            if 'broadcaster' not in data and self.instance.broadcaster:
                data['broadcaster'] = self.instance.broadcaster
            if 'inspector' not in data and self.instance.inspector:
                data['inspector'] = self.instance.inspector
        else:
            print(f"🆕 This is a CREATE operation")
            # For creates, we'll handle missing broadcaster in create method
        
        return data
    
    def create(self, validated_data):
        print(f"🆕 [SimpleInspectionSerializer] Creating inspection with data: {validated_data}")
        
        # Handle broadcaster - make it optional for draft inspections  
        if 'broadcaster' not in validated_data or not validated_data['broadcaster']:
            # Create a default broadcaster if none provided
            default_broadcaster, created = Broadcaster.objects.get_or_create(
                name='Unknown Broadcaster',
                defaults={
                    'po_box': '',
                    'town': '',
                    'location': '',
                    'contact_name': 'TBD',
                    'contact_phone': '',
                    'contact_email': ''
                }
            )
            validated_data['broadcaster'] = default_broadcaster
            print(f"📝 [SimpleInspectionSerializer] Using default broadcaster: {default_broadcaster}")
        
        # Set default inspector if not provided
        if 'inspector' not in validated_data or not validated_data['inspector']:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            inspector = User.objects.filter(is_staff=True).first()
            if inspector:
                validated_data['inspector'] = inspector
                print(f"📝 [SimpleInspectionSerializer] Using default inspector: {inspector}")
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Custom update method"""
        print(f"📝 [SimpleInspectionSerializer] Updating inspection {instance.id} with data: {validated_data}")
        
        # Update only the fields that are provided
        for field, value in validated_data.items():
            if hasattr(instance, field):
                setattr(instance, field, value)
        
        instance.save()
        print(f"✅ [SimpleInspectionSerializer] Inspection {instance.id} updated successfully")
        return instance
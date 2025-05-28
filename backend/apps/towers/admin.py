from django.contrib import admin
from .models import Tower

@admin.register(Tower)
class TowerAdmin(admin.ModelAdmin):
    list_display = ('general_data', 'tower_owner_name', 'height_above_ground', 'tower_type', 'installation_year', 'has_insurance')
    list_filter = ('tower_type', 'rust_protection', 'has_insurance', 'has_lightning_protection', 'created_at')
    search_fields = ('general_data__broadcaster__name', 'tower_owner_name', 'manufacturer_name')
    
    fieldsets = (
        ('Tower Owner & Location', {
            'fields': ('general_data', 'tower_owner_name')
        }),
        ('Tower Specifications', {
            'fields': ('height_above_ground', 'above_building_roof', 'building_height', 'tower_type', 'tower_type_other', 'rust_protection')
        }),
        ('Manufacturer Details', {
            'fields': ('installation_year', 'manufacturer_name', 'model_number')
        }),
        ('Load Specifications', {
            'fields': ('maximum_wind_load', 'maximum_load_charge')
        }),
        ('Safety & Insurance', {
            'fields': ('has_insurance', 'insurance_company', 'has_concrete_base', 'has_lightning_protection', 'is_electrically_grounded', 'has_aviation_warning_light')
        }),
        ('Additional Equipment', {
            'fields': ('has_other_antennas', 'other_antennas_details')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('general_data__broadcaster')
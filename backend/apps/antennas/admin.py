from django.contrib import admin
from .models import AntennaSystem

@admin.register(AntennaSystem)
class AntennaSystemAdmin(admin.ModelAdmin):
    list_display = ('general_data', 'manufacturer', 'model_number', 'antenna_type', 'polarization', 'effective_radiated_power')
    list_filter = ('polarization', 'horizontal_pattern', 'has_mechanical_tilt', 'has_electrical_tilt', 'created_at')
    search_fields = ('general_data__broadcaster__name', 'manufacturer', 'model_number', 'antenna_type')
    
    fieldsets = (
        ('Location & Basic Info', {
            'fields': ('general_data', 'height_on_tower', 'antenna_type', 'manufacturer', 'model_number')
        }),
        ('Polarization & Pattern', {
            'fields': ('polarization', 'horizontal_pattern')
        }),
        ('Horizontal Pattern Details', {
            'fields': ('beam_width_3db', 'max_gain_azimuth', 'horizontal_pattern_table')
        }),
        ('Vertical Pattern - Mechanical Tilt', {
            'fields': ('has_mechanical_tilt', 'mechanical_tilt_degree')
        }),
        ('Vertical Pattern - Electrical Tilt', {
            'fields': ('has_electrical_tilt', 'electrical_tilt_degree')
        }),
        ('Vertical Pattern - Null Fill', {
            'fields': ('has_null_fill', 'null_fill_percentage')
        }),
        ('Vertical Pattern Table', {
            'fields': ('vertical_pattern_table',)
        }),
        ('System Performance', {
            'fields': ('antenna_gain', 'estimated_antenna_losses', 'estimated_feeder_losses', 'estimated_multiplexer_losses', 'effective_radiated_power')
        }),
        ('Documentation', {
            'fields': ('antenna_catalog_attached',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('general_data__broadcaster')
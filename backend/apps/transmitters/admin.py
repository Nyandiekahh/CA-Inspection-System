from django.contrib import admin
from .models import Exciter, Amplifier, Filter, StudioTransmitterLink

@admin.register(Exciter)
class ExciterAdmin(admin.ModelAdmin):
    list_display = ('general_data', 'manufacturer', 'model_number', 'serial_number', 'nominal_power', 'actual_reading')
    list_filter = ('manufacturer', 'created_at')
    search_fields = ('general_data__broadcaster__name', 'manufacturer', 'model_number', 'serial_number')
    
    fieldsets = (
        ('Location', {
            'fields': ('general_data',)
        }),
        ('Equipment Details', {
            'fields': ('manufacturer', 'model_number', 'serial_number')
        }),
        ('Power Specifications', {
            'fields': ('nominal_power', 'actual_reading')
        }),
    )

@admin.register(Amplifier)
class AmplifierAdmin(admin.ModelAdmin):
    list_display = ('general_data', 'manufacturer', 'model_number', 'transmit_frequency', 'nominal_power', 'actual_reading')
    list_filter = ('manufacturer', 'has_internal_audio_limiter', 'has_internal_stereo_coder', 'created_at')
    search_fields = ('general_data__broadcaster__name', 'manufacturer', 'model_number', 'serial_number')
    
    fieldsets = (
        ('Location', {
            'fields': ('general_data',)
        }),
        ('Equipment Details', {
            'fields': ('manufacturer', 'model_number', 'serial_number')
        }),
        ('Power & Connection', {
            'fields': ('nominal_power', 'actual_reading', 'rf_output_connector_type')
        }),
        ('Frequency Specifications', {
            'fields': ('frequency_range', 'transmit_frequency', 'frequency_stability')
        }),
        ('Signal Quality', {
            'fields': ('harmonics_suppression_level', 'spurious_emission_level')
        }),
        ('Features', {
            'fields': ('has_internal_audio_limiter', 'has_internal_stereo_coder', 'transmitter_catalog_attached', 'transmit_bandwidth')
        }),
    )

@admin.register(Filter)
class FilterAdmin(admin.ModelAdmin):
    list_display = ('general_data', 'filter_type', 'manufacturer', 'model_number', 'frequency')
    list_filter = ('filter_type', 'manufacturer', 'created_at')
    search_fields = ('general_data__broadcaster__name', 'manufacturer', 'model_number')

@admin.register(StudioTransmitterLink)
class StudioTransmitterLinkAdmin(admin.ModelAdmin):
    list_display = ('general_data', 'manufacturer', 'model_number', 'frequency', 'polarization')
    list_filter = ('manufacturer', 'created_at')
    search_fields = ('general_data__broadcaster__name', 'manufacturer', 'model_number')
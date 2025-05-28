from django.contrib import admin
from .models import Inspection

@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ['form_number', 'broadcaster', 'status', 'inspection_date', 'inspector']
    list_filter = ['status', 'inspection_date', 'station_type', 'tower_type']
    search_fields = ['form_number', 'broadcaster__name', 'broadcaster_name']
    readonly_fields = ['form_number', 'created_at', 'updated_at', 'last_saved']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('form_number', 'broadcaster', 'inspection_date', 'status', 'inspector')
        }),
        ('Step 1: Administrative Information', {
            'fields': ('broadcaster_name', 'po_box', 'postal_code', 'town', 'location', 'street', 'phone_numbers'),
            'classes': ('collapse',)
        }),
        ('Step 1: Contact Information', {
            'fields': ('contact_name', 'contact_phone', 'contact_email', 'contact_address'),
            'classes': ('collapse',)
        }),
        ('Step 1: General Data', {
            'fields': ('station_type', 'transmitting_site_name', 'longitude', 'latitude', 'physical_location', 'physical_street', 'physical_area', 'altitude', 'land_owner_name', 'other_telecoms_operator', 'telecoms_operator_details'),
            'classes': ('collapse',)
        }),
        ('Step 2: Tower Information', {
            'fields': ('tower_owner_name', 'height_above_ground', 'above_building_roof', 'building_height', 'tower_type', 'tower_type_other', 'rust_protection', 'installation_year', 'manufacturer_name', 'model_number', 'maximum_wind_load', 'maximum_load_charge', 'has_insurance', 'insurance_company', 'has_concrete_base', 'has_lightning_protection', 'is_electrically_grounded', 'has_aviation_warning_light', 'has_other_antennas', 'other_antennas_details'),
            'classes': ('collapse',)
        }),
        ('Step 3: Exciter', {
            'fields': ('exciter_manufacturer', 'exciter_model_number', 'exciter_serial_number', 'exciter_nominal_power', 'exciter_actual_reading'),
            'classes': ('collapse',)
        }),
        ('Step 3: Amplifier', {
            'fields': ('amplifier_manufacturer', 'amplifier_model_number', 'amplifier_serial_number', 'amplifier_nominal_power', 'amplifier_actual_reading', 'rf_output_connector_type', 'frequency_range', 'transmit_frequency', 'frequency_stability', 'harmonics_suppression_level', 'spurious_emission_level', 'has_internal_audio_limiter', 'has_internal_stereo_coder', 'transmitter_catalog_attached', 'transmit_bandwidth'),
            'classes': ('collapse',)
        }),
        ('Step 3: Filter', {
            'fields': ('filter_type', 'filter_manufacturer', 'filter_model_number', 'filter_serial_number', 'filter_frequency'),
            'classes': ('collapse',)
        }),
        ('Step 4: Antenna System', {
            'fields': ('height_on_tower', 'antenna_type', 'antenna_manufacturer', 'antenna_model_number', 'polarization', 'horizontal_pattern', 'beam_width_3db', 'max_gain_azimuth', 'horizontal_pattern_table', 'has_mechanical_tilt', 'mechanical_tilt_degree', 'has_electrical_tilt', 'electrical_tilt_degree', 'has_null_fill', 'null_fill_percentage', 'vertical_pattern_table', 'antenna_gain', 'estimated_antenna_losses', 'estimated_feeder_losses', 'estimated_multiplexer_losses', 'effective_radiated_power', 'antenna_catalog_attached'),
            'classes': ('collapse',)
        }),
        ('Step 4: Studio Link', {
            'fields': ('studio_manufacturer', 'studio_model_number', 'studio_serial_number', 'studio_frequency', 'studio_polarization', 'signal_description'),
            'classes': ('collapse',)
        }),
        ('Final Information', {
            'fields': ('technical_personnel', 'other_observations', 'inspector_signature_date', 'contact_signature_date', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('last_saved', 'is_auto_saved', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
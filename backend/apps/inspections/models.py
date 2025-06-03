from django.db import models
from django.contrib.auth import get_user_model
from apps.broadcasters.models import Broadcaster

User = get_user_model()

class Inspection(models.Model):
    """Main Inspection Form - Orchestrates all sections"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('reviewed', 'Reviewed'),
    ]
    
    # Form identification
    form_number = models.CharField(max_length=20, unique=True, verbose_name="Form Number (CA/F/PSM/17)")
    
    # FIXED: Make broadcaster optional
    broadcaster = models.ForeignKey(
        Broadcaster, 
        on_delete=models.CASCADE, 
        related_name='inspections',
        null=True,  # Allow NULL in database
        blank=True  # Allow empty in forms/serializers
    )
    
    # Inspection details
    inspection_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Inspector information
    inspector = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inspections')
    
    # ============= MISSING FIELDS - ADDED =============
    # Program and air status fields (from frontend Step1)
    program_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Program Name")
    air_status = models.CharField(
        max_length=10, 
        choices=[('on_air', 'ON AIR'), ('off_air', 'OFF AIR')], 
        default='on_air',
        verbose_name="Air Status"
    )
    off_air_reason = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Reason for being OFF AIR (if applicable)"
    )
    
    # Optional: Program foreign key for better data modeling
    program = models.ForeignKey(
        'broadcasters.ProgramName', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='inspections',
        verbose_name="Program Reference"
    )
    # ====================================================
    
    # ============= STEP 1: ADMINISTRATIVE & GENERAL DATA =============
    # Broadcaster details (duplicated for form filling convenience)
    broadcaster_name = models.CharField(max_length=255, blank=True, null=True)
    po_box = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    town = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    street = models.CharField(max_length=255, blank=True, null=True)
    phone_numbers = models.TextField(blank=True, null=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_address = models.TextField(blank=True, null=True)
    
    # General data
    station_type = models.CharField(max_length=10, choices=[
        ('DAB', 'DAB (Digital Audio Broadcasting)'),
        ('FM', 'FM (Frequency Modulation)'),
        ('DTT', 'DTT (Digital Terrestrial Television) / DVB-T')
    ], blank=True, null=True)
    transmitting_site_name = models.CharField(max_length=255, blank=True, null=True)
    longitude = models.CharField(max_length=50, blank=True, null=True)
    latitude = models.CharField(max_length=50, blank=True, null=True)
    physical_location = models.CharField(max_length=255, blank=True, null=True)
    physical_street = models.CharField(max_length=255, blank=True, null=True)
    physical_area = models.CharField(max_length=255, blank=True, null=True)
    altitude = models.CharField(max_length=50, blank=True, null=True)
    land_owner_name = models.CharField(max_length=255, blank=True, null=True)
    other_telecoms_operator = models.BooleanField(default=False)
    telecoms_operator_details = models.TextField(blank=True, null=True)
    
    # ============= STEP 2: TOWER INFORMATION =============
    tower_owner_name = models.CharField(max_length=255, blank=True, null=True)
    height_above_ground = models.CharField(max_length=50, blank=True, null=True)
    above_building_roof = models.BooleanField(default=False)
    building_height = models.CharField(max_length=50, blank=True, null=True)
    tower_type = models.CharField(max_length=50, choices=[
        ('guyed', 'Guyed'),
        ('self_supporting', 'Self-Supporting'),
        ('other', 'Others')
    ], blank=True, null=True)
    tower_type_other = models.CharField(max_length=255, blank=True, null=True)
    rust_protection = models.CharField(max_length=50, choices=[
        ('galvanized', 'Galvanized'),
        ('painted', 'Painted'),
        ('aluminum', 'Aluminum'),
        ('no_protection', 'No Rust Protection')
    ], blank=True, null=True)
    installation_year = models.CharField(max_length=4, blank=True, null=True)
    manufacturer_name = models.CharField(max_length=255, blank=True, null=True)
    model_number = models.CharField(max_length=255, blank=True, null=True)
    maximum_wind_load = models.CharField(max_length=50, blank=True, null=True)
    maximum_load_charge = models.CharField(max_length=50, blank=True, null=True)
    has_insurance = models.BooleanField(default=False)
    insurance_company = models.CharField(max_length=255, blank=True, null=True)
    has_concrete_base = models.BooleanField(default=False)
    has_lightning_protection = models.BooleanField(default=False)
    is_electrically_grounded = models.BooleanField(default=False)
    has_aviation_warning_light = models.BooleanField(default=False)
    has_other_antennas = models.BooleanField(default=False)
    other_antennas_details = models.TextField(blank=True, null=True)
    
    # ============= STEP 3: TRANSMITTER INFORMATION =============
    # Exciter
    exciter_manufacturer = models.CharField(max_length=255, blank=True, null=True)
    exciter_model_number = models.CharField(max_length=255, blank=True, null=True)
    exciter_serial_number = models.CharField(max_length=255, blank=True, null=True)
    exciter_nominal_power = models.CharField(max_length=50, blank=True, null=True)
    exciter_actual_reading = models.CharField(max_length=50, blank=True, null=True)
    
    # Amplifier
    amplifier_manufacturer = models.CharField(max_length=255, blank=True, null=True)
    amplifier_model_number = models.CharField(max_length=255, blank=True, null=True)
    amplifier_serial_number = models.CharField(max_length=255, blank=True, null=True)
    amplifier_nominal_power = models.CharField(max_length=50, blank=True, null=True)
    amplifier_actual_reading = models.CharField(max_length=50, blank=True, null=True)
    rf_output_connector_type = models.CharField(max_length=255, blank=True, null=True)
    frequency_range = models.CharField(max_length=255, blank=True, null=True)
    transmit_frequency = models.CharField(max_length=255, blank=True, null=True)
    frequency_stability = models.CharField(max_length=50, blank=True, null=True)
    harmonics_suppression_level = models.CharField(max_length=50, blank=True, null=True)
    spurious_emission_level = models.CharField(max_length=50, blank=True, null=True)
    has_internal_audio_limiter = models.BooleanField(default=False)
    has_internal_stereo_coder = models.BooleanField(default=False)
    transmitter_catalog_attached = models.BooleanField(default=False)
    transmit_bandwidth = models.CharField(max_length=255, blank=True, null=True)
    
    # Filter
    filter_type = models.CharField(max_length=50, choices=[
        ('standard_band_pass', 'Standard Band Pass Filter'),
        ('notch', 'Notch Filter'),
        ('high_q_triple_cavity', 'High-Q Triple Cavity Filter'),
    ], blank=True, null=True)
    filter_manufacturer = models.CharField(max_length=255, blank=True, null=True)
    filter_model_number = models.CharField(max_length=255, blank=True, null=True)
    filter_serial_number = models.CharField(max_length=255, blank=True, null=True)
    filter_frequency = models.CharField(max_length=255, blank=True, null=True)
    
    # ============= STEP 4: ANTENNA SYSTEM & FINAL =============
    # Antenna System
    height_on_tower = models.CharField(max_length=50, blank=True, null=True)
    antenna_type = models.CharField(max_length=255, blank=True, null=True)
    antenna_manufacturer = models.CharField(max_length=255, blank=True, null=True)
    antenna_model_number = models.CharField(max_length=255, blank=True, null=True)
    polarization = models.CharField(max_length=50, choices=[
        ('vertical', 'Vertical'),
        ('horizontal', 'Horizontal'),
        ('circular', 'Circular'),
        ('elliptical', 'Elliptical')
    ], blank=True, null=True)
    horizontal_pattern = models.CharField(max_length=50, choices=[
        ('omni_directional', 'Omni directional'),
        ('directional', 'Directional')
    ], blank=True, null=True)
    beam_width_3db = models.CharField(max_length=50, blank=True, null=True)
    max_gain_azimuth = models.CharField(max_length=50, blank=True, null=True)
    horizontal_pattern_table = models.TextField(blank=True, null=True)
    has_mechanical_tilt = models.BooleanField(default=False)
    mechanical_tilt_degree = models.CharField(max_length=50, blank=True, null=True)
    has_electrical_tilt = models.BooleanField(default=False)
    electrical_tilt_degree = models.CharField(max_length=50, blank=True, null=True)
    has_null_fill = models.BooleanField(default=False)
    null_fill_percentage = models.CharField(max_length=50, blank=True, null=True)
    vertical_pattern_table = models.TextField(blank=True, null=True)
    antenna_gain = models.CharField(max_length=50, blank=True, null=True)
    estimated_antenna_losses = models.CharField(max_length=50, blank=True, null=True)
    estimated_feeder_losses = models.CharField(max_length=50, blank=True, null=True)
    estimated_multiplexer_losses = models.CharField(max_length=50, blank=True, null=True)
    estimated_system_losses = models.CharField(max_length=50, blank=True, null=True)  # NEW FIELD
    effective_radiated_power = models.CharField(max_length=50, blank=True, null=True)
    effective_radiated_power_dbw = models.CharField(max_length=50, blank=True, null=True, verbose_name="Effective Radiated Power (dBW)")

    antenna_catalog_attached = models.BooleanField(default=False)
    
    # Studio Link
    studio_manufacturer = models.CharField(max_length=255, blank=True, null=True)
    studio_model_number = models.CharField(max_length=255, blank=True, null=True)
    studio_serial_number = models.CharField(max_length=255, blank=True, null=True)
    studio_frequency = models.CharField(max_length=50, blank=True, null=True)
    studio_polarization = models.CharField(max_length=255, blank=True, null=True)
    stl_type = models.CharField(max_length=50, choices=[  # NEW FIELD
        ('ip_based', 'IP-Based STL (Internet Protocol)'),
        ('satellite', 'Satellite STL'),
        ('vhf', 'VHF STL'),
        ('studio_on_site', 'Studio On Site (SOS)')
    ], blank=True, null=True)
    signal_description = models.TextField(blank=True, null=True)
    
    # ============= FINAL INFORMATION =============
    technical_personnel = models.CharField(max_length=255, blank=True, null=True, verbose_name="Name of Technical Personnel responsible for Maintenance")
    other_observations = models.TextField(blank=True, null=True, verbose_name="Any Other Observations")
    
    # Signatures and completion
    inspector_signature_date = models.DateField(null=True, blank=True)
    contact_signature_date = models.DateField(null=True, blank=True)
    
    # Auto-save tracking
    last_saved = models.DateTimeField(auto_now=True)
    is_auto_saved = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.form_number:
            # Generate form number: CA/F/PSM/YY/XXXX
            from datetime import datetime
            year = datetime.now().year % 100  # Last 2 digits of year
            last_inspection = Inspection.objects.filter(
                form_number__startswith=f'CA/F/PSM/{year:02d}/'
            ).order_by('-created_at').first()
            
            if last_inspection:
                last_num = int(last_inspection.form_number.split('/')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.form_number = f'CA/F/PSM/{year:02d}/{new_num:04d}'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        broadcaster_name = self.broadcaster.name if self.broadcaster else 'Unknown Broadcaster'
        return f"{self.form_number} - {broadcaster_name}"
    
    class Meta:
        db_table = 'inspections'
        ordering = ['-created_at']
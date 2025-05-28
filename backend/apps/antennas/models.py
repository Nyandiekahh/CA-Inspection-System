from django.db import models
from apps.broadcasters.models import GeneralData

class AntennaSystem(models.Model):
    """Antenna System Information"""
    POLARIZATION_TYPES = [
        ('vertical', 'Vertical'),
        ('horizontal', 'Horizontal'),
        ('circular', 'Circular'),
        ('elliptical', 'Elliptical'),
    ]
    
    PATTERN_TYPES = [
        ('omni_directional', 'Omni directional'),
        ('directional', 'Directional'),
    ]
    
    general_data = models.ForeignKey(GeneralData, on_delete=models.CASCADE, related_name='antenna_systems')
    
    # Basic antenna info
    height_on_tower = models.CharField(max_length=50, verbose_name="Height the Antenna on the Tower/Mast (m)")
    antenna_type = models.CharField(max_length=100, verbose_name="Type of Antenna")
    manufacturer = models.CharField(max_length=200, blank=True, verbose_name="Antenna Manufacturer")
    model_number = models.CharField(max_length=100, blank=True, verbose_name="Antenna Model Number")
    
    # Polarization and pattern
    polarization = models.CharField(max_length=20, choices=POLARIZATION_TYPES)
    horizontal_pattern = models.CharField(max_length=20, choices=PATTERN_TYPES)
    
    # Pattern measurements
    beam_width_3db = models.CharField(max_length=50, blank=True, verbose_name="Beam width measured at - 3 dB Level")
    max_gain_azimuth = models.CharField(max_length=50, blank=True, verbose_name="Degrees azimuth for the max gain related to N")
    horizontal_pattern_table = models.TextField(blank=True, verbose_name="Table of azimuth (DbK) value of the Horizontal Pattern (Attach)")
    
    # Vertical pattern
    has_mechanical_tilt = models.BooleanField(default=False, verbose_name="Mechanical tilt?")
    has_electrical_tilt = models.BooleanField(default=False, verbose_name="Electrical tilt?")
    has_null_fill = models.BooleanField(default=False, verbose_name="Null fill?")
    
    mechanical_tilt_degree = models.CharField(max_length=50, blank=True, verbose_name="Degree of Tilt")
    electrical_tilt_degree = models.CharField(max_length=50, blank=True, verbose_name="Degree of Tilt")
    null_fill_percentage = models.CharField(max_length=50, blank=True, verbose_name="% of filling")
    
    vertical_pattern_table = models.TextField(blank=True, verbose_name="Table of azimuth (DbK) value of the Vertical Pattern (Attach)")
    
    # System specifications
    antenna_gain = models.CharField(max_length=50, blank=True, verbose_name="Gain of the Antenna System")
    estimated_antenna_losses = models.CharField(max_length=50, blank=True, verbose_name="Estimated antenna losses (splitter, harnesses, null fill losses, etc ) (dB)")
    estimated_feeder_losses = models.CharField(max_length=50, blank=True, verbose_name="Estimated losses in the feeder (dB)")
    estimated_multiplexer_losses = models.CharField(max_length=50, blank=True, verbose_name="Estimated losses in multiplexer (dB)")
    
    effective_radiated_power = models.CharField(max_length=50, blank=True, verbose_name="Effective Radiated Power (kW)")
    antenna_catalog_attached = models.BooleanField(default=False, verbose_name="Antenna Catalog (attach)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Antenna - {self.manufacturer} {self.model_number}"
    
    class Meta:
        db_table = 'antenna_systems'
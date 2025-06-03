from django.db import models
from apps.broadcasters.models import GeneralData

class Exciter(models.Model):
    """Exciter Information - Part A of Transmitter"""
    general_data = models.ForeignKey(GeneralData, on_delete=models.CASCADE, related_name='exciters')
    
    manufacturer = models.CharField(max_length=200, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    nominal_power = models.CharField(max_length=50, blank=True, verbose_name="Nominal Power (W)")
    actual_reading = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Exciter - {self.manufacturer} {self.model_number}"
    
    class Meta:
        db_table = 'exciters'

class Amplifier(models.Model):
    """Amplifier Information - Part B of Transmitter"""
    general_data = models.ForeignKey(GeneralData, on_delete=models.CASCADE, related_name='amplifiers')
    
    manufacturer = models.CharField(max_length=200, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    nominal_power = models.CharField(max_length=50, blank=True, verbose_name="Nominal Power (W)")
    actual_reading = models.CharField(max_length=50, blank=True)
    rf_output_connector_type = models.CharField(max_length=100, blank=True)
    
    frequency_range = models.CharField(max_length=100, blank=True)
    transmit_frequency = models.CharField(max_length=100, blank=True, verbose_name="Transmit Frequency (MHz or TV Channel Number)")
    frequency_stability = models.CharField(max_length=50, blank=True, verbose_name="Frequency Stability (ppm)")
    
    harmonics_suppression_level = models.CharField(max_length=50, blank=True, verbose_name="Harmonics Suppression Level (dB)")
    spurious_emission_level = models.CharField(max_length=50, blank=True, verbose_name="Spurious Emission Level (dB)")
    
    has_internal_audio_limiter = models.BooleanField(default=False, verbose_name="Internal Audio Limiter")
    has_internal_stereo_coder = models.BooleanField(default=False, verbose_name="Internal Stereo Coder")
    
    transmitter_catalog_attached = models.BooleanField(default=False, verbose_name="Transmitter Catalog (attach)")
    transmit_bandwidth = models.CharField(max_length=50, blank=True, verbose_name="Transmit Bandwidth (-26dB)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Amplifier - {self.manufacturer} {self.model_number}"
    
    class Meta:
        db_table = 'amplifiers'

# Updated models.py - Filter class
class Filter(models.Model):
    """Filter Information"""
    FILTER_TYPES = [
        ('standard_band_pass', 'Standard Band Pass Filter'),
        ('notch', 'Notch Filter'),
        ('high_q_triple_cavity', 'High-Q Triple Cavity Filter'),
    ]
    
    general_data = models.ForeignKey(GeneralData, on_delete=models.CASCADE, related_name='filters')
    
    filter_type = models.CharField(max_length=30, choices=FILTER_TYPES, verbose_name="Type")  # Increased max_length
    manufacturer = models.CharField(max_length=200, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    frequency = models.CharField(max_length=100, blank=True, verbose_name="Frequency (MHz) or TV Channel Number")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Filter - {self.get_filter_type_display()} {self.manufacturer}"
    
    class Meta:
        db_table = 'filters'

class StudioTransmitterLink(models.Model):
    """Studio to Transmitter Link Information"""
    general_data = models.ForeignKey(GeneralData, on_delete=models.CASCADE, related_name='studio_links')
    
    manufacturer = models.CharField(max_length=200, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    frequency = models.CharField(max_length=100, blank=True, verbose_name="Frequency (MHz)")
    polarization = models.CharField(max_length=50, blank=True)
    signal_description = models.TextField(blank=True, verbose_name="Description of Signal Reception and or Re-transmission")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Studio Link - {self.manufacturer} {self.model_number}"
    
    class Meta:
        db_table = 'studio_transmitter_links'
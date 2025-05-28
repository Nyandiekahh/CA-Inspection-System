from django.db import models
from apps.broadcasters.models import GeneralData

class Tower(models.Model):
    """Tower Information - Section 3"""
    TOWER_TYPES = [
        ('guyed', 'Guyed'),
        ('self_supporting', 'Self-Supporting'),
        ('other', 'Others (specify)'),
    ]
    
    RUST_PROTECTION_TYPES = [
        ('galvanized', 'Galvanized'),
        ('painted', 'Painted'),
        ('aluminum', 'Aluminum'),
        ('no_protection', 'No Rust Protection'),
    ]
    
    general_data = models.ForeignKey(GeneralData, on_delete=models.CASCADE, related_name='towers')
    
    # Tower owner and specifications
    tower_owner_name = models.CharField(max_length=200, verbose_name="Name of the Tower Owner")
    height_above_ground = models.CharField(max_length=50, verbose_name="Height of the Tower above Ground")
    
    # Building roof check
    above_building_roof = models.BooleanField(default=False, verbose_name="Is the tower above a Building Roof?")
    building_height = models.CharField(max_length=50, blank=True, verbose_name="Height of the building above ground")
    
    # Tower specifications
    tower_type = models.CharField(max_length=20, choices=TOWER_TYPES, verbose_name="Type of Tower")
    tower_type_other = models.CharField(max_length=100, blank=True, verbose_name="Others (specify)")
    
    rust_protection = models.CharField(max_length=20, choices=RUST_PROTECTION_TYPES, verbose_name="Rust Protection")
    
    installation_year = models.CharField(max_length=4, blank=True, verbose_name="Year of Tower installation")
    manufacturer_name = models.CharField(max_length=200, blank=True, verbose_name="Name of the Tower Manufacturer")
    model_number = models.CharField(max_length=100, blank=True)
    
    # Load specifications
    maximum_wind_load = models.CharField(max_length=50, blank=True, verbose_name="Maximum Wind Load (km/h)")
    maximum_load_charge = models.CharField(max_length=50, blank=True, verbose_name="Maximum Load Charge (kg)")
    
    # Insurance and safety
    has_insurance = models.BooleanField(default=False, verbose_name="Has Tower got an Insurance Policy?")
    insurance_company = models.CharField(max_length=200, blank=True, verbose_name="Name of insurer")
    
    has_concrete_base = models.BooleanField(default=False, verbose_name="Concrete Base?")
    has_lightning_protection = models.BooleanField(default=False, verbose_name="Lightning Protection provided?")
    is_electrically_grounded = models.BooleanField(default=False, verbose_name="Is the Tower electrically grounded?")
    has_aviation_warning_light = models.BooleanField(default=False, verbose_name="Aviation warning light provided?")
    
    # Other antennas
    has_other_antennas = models.BooleanField(default=False, verbose_name="Others Antennas on the Tower?")
    other_antennas_details = models.TextField(blank=True, verbose_name="If yes, elaborate")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Tower - {self.general_data.broadcaster.name} ({self.height_above_ground}m)"
    
    class Meta:
        db_table = 'towers'
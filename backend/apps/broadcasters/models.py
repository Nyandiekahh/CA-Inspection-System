from django.db import models
from django.core.exceptions import ValidationError

class Broadcaster(models.Model):
    """Administrative Information - Section 1"""
    name = models.CharField(max_length=200, verbose_name="Name of Broadcaster")
    
    # Address fields
    po_box = models.CharField(max_length=50, blank=True, verbose_name="P.O. Box")
    postal_code = models.CharField(max_length=10, blank=True)
    town = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    street = models.CharField(max_length=200, blank=True)
    
    phone_numbers = models.TextField(blank=True, verbose_name="Phone Number(s)")
    
    # Contact Person
    contact_name = models.CharField(max_length=200, blank=True)
    contact_address = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True, verbose_name="Contact Tel No")
    contact_email = models.EmailField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'broadcasters'
        ordering = ['name']


class ProgramName(models.Model):
    """Program Names that can be associated with broadcasters"""
    name = models.CharField(max_length=200, unique=True, verbose_name="Program Name")
    description = models.TextField(blank=True, verbose_name="Program Description")
    broadcasters = models.ManyToManyField(
        Broadcaster, 
        related_name='programs',
        blank=True,
        verbose_name="Associated Broadcasters"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def add_broadcaster(self, broadcaster):
        """Add a broadcaster - no constraints"""
        self.broadcasters.add(broadcaster)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'program_names'
        ordering = ['name']


class GeneralData(models.Model):
    """General Data - Section 2"""
    STATION_TYPES = [
        ('AM', 'AM Radio'),
        ('FM', 'FM Radio'),
        ('TV', 'Television'),
    ]
    
    AIR_STATUS_CHOICES = [
        ('on_air', 'ON AIR'),
        ('off_air', 'OFF AIR'),
    ]
    
    broadcaster = models.ForeignKey(Broadcaster, on_delete=models.CASCADE, related_name='general_data')
    
    # Station info
    station_type = models.CharField(max_length=10, choices=STATION_TYPES, verbose_name="Type of Station")
    transmitting_site_name = models.CharField(max_length=200, verbose_name="Name of the Transmitting Site")
    
    # Program and Air Status
    program_name = models.ForeignKey(
        ProgramName, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='general_data',
        verbose_name="Program Name"
    )
    air_status = models.CharField(
        max_length=10, 
        choices=AIR_STATUS_CHOICES, 
        default='on_air',
        verbose_name="Air Status"
    )
    off_air_reason = models.TextField(
        blank=True, 
        verbose_name="Reason for being OFF AIR (if applicable)"
    )
    
    # Coordinates
    longitude = models.CharField(max_length=20, blank=True, verbose_name="Longitude (dd mm ss) E")
    latitude = models.CharField(max_length=20, blank=True, verbose_name="Latitude (dd mm ss) N/S")
    
    # Physical Address
    physical_location = models.CharField(max_length=200, blank=True)
    physical_street = models.CharField(max_length=200, blank=True)
    physical_area = models.CharField(max_length=100, blank=True)
    
    altitude = models.CharField(max_length=50, blank=True, verbose_name="Altitude (m above sea level)")
    land_owner_name = models.CharField(max_length=200, blank=True, verbose_name="Name of the Land Owner")
    
    # Other telecoms operator
    other_telecoms_operator = models.BooleanField(default=False, verbose_name="Others Telecoms Operator on site?")
    telecoms_operator_details = models.TextField(blank=True, verbose_name="If yes, elaborate")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate that off_air_reason is provided when station is OFF AIR"""
        if self.air_status == 'off_air' and not self.off_air_reason.strip():
            raise ValidationError("Reason for being OFF AIR is required when station is not operational.")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        status_indicator = "🔴" if self.air_status == 'off_air' else "🟢"
        program_info = f" - {self.program_name.name}" if self.program_name else ""
        return f"{status_indicator} {self.broadcaster.name} - {self.transmitting_site_name}{program_info}"
    
    class Meta:
        db_table = 'general_data'
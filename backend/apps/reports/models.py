# apps/reports/models.py - Updated to match frontend categories
from django.db import models
from django.contrib.auth import get_user_model
from apps.inspections.models import Inspection
import uuid
import os

User = get_user_model()

def report_image_upload_path(instance, filename):
    """Generate upload path for report images"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('reports', str(instance.report.id), 'images', filename)

class InspectionReport(models.Model):
    """Main Report Model"""
    REPORT_TYPES = [
        ('fm_radio', 'FM Radio Inspection'),
        ('tv_broadcast', 'TV Broadcast Inspection'),
        ('am_radio', 'AM Radio Inspection'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF Document'),
        ('docx', 'Word Document'),
        ('both', 'Both PDF and Word'),
    ]
    
    # Basic info
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Report metadata
    title = models.CharField(max_length=500, help_text="Report title (auto-generated from template)")
    reference_number = models.CharField(max_length=100, unique=True, help_text="CA reference number")
    date_created = models.DateTimeField(auto_now_add=True)
    date_completed = models.DateTimeField(null=True, blank=True)
    
    # Report content
    findings = models.TextField(blank=True, help_text="Inspection findings")
    observations = models.TextField(blank=True, help_text="Inspector observations")
    conclusions = models.TextField(blank=True, help_text="Report conclusions")
    recommendations = models.TextField(blank=True, help_text="Recommendations")
    
    # ERP Calculations (stored as JSON for multiple channels)
    erp_calculations = models.JSONField(default=dict, help_text="ERP calculations for each channel")
    
    # Violations and compliance
    violations_found = models.JSONField(default=list, help_text="List of violations found")
    compliance_status = models.CharField(max_length=20, choices=[
        ('compliant', 'Compliant'),
        ('minor_violations', 'Minor Violations'),
        ('major_violations', 'Major Violations'),
        ('non_compliant', 'Non-Compliant'),
    ], default='compliant')
    
    # Document generation
    preferred_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    
    # File storage
    generated_pdf = models.FileField(upload_to='reports/generated/', null=True, blank=True)
    generated_docx = models.FileField(upload_to='reports/generated/', null=True, blank=True)
    
    # Audit trail
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    last_modified_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='modified_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.reference_number} - {self.inspection.broadcaster.name if self.inspection.broadcaster else 'No Broadcaster'}"
    
    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
        if not self.title:
            self.title = self.generate_title()
        super().save(*args, **kwargs)
    
    def generate_reference_number(self):
        """Generate CA reference number"""
        from datetime import datetime
        year = datetime.now().year
        
        # Get the latest report with the CA/FSM/BC pattern
        latest = InspectionReport.objects.filter(
            reference_number__startswith='CA/FSM/BC/'
        ).order_by('-created_at').first()
        
        if latest:
            # Extract number and increment
            try:
                # Extract number from pattern like "CA/FSM/BC/001 Vol. II"
                ref_parts = latest.reference_number.split('/')
                if len(ref_parts) >= 3:
                    # Get the number part (e.g., "001 Vol. II")
                    number_part = ref_parts[3].split(' ')[0]  # Gets "001"
                    last_num = int(number_part)
                    new_num = last_num + 1
                else:
                    new_num = 1
            except (ValueError, IndexError) as e:
                print(f"Error parsing reference number {latest.reference_number}: {e}")
                new_num = 1
        else:
            new_num = 1
        
        # Format: CA/FSM/BC/002 Vol. II (next number after 001)
        return f"CA/FSM/BC/{new_num:03d} Vol. II"
    
    def generate_title(self):
        """Generate report title based on inspection data"""
        inspection = self.inspection
        broadcaster = inspection.broadcaster.name if inspection.broadcaster else "Unknown"
        
        if inspection.station_type == 'FM':
            freq = inspection.transmit_frequency or "UNKNOWN"
            location = inspection.transmitting_site_name or inspection.physical_location or "Unknown Location"
            return f"INSPECTION OF {freq} MHZ TRANSMITTER ({broadcaster}) IN {location.upper()}"
        elif inspection.station_type == 'TV':
            # Handle multiple channels for TV
            freq = inspection.transmit_frequency or "UNKNOWN"
            location = inspection.transmitting_site_name or inspection.physical_location or "Unknown Location"
            return f"INSPECTION OF {broadcaster} TV TRANSMITTER {freq} IN {location.upper()}"
        else:
            location = inspection.transmitting_site_name or inspection.physical_location or "Unknown Location"
            return f"INSPECTION OF {broadcaster} TRANSMITTER IN {location.upper()}"
    
    class Meta:
        db_table = 'inspection_reports'
        ordering = ['-created_at']

class ReportImage(models.Model):
    """Images attached to reports - UPDATED TO MATCH FRONTEND CATEGORIES"""
    IMAGE_TYPES = [
        # Updated to match frontend exactly
        ('site_overview', 'Site Overview'),
        ('tower_mast', 'Tower/Mast Structure'),  # Match frontend key
        ('transmitter_equipment', 'Transmitter Equipment'),  # Match frontend key
        ('antenna', 'Antenna System'),  # Match frontend key
        ('studio_transmitter_link', 'Studio to Transmitter Link'),
        ('filter_equipment', 'Filter Equipment'),  # Match frontend key
        ('other_equipment', 'Other Equipment'),  # Match frontend key
    ]
    
    POSITIONING = [
        ('header', 'Header Area'),
        ('findings_section', 'Findings Section'),
        ('equipment_section', 'Equipment Section'),
        ('antenna_section', 'Antenna Section'),
        ('custom', 'Custom Position'),
    ]
    
    report = models.ForeignKey(InspectionReport, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=report_image_upload_path)
    image_type = models.CharField(max_length=30, choices=IMAGE_TYPES)  # Increased max_length
    
    # Image metadata
    caption = models.CharField(max_length=300, help_text="Image caption for the report")
    description = models.TextField(blank=True, help_text="Detailed description")
    
    # Positioning in document
    position_in_report = models.CharField(max_length=20, choices=POSITIONING, default='equipment_section')
    order_in_section = models.PositiveIntegerField(default=1, help_text="Order within the section")
    
    # Image specifications for document generation
    width_percentage = models.PositiveIntegerField(default=80, help_text="Width as percentage of page width")
    alignment = models.CharField(max_length=10, choices=[
        ('left', 'Left'),
        ('center', 'Center'),
        ('right', 'Right'),
    ], default='center')
    
    # Equipment association (for automatic positioning)
    equipment_manufacturer = models.CharField(max_length=200, blank=True)
    equipment_model = models.CharField(max_length=200, blank=True)
    equipment_serial = models.CharField(max_length=200, blank=True)
    
    # Timestamps - using created_at for consistency
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.report.reference_number} - {self.get_image_type_display()}"
    
    @property
    def uploaded_at(self):
        """Alias for backwards compatibility"""
        return self.created_at
    
    class Meta:
        db_table = 'report_images'
        ordering = ['position_in_report', 'order_in_section']

# Rest of the models remain the same...
class ReportTemplate(models.Model):
    """Report Templates for different types of inspections"""
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=InspectionReport.REPORT_TYPES)
    
    # Template structure (stored as JSON)
    template_structure = models.JSONField(help_text="JSON structure defining the report layout")
    
    # Header template
    header_template = models.TextField(help_text="Header section template")
    
    # Section templates
    findings_template = models.TextField(help_text="Findings section template")
    calculations_template = models.TextField(help_text="ERP calculations template")
    conclusions_template = models.TextField(help_text="Conclusions template")
    recommendations_template = models.TextField(help_text="Recommendations template")
    
    # Styling
    page_margins = models.JSONField(default=dict, help_text="Page margin settings")
    font_settings = models.JSONField(default=dict, help_text="Font and styling settings")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"
    
    class Meta:
        db_table = 'report_templates'

class ERPCalculation(models.Model):
    """ERP Calculation details for each channel/frequency"""
    report = models.ForeignKey(InspectionReport, on_delete=models.CASCADE, related_name='erp_details')
    
    # Channel/Frequency info
    channel_number = models.CharField(max_length=10, help_text="e.g., CH.22, CH.37")
    frequency_mhz = models.CharField(max_length=20, help_text="Frequency in MHz")
    
    # Power measurements
    forward_power_w = models.DecimalField(max_digits=10, decimal_places=2, help_text="Forward Power in Watts")
    antenna_gain_dbd = models.DecimalField(max_digits=5, decimal_places=2, help_text="Antenna Gain in dBd")
    losses_db = models.DecimalField(max_digits=5, decimal_places=2, default=1.5, help_text="System Losses in dB")
    
    # Calculated values
    erp_dbw = models.DecimalField(max_digits=8, decimal_places=2, help_text="ERP in dBW")
    erp_kw = models.DecimalField(max_digits=8, decimal_places=3, help_text="ERP in kW")
    
    # Authorization limits
    authorized_erp_dbw = models.DecimalField(max_digits=8, decimal_places=2, default=40.0, help_text="Authorized ERP in dBW")
    authorized_erp_kw = models.DecimalField(max_digits=8, decimal_places=3, default=10.0, help_text="Authorized ERP in kW")
    
    # Compliance
    is_compliant = models.BooleanField(default=True)
    excess_power_kw = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True, help_text="Excess power if non-compliant")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calculate ERP
        import math
        self.erp_dbw = 10 * math.log10(float(self.forward_power_w)) + float(self.antenna_gain_dbd) - float(self.losses_db)
        self.erp_kw = 10 ** (float(self.erp_dbw) / 10) / 1000
        
        # Check compliance
        self.is_compliant = self.erp_kw <= self.authorized_erp_kw
        if not self.is_compliant:
            self.excess_power_kw = self.erp_kw - self.authorized_erp_kw
        else:
            self.excess_power_kw = None
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.channel_number} ({self.frequency_mhz} MHz) - {self.erp_kw} kW"
    
    class Meta:
        db_table = 'erp_calculations'
        ordering = ['channel_number']
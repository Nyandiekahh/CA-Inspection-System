from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import Report, ReportImage
import os


@receiver(post_save, sender=Report)
def report_post_save(sender, instance, created, **kwargs):
    """Handle report post-save actions"""
    if created:
        # Log report creation
        print(f"New report created: {instance.reference_number}")
        
        # Auto-populate subject if empty
        if not instance.subject and instance.inspection:
            inspection = instance.inspection
            site_name = inspection.transmitting_site_name or 'TRANSMITTER'
            broadcaster = inspection.broadcaster_name or 'BROADCASTER'
            location = inspection.physical_location or 'SITE LOCATION'
            
            instance.subject = f"INSPECTION OF {site_name} ({broadcaster}) IN {location}."
            instance.save(update_fields=['subject'])


@receiver(pre_delete, sender=ReportImage)
def report_image_pre_delete(sender, instance, **kwargs):
    """Delete image file when ReportImage is deleted"""
    if instance.image:
        try:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        except (ValueError, OSError):
            pass


@receiver(pre_delete, sender=Report)
def report_pre_delete(sender, instance, **kwargs):
    """Clean up files when Report is deleted"""
    # Delete PDF file
    if instance.pdf_file:
        try:
            if os.path.isfile(instance.pdf_file.path):
                os.remove(instance.pdf_file.path)
        except (ValueError, OSError):
            pass
    
    # Delete Word file
    if instance.word_file:
        try:
            if os.path.isfile(instance.word_file.path):
                os.remove(instance.word_file.path)
        except (ValueError, OSError):
            pass
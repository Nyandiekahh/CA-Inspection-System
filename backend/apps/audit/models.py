from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

User = get_user_model()

class AuditLog(models.Model):
    """Track all changes made to inspection forms"""
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('auto_save', 'Auto Saved'),
    ]
    
    # Who made the change
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # What was changed
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Change details
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    field_name = models.CharField(max_length=100, blank=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    
    # Additional context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} {self.get_action_display()} {self.content_type.model} at {self.timestamp}"
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', 'timestamp']),
        ]

class FormRevision(models.Model):
    """Track form revisions and versions"""
    from apps.inspections.models import Inspection
    
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='revisions')
    revision_number = models.PositiveIntegerField(default=1)
    revised_by = models.ForeignKey(User, on_delete=models.CASCADE)
    revision_reason = models.TextField(blank=True)
    
    # Snapshot of form data at this revision
    form_data = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.inspection.form_number} - Rev {self.revision_number}"
    
    class Meta:
        db_table = 'form_revisions'
        ordering = ['-revision_number']
        unique_together = ['inspection', 'revision_number']
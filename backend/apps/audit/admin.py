from django.contrib import admin
from .models import AuditLog, FormRevision

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_type', 'action', 'field_name', 'timestamp')
    list_filter = ('action', 'content_type', 'timestamp', 'user')
    search_fields = ('user__username', 'field_name', 'old_value', 'new_value')
    readonly_fields = ('user', 'content_type', 'object_id', 'action', 'field_name', 'old_value', 'new_value', 'ip_address', 'user_agent', 'timestamp')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(FormRevision)
class FormRevisionAdmin(admin.ModelAdmin):
    list_display = ('inspection', 'revision_number', 'revised_by', 'created_at')
    list_filter = ('revised_by', 'created_at')
    search_fields = ('inspection__form_number', 'inspection__broadcaster__name', 'revision_reason')
    readonly_fields = ('inspection', 'revision_number', 'revised_by', 'form_data', 'created_at')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
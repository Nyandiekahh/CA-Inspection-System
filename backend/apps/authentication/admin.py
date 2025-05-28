from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CAUser

@admin.register(CAUser)
class CAUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'employee_id', 'department', 'is_inspector', 'is_active', 'date_joined')
    list_filter = ('is_inspector', 'is_active', 'department', 'date_joined')
    search_fields = ('username', 'email', 'employee_id', 'first_name', 'last_name')
    
    fieldsets = UserAdmin.fieldsets + (
        ('CA Information', {
            'fields': ('employee_id', 'department', 'phone_number', 'is_inspector')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('CA Information', {
            'fields': ('employee_id', 'department', 'phone_number', 'is_inspector')
        }),
    )
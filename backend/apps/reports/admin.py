# apps/reports/admin.py
from django.contrib import admin
from .models import InspectionReport, ReportImage, ERPCalculation, ReportTemplate

@admin.register(InspectionReport)
class InspectionReportAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'inspection', 'report_type', 'status', 
        'compliance_status', 'created_by', 'date_created'
    ]
    list_filter = ['report_type', 'status', 'compliance_status', 'date_created']
    search_fields = ['reference_number', 'title', 'inspection__broadcaster__name']
    readonly_fields = ['reference_number', 'title', 'date_created', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('inspection', 'report_type', 'status', 'reference_number', 'title')
        }),
        ('Content', {
            'fields': ('findings', 'observations', 'conclusions', 'recommendations')
        }),
        ('Analysis', {
            'fields': ('erp_calculations', 'violations_found', 'compliance_status')
        }),
        ('Generation', {
            'fields': ('preferred_format', 'generated_pdf', 'generated_docx')
        }),
        ('Metadata', {
            'fields': ('created_by', 'last_modified_by', 'date_created', 'date_completed', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ReportImage)
class ReportImageAdmin(admin.ModelAdmin):
    list_display = ['report', 'image_type', 'caption', 'position_in_report', 'uploaded_by', 'created_at']
    list_filter = ['image_type', 'position_in_report', 'created_at']  # Changed from 'uploaded_at' to 'created_at'
    search_fields = ['report__reference_number', 'caption', 'equipment_manufacturer']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('report', 'image', 'image_type', 'caption', 'description')
        }),
        ('Positioning', {
            'fields': ('position_in_report', 'order_in_section', 'width_percentage', 'alignment')
        }),
        ('Equipment Association', {
            'fields': ('equipment_manufacturer', 'equipment_model', 'equipment_serial'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ERPCalculation)
class ERPCalculationAdmin(admin.ModelAdmin):
    list_display = [
        'report', 'channel_number', 'frequency_mhz', 'forward_power_w', 
        'erp_kw', 'is_compliant'
    ]
    list_filter = ['is_compliant', 'created_at']
    search_fields = ['report__reference_number', 'channel_number', 'frequency_mhz']
    readonly_fields = ['erp_dbw', 'erp_kw', 'is_compliant', 'excess_power_kw', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Channel Information', {
            'fields': ('report', 'channel_number', 'frequency_mhz')
        }),
        ('Power Measurements', {
            'fields': ('forward_power_w', 'antenna_gain_dbd', 'losses_db')
        }),
        ('Authorization Limits', {
            'fields': ('authorized_erp_dbw', 'authorized_erp_kw')
        }),
        ('Calculated Results', {
            'fields': ('erp_dbw', 'erp_kw', 'is_compliant', 'excess_power_kw'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'is_active', 'created_at']
    list_filter = ['report_type', 'is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'report_type', 'is_active')
        }),
        ('Template Structure', {
            'fields': ('template_structure',)
        }),
        ('Content Templates', {
            'fields': ('header_template', 'findings_template', 'calculations_template', 
                      'conclusions_template', 'recommendations_template'),
            'classes': ('collapse',)
        }),
        ('Styling', {
            'fields': ('page_margins', 'font_settings'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
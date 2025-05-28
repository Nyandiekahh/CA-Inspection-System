from django.contrib import admin
from .models import Broadcaster, GeneralData

class GeneralDataInline(admin.TabularInline):
    model = GeneralData
    extra = 0

@admin.register(Broadcaster)
class BroadcasterAdmin(admin.ModelAdmin):
    list_display = ('name', 'town', 'contact_name', 'contact_phone', 'created_at')
    list_filter = ('town', 'created_at')
    search_fields = ('name', 'contact_name', 'contact_email')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name',)
        }),
        ('Address', {
            'fields': ('po_box', 'postal_code', 'town', 'location', 'street')
        }),
        ('Contact Information', {
            'fields': ('phone_numbers',)
        }),
        ('Contact Person', {
            'fields': ('contact_name', 'contact_address', 'contact_phone', 'contact_email')
        }),
    )
    
    inlines = [GeneralDataInline]

@admin.register(GeneralData)
class GeneralDataAdmin(admin.ModelAdmin):
    list_display = ('broadcaster', 'station_type', 'transmitting_site_name', 'physical_location', 'created_at')
    list_filter = ('station_type', 'other_telecoms_operator', 'created_at')
    search_fields = ('broadcaster__name', 'transmitting_site_name', 'physical_location')
    
    fieldsets = (
        ('Station Information', {
            'fields': ('broadcaster', 'station_type', 'transmitting_site_name')
        }),
        ('Coordinates', {
            'fields': ('longitude', 'latitude', 'altitude')
        }),
        ('Physical Address', {
            'fields': ('physical_location', 'physical_street', 'physical_area')
        }),
        ('Additional Information', {
            'fields': ('land_owner_name', 'other_telecoms_operator', 'telecoms_operator_details')
        }),
    )
from django.contrib import admin
from .models import Broadcaster, GeneralData, ProgramName

class GeneralDataInline(admin.TabularInline):
    model = GeneralData
    extra = 0

@admin.register(ProgramName)
class ProgramNameAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_broadcasters_count', 'get_broadcaster_names', 'created_at')
    list_filter = ('created_at', 'broadcasters')
    search_fields = ('name', 'description', 'broadcasters__name')
    filter_horizontal = ('broadcasters',)
    
    fieldsets = (
        ('Program Information', {
            'fields': ('name', 'description')
        }),
        ('Associated Broadcasters', {
            'fields': ('broadcasters',),
            'description': 'A program can be associated with multiple broadcasters.'
        }),
    )
    
    def get_broadcasters_count(self, obj):
        return obj.broadcasters.count()
    get_broadcasters_count.short_description = 'Broadcasters Count'
    
    def get_broadcaster_names(self, obj):
        return ", ".join([b.name for b in obj.broadcasters.all()]) or "None"
    get_broadcaster_names.short_description = 'Broadcasters'

@admin.register(Broadcaster)
class BroadcasterAdmin(admin.ModelAdmin):
    list_display = ('name', 'town', 'contact_name', 'contact_phone', 'get_programs_count', 'created_at')
    list_filter = ('town', 'created_at', 'programs')
    search_fields = ('name', 'contact_name', 'contact_email', 'programs__name')
    
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
    
    def get_programs_count(self, obj):
        return obj.programs.count()
    get_programs_count.short_description = 'Programs Count'

@admin.register(GeneralData)
class GeneralDataAdmin(admin.ModelAdmin):
    list_display = ('broadcaster', 'station_type', 'transmitting_site_name', 'program_name', 'air_status', 'physical_location', 'created_at')
    list_filter = ('station_type', 'air_status', 'other_telecoms_operator', 'created_at', 'program_name')
    search_fields = ('broadcaster__name', 'transmitting_site_name', 'physical_location', 'program_name__name')
    
    fieldsets = (
        ('Station Information', {
            'fields': ('broadcaster', 'station_type', 'transmitting_site_name')
        }),
        ('Program & Status', {
            'fields': ('program_name', 'air_status', 'off_air_reason'),
            'description': 'Program information and current operational status'
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
    
    def get_list_display_links(self, request, list_display):
        """Make the transmitting site name clickable"""
        return ('transmitting_site_name',)
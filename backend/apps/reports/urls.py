# apps/reports/urls.py - UPDATED FOR DOCX ONLY & REMOVED ERP ENDPOINTS
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reports', views.InspectionReportViewSet)
router.register(r'images', views.ReportImageViewSet)
# REMOVED: ERP calculations router registration

urlpatterns = [
    path('', include(router.urls)),
    
    # Report creation and management
    path('create-from-inspection/<int:inspection_id>/', 
         views.create_report_from_inspection, 
         name='create-report-from-inspection'),
    
    # Enhanced image management
    path('images/bulk_upload/', 
         views.ReportImageViewSet.as_view({'post': 'bulk_upload'}), 
         name='bulk-upload-images'),
    
    # Professional document generation - DOCX ONLY
    path('reports/<uuid:pk>/generate_documents/',
         views.InspectionReportViewSet.as_view({'post': 'generate_documents'}),
         name='generate-documents'),
    
    # Document downloads - DOCX ONLY
    path('reports/<uuid:pk>/download_docx/',
         views.InspectionReportViewSet.as_view({'get': 'download_docx'}),
         name='download-docx'),
    
    # REMOVED: PDF download endpoint
    
    # Enhanced preview and analysis
    path('reports/<uuid:pk>/preview_data/',
         views.InspectionReportViewSet.as_view({'get': 'preview_data'}),
         name='preview-data'),
    
    path('reports/<uuid:pk>/enhanced_preview_data/',
         views.InspectionReportViewSet.as_view({'get': 'enhanced_preview_data'}),
         name='enhanced-preview-data'),
    
    path('reports/<uuid:pk>/image_requirements/',
         views.InspectionReportViewSet.as_view({'get': 'image_requirements'}),
         name='image-requirements'),
    
    path('reports/<uuid:pk>/analyze_violations/',
         views.InspectionReportViewSet.as_view({'post': 'analyze_violations'}),
         name='analyze-violations'),
    
    # Utility endpoints
    path('templates/', 
         views.get_report_templates, 
         name='report-templates'),
    
    path('validate/', 
         views.validate_report_data, 
         name='validate-report-data'),
    
    # REMOVED: All ERP calculation endpoints
    # - calculate_erp/
    # - bulk_calculate/
    # - erp-calculations/ viewset
]
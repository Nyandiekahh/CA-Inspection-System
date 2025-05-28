from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'inspections', views.InspectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test/', views.test_inspections, name='test-inspections'),  # TEST ENDPOINT
    path('inspections/<int:inspection_id>/auto-save/', views.AutoSaveView.as_view(), name='auto-save'),
]
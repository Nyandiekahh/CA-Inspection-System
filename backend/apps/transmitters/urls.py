# apps/transmitters/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'exciters', views.ExciterViewSet)
router.register(r'amplifiers', views.AmplifierViewSet)
router.register(r'filters', views.FilterViewSet)
router.register(r'studio-links', views.StudioTransmitterLinkViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
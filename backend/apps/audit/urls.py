# apps/audit/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'audit-logs', views.AuditLogViewSet)
router.register(r'revisions', views.FormRevisionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
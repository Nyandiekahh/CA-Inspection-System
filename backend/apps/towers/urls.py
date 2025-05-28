# apps/towers/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'towers', views.TowerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test/', views.test_towers, name='test-towers'),  # TEST ENDPOINT
]
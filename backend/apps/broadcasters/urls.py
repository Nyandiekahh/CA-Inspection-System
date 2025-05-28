from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'broadcasters', views.BroadcasterViewSet)
router.register(r'general-data', views.GeneralDataViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test/', views.test_broadcasters, name='test-broadcasters'),  # TEST ENDPOINT
]
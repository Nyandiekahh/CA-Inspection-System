from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.CAUserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test/', views.test_view, name='test'),  # TEST ENDPOINT
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
]
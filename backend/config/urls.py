from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/broadcasters/', include('apps.broadcasters.urls')),
    path('api/towers/', include('apps.towers.urls')),
    path('api/transmitters/', include('apps.transmitters.urls')),
    path('api/antennas/', include('apps.antennas.urls')),
    path('api/inspections/', include('apps.inspections.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/reports/', include('apps.reports.urls')),  # Add this line
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
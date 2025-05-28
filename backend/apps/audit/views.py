# apps/audit/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog, FormRevision
from rest_framework import serializers

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'

class FormRevisionSerializer(serializers.ModelSerializer):
    revised_by_name = serializers.CharField(source='revised_by.get_full_name', read_only=True)
    
    class Meta:
        model = FormRevision
        fields = '__all__'

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

class FormRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FormRevision.objects.select_related('inspection', 'revised_by')
    serializer_class = FormRevisionSerializer
    permission_classes = [IsAuthenticated]
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CAUser

class CAUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CAUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'employee_id', 'department', 'phone_number', 'is_inspector', 
                 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')

class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CAUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'employee_id', 'department', 'phone_number', 'is_inspector')
        read_only_fields = ('id', 'username', 'employee_id')
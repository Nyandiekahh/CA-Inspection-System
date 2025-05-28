# apps/authentication/views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout, authenticate
from django.http import JsonResponse
from .models import CAUser
from .serializers import CAUserSerializer, LoginSerializer, CurrentUserSerializer

# SIMPLE TEST VIEWS - NO AUTHENTICATION REQUIRED
@api_view(['GET'])
@permission_classes([AllowAny])
def test_view(request):
    """Simple test endpoint"""
    return Response({
        'message': 'API is working!',
        'user_count': CAUser.objects.count(),
        'authenticated': request.user.is_authenticated
    })

class CAUserViewSet(viewsets.ModelViewSet):
    queryset = CAUser.objects.all()
    serializer_class = CAUserSerializer
    permission_classes = [AllowAny]  # NO AUTHENTICATION FOR DEVELOPMENT

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print(f"🔐 Login attempt with data: {request.data}")
        
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Create or get token for the user
            token, created = Token.objects.get_or_create(user=user)
            
            print(f"✅ Login successful for user: {user.username}")
            print(f"🎯 Generated token: {token.key[:10]}...")
            
            # Also login for session-based endpoints
            login(request, user)
            
            return Response({
                'message': 'Login successful',
                'user': CurrentUserSerializer(user).data,
                'token': token.key,  # Return the token
                'access_token': token.key,  # Alternative name for token
                'key': token.key  # Another alternative name
            })
        
        print(f"❌ Login failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Delete the user's token if it exists
        if request.user.is_authenticated:
            try:
                token = Token.objects.get(user=request.user)
                token.delete()
                print(f"🔓 Deleted token for user: {request.user.username}")
            except Token.DoesNotExist:
                pass
        
        logout(request)
        return Response({'message': 'Logout successful'})

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]  # This requires authentication
    
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = CurrentUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
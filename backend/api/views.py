import time
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Category, Product, Order, OrderItem
from .serializers import CategorySerializer, ProductSerializer, OrderSerializer

class AuthLoginView(APIView):
    def post(self, request):
        auth_method = request.data.get('auth_method', '').strip()
        if not auth_method:
            return Response({"error": "Email or Phone is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Simulates sending an OTP code (stubbed to 1234)
        return Response({
            "status": "success",
            "message": "OTP verification code sent",
            "auth_method": auth_method
        })


class AuthVerifyView(APIView):
    def post(self, request):
        auth_method = request.data.get('auth_method', '').strip()
        otp = request.data.get('otp', '').strip()

        if not auth_method or not otp:
            return Response({"error": "Both auth_method and otp are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Allow simple mock verification with code 1234
        if otp == "1234" or otp == "1111" or otp == "0000":
            # Generate a mock token
            mock_token = f"lilla-auth-token-{uuid_token()}"
            return Response({
                "token": mock_token,
                "user": {
                    "auth_method": auth_method
                }
            })
        
        return Response({"error": "Invalid verification code. Use code 1234."}, status=status.HTTP_400_BAD_REQUEST)


def uuid_token():
    import uuid
    return uuid.uuid4().hex[:12]

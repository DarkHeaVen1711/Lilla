import time
import os
import logging

security_logger = logging.getLogger('lilla.security')
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework import viewsets, status, generics
import secrets
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from .models import Category, Product, Order, OrderItem, Combo, StockAdjustment, Favorite, Address
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    CategoryWithProductsSerializer, ComboSerializer, NestedProductSerializer,
    OTPRequestSerializer, OTPVerifySerializer, FavoriteSerializer, AddressSerializer
)
from .throttling import RequestOTPThrottle, VerifyOTPThrottle


from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.select_related('category').all()
        category_slug = self.request.query_params.get('category', None)
        featured = self.request.query_params.get('featured', None)
        concern = self.request.query_params.get('concern', None)

        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if featured == 'true':
            queryset = queryset.filter(featured=True)
        if concern:
            # Match skin concern inside JSON array
            queryset = queryset.filter(skin_concerns__icontains=concern)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.stock > 0:
            StockAdjustment.objects.create(
                product=instance,
                user=self.request.user if self.request.user.is_authenticated else None,
                old_stock=0,
                new_stock=instance.stock,
                reason="API Product Creation Initial Stock"
            )

    def perform_update(self, serializer):
        old_stock = self.get_object().stock
        new_stock = serializer.validated_data.get('stock', old_stock)
        
        instance = serializer.save()
        
        if old_stock != new_stock:
            StockAdjustment.objects.create(
                product=instance,
                user=self.request.user if self.request.user.is_authenticated else None,
                old_stock=old_stock,
                new_stock=new_stock,
                reason="API Manual Edit via Admin Dashboard"
            )


class HomepageDataView(APIView):
    def get(self, request, *args, **kwargs):
        # Fetch categories and products dynamically from the database
        all_categories = Category.objects.all()
        best_sellers = Product.objects.select_related('category').filter(featured=True)[:6]
        
        # Pull categories for frame19 and concerns
        frame19 = []
        for cat in all_categories[:4]:
            frame19.append({
                "title": cat.name,
                "image": cat.image,
                "alt": f"{cat.name} product category",
                "href": f"/shop/{cat.slug}"
            })

        # Prepare products for specific homepage sections
        deal_products = Product.objects.select_related('category').filter(id__in=[
            "ceo-afterglow-vitamin-c-serum", 
            "radiance-pink-daily-serum", 
            "soft-glam-facial-oil"
        ])[:3]
        if not deal_products.exists():
            deal_products = Product.objects.select_related('category').all()[:3]

        combo_products = Product.objects.select_related('category').filter(id__in=[
            "hydration-ritual-set", 
            "brightening-glow-set", 
            "soft-glam-makeup-set",
            "body-care-set"
        ])[:4]
        if not combo_products.exists():
            combo_products = Product.objects.select_related('category').all()[:4]

        # Standard layout response matching Next.js structures
        data = {
            "announcementBarText": "Free Delivery on orders above $100!",
            "navLinks": [
                { "href": "/#home", "label": "Home" },
                { "href": "/skin", "label": "Skin" },
                { "href": "/makeup", "label": "Makeup" },
                { "href": "/#about", "label": "About Us" }
            ],
            "heroSlides": [
                {
                    "id": 1,
                    "layoutType": "text",
                    "titleLines": ["Because every skin", "deserves care."],
                    "description": "Explore lush formulas designed for every tone and texture.",
                    "backgroundImage": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/women-posing-with-self-love-her-body%201-y6SDjvPIomR8ekAwIR7vUaFNOexzZ2.png",
                    "backgroundAlt": "Two women embracing natural beauty",
                    "backgroundColor": "bg-[#D3D3D3]"
                },
                {
                    "id": 2,
                    "layoutType": "image",
                    "portraitImage": "/images/hero2_1.png",  # Placeholder reference
                    "portraitAlt": "Skin care routine close-up",
                    "productImage": "/images/hero2_2.png",
                    "productAlt": "Skincare product",
                    "backgroundColor": "bg-white"
                }
            ],
            "frame19Categories": frame19,
            "bestSellers": ProductSerializer(best_sellers, many=True).data,
            "dealOfTheDay": {
                "title": "Deal Of The day",
                "products": ProductSerializer(deal_products, many=True).data
            },
            "discoverCombos": {
                "title": "Discover Our Combos",
                "products": ProductSerializer(combo_products, many=True).data
            },
            "skinConcerns": [
                { "label": "Acne", "image": "/images/close-up-woman-with-acne-posing 1.png", "href": "/shop/acne" },
                { "label": "Pigmentation", "image": "/images/image 193.png", "href": "/shop/pigmentation" },
                { "label": "Signs of aging", "image": "/images/image 194.png", "href": "/shop/anti-aging" },
                { "label": "Extreme dryness", "image": "/images/close-up-skin-pores-face-care-routine 1.png", "href": "/shop/dry-skin" },
                { "label": "Damaged barrier", "image": "/images/close-up-beautiful-woman-portrait 1.png", "href": "/shop/barrier-repair" }
            ],
            "trustBadges": [
                { "line1": "Clinically", "line2": "Tested" },
                { "line1": "Cruelty", "line2": "Free" },
                { "line1": "Vegan", "line2": "Products" },
                { "line1": "Clean", "line2": "ingredients" }
            ],
            "footer": {
                "newsletterTitle": "Be the first one to know about the updates!",
                "columns": [
                    {
                        "title": "Shop by category",
                        "links": [
                            { "label": "Daily Essentials", "href": "/shop/daily-essentials" },
                            { "label": "Treatments & Mask", "href": "/shop/treatments-mask" },
                            { "label": "Face Makeup", "href": "/shop/face-makeup" },
                            { "label": "Color cosmetics", "href": "/shop/color-cosmetics" }
                        ]
                    },
                    {
                        "title": "Shop",
                        "links": [
                            { "label": "Shop All", "href": "/shop" },
                            { "label": "Bestsellers", "href": "/shop/bestsellers" },
                            { "label": "Face", "href": "/shop/face" },
                            { "label": "Eyes", "href": "/shop/eyes" },
                            { "label": "Lips", "href": "/shop/lips" }
                        ]
                    },
                    {
                        "title": "Customer Care",
                        "links": [
                            { "label": "About Us", "href": "/about" },
                            { "label": "Contact Us", "href": "/contact" },
                            { "label": "FAQs", "href": "/faqs" },
                            { "label": "Shipping Policy", "href": "/shipping-policy" },
                            { "label": "Return & Refund Policy", "href": "/returns" },
                            { "label": "Terms & Conditions", "href": "/terms" }
                        ]
                    }
                ]
            }
        }
        return Response(data)



class OrderCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            if self.request.user.is_staff:
                return Order.objects.select_related('user').prefetch_related('items').all()
            return Order.objects.select_related('user').prefetch_related('items').filter(user=self.request.user)
        
        user_id = self.request.query_params.get('user_identifier')
        if user_id:
            return Order.objects.select_related('user').prefetch_related('items').filter(user_identifier=user_id)
        return Order.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(status="Pending", user=self.request.user)
        else:
            serializer.save(status="Pending")


class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.select_related('user').prefetch_related('items').all()
    serializer_class = OrderSerializer
    lookup_field = 'id'


class CategoryWithProductsListView(generics.ListAPIView):
    serializer_class = CategoryWithProductsSerializer

    def get_queryset(self):
        # Optimization: Fetch products and their category in a single query
        # to prevent N+1 serialization queries for category_name and category_slug.
        active_products = Product.objects.filter(is_active=True).select_related('category')
        return Category.objects.prefetch_related(
            Prefetch('products', queryset=active_products)
        )


class ActiveCombosListView(generics.ListAPIView):
    serializer_class = ComboSerializer

    def get_queryset(self):
        # Optimization: Prefetch products using select_related('category')
        # to ensure no N+1 query is made during nested serialization.
        combo_products = Product.objects.all().select_related('category')
        return Combo.objects.filter(is_active=True, is_promotional=True).prefetch_related(
            Prefetch('products', queryset=combo_products)
        )


class DealOfTheDayView(APIView):
    def get(self, request, *args, **kwargs):
        now = timezone.now()
        # Optimization: select_related('category') avoids N+1 query for category relation.
        product = Product.objects.filter(
            is_deal_of_the_day=True,
            deal_expires_at__gt=now,
            is_active=True
        ).select_related('category').first()

        if not product:
            return Response(
                {"detail": "No active deal of the day found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = NestedProductSerializer(product, context={'request': request})
        return Response({
            "product": serializer.data,
            "expires_at_utc": product.deal_expires_at.isoformat()
        })


class RequestOTPView(APIView):
    throttle_classes = [RequestOTPThrottle]

    def post(self, request, *args, **kwargs):
        serializer = OTPRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        identity = serializer.validated_data['identity']
        user, created = User.objects.get_or_create(username=identity)
        if '@' in identity and not user.email:
            user.email = identity
            user.save()
            
        pin = f"{secrets.SystemRandom().randint(100000, 999999)}"
        cache_key = f"otp:{identity}"
        cache.set(cache_key, pin, timeout=300)
        
        print("\n" + "="*50)
        print(f"[OTP REQUEST LOG] Identity: {identity}")
        print(f"[OTP REQUEST LOG] Cryptographically Secure OTP: {pin}")
        print(f"[OTP REQUEST LOG] TTL: 300 seconds")
        print("="*50 + "\n")
        
        return Response({
            "detail": "OTP requested successfully.",
            "identity": identity
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    throttle_classes = [VerifyOTPThrottle]

    def post(self, request, *args, **kwargs):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        identity = serializer.validated_data['identity']
        submitted_otp = serializer.validated_data['otp']
        
        cache_key = f"otp:{identity}"
        cached_otp = cache.get(cache_key)
        
        if not cached_otp:
            security_logger.warning(
                "OTP verification failed: Expired or not requested",
                extra={'context': {'identity': identity, 'reason': 'expired_or_not_found', 'event': 'otp_expired'}}
            )
            return Response(
                {"detail": "OTP has expired or was not requested."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if cached_otp != submitted_otp:
            security_logger.warning(
                "OTP verification failed: Incorrect code submitted",
                extra={'context': {'identity': identity, 'reason': 'incorrect_otp', 'event': 'otp_incorrect'}}
            )
            return Response(
                {"detail": "Incorrect OTP code."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        cache.delete(cache_key)
        
        try:
            user = User.objects.get(username=identity)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff
            }
        }, status=status.HTTP_200_OK)


import stripe
from rest_framework.permissions import IsAdminUser

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', os.getenv('STRIPE_SECRET_KEY', 'sk_test_PlaceholderSecretKey'))
transaction_logger = logging.getLogger('lilla.transaction')

class OrderRefundView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id, *args, **kwargs):
        order = get_object_or_404(Order, id=id)
        if not order.payment_intent_id:
            return Response(
                {"error": "No payment intent ID associated with this order. Cannot perform refund."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order.status == "Refunded":
            return Response(
                {"error": "Order has already been refunded."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refund = stripe.Refund.create(
                payment_intent=order.payment_intent_id
            )
            order.status = "Refunded"
            order.save()
            
            transaction_logger.info(
                f"Order {order.id} refunded successfully via Stripe",
                extra={'context': {'order_id': str(order.id), 'payment_intent_id': order.payment_intent_id, 'refund_id': refund.id, 'status': 'Refunded'}}
            )
            return Response(
                {"status": "success", "message": "Order refunded successfully.", "refund_id": refund.id},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            transaction_logger.error(
                f"Failed to refund order {order.id}: {str(e)}",
                extra={'context': {'order_id': str(order.id), 'payment_intent_id': order.payment_intent_id, 'error': str(e)}}
            )
            return Response(
                {"error": f"Stripe refund failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


from rest_framework import serializers

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff', 'last_login', 'date_joined')


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer


from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

class FavoriteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FavoriteSerializer
    lookup_field = 'product_id'

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        Favorite.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save()


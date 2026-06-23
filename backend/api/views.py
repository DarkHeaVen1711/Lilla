import time
import os
import logging

security_logger = logging.getLogger('lilla.security')
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
import secrets
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from .models import Category, Product, Order, OrderItem, Combo, StockAdjustment, Favorite, Address, Coupon, Review
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    CategoryWithProductsSerializer, ComboSerializer, NestedProductSerializer,
    OTPRequestSerializer, OTPVerifySerializer, FavoriteSerializer, AddressSerializer,
    ReviewSerializer, ReviewCreateSerializer
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

    def get_permissions(self):
        if self.action == 'reviews':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Product.objects.select_related('category').all()
        
        # 1. Multi-select Categories (list variable or comma-separated)
        categories = self.request.query_params.getlist('category')
        cats = []
        for c in categories:
            cats.extend([x.strip() for x in c.split(',') if x.strip()])
        if cats:
            queryset = queryset.filter(category__slug__in=cats)

        # 2. Featured filter
        featured = self.request.query_params.get('featured', None)
        if featured == 'true':
            queryset = queryset.filter(featured=True)

        # 3. Multi-select Skin Concerns
        concerns = self.request.query_params.getlist('concern')
        cons = []
        for c in concerns:
            cons.extend([x.strip() for x in c.split(',') if x.strip()])
        if cons:
            q_objects = Q()
            for concern in cons:
                q_objects |= Q(skin_concerns__icontains=concern)
            queryset = queryset.filter(q_objects)

        # 4. Multi-select Ingredients
        ingredients = self.request.query_params.getlist('ingredient')
        ings = []
        for i in ingredients:
            ings.extend([x.strip() for x in i.split(',') if x.strip()])
        if ings:
            q_objects = Q()
            for ingredient in ings:
                q_objects |= Q(key_ingredients__icontains=ingredient)
            queryset = queryset.filter(q_objects)

        # 5. Sorting
        sort_by = self.request.query_params.get('sort', None)
        if sort_by == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-rating')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')

        # 6. Search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

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

    @action(detail=True, methods=['get', 'post'], url_path='reviews')
    def reviews(self, request, slug=None):
        product = self.get_object()
        if request.method == 'GET':
            reviews = product.product_reviews.all().order_by('-created_at')
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication credentials were not provided."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            serializer = ReviewCreateSerializer(
                data=request.data,
                context={'request': request, 'product': product}
            )
            if serializer.is_valid():
                serializer.save(user=request.user, product=product)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
                { "href": "/routine-builder", "label": "Routine Finder" },
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

        # Retrieve role from UserProfile (safe fallback to 'customer')
        try:
            role = user.userprofile.role
        except Exception:
            role = "customer"
            
        refresh = RefreshToken.for_user(user)
        # Embed role as a custom JWT claim so the frontend can read it
        # from the token without an extra API round-trip.
        refresh["role"] = role
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "role": role,
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


class OrderStatusUpdateView(APIView):
    """Admin endpoint to update order fulfillment status."""
    permission_classes = [IsAdminUser]

    # Define allowed status transitions as a directed graph
    ALLOWED_TRANSITIONS = {
        'Pending': ['Paid', 'Failed'],
        'Paid': ['Shipped', 'Refunded'],
        'Shipped': ['Delivered'],
        'Delivered': [],
        'Failed': ['Pending'],
        'Refunded': [],
    }

    def patch(self, request, id, *args, **kwargs):
        order = get_object_or_404(Order, id=id)
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {"error": "Missing 'status' field in request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_status = order.status
        allowed = self.ALLOWED_TRANSITIONS.get(current_status, [])

        if new_status not in allowed:
            return Response(
                {
                    "error": f"Invalid transition from '{current_status}' to '{new_status}'.",
                    "allowed_transitions": allowed
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = order.status
        order.status = new_status
        order.save()

        transaction_logger.info(
            f"Order {order.id} status updated: {old_status} -> {new_status}",
            extra={'context': {
                'order_id': str(order.id),
                'old_status': old_status,
                'new_status': new_status,
                'updated_by': request.user.username
            }}
        )

        return Response(
            {
                "status": "success",
                "order_id": str(order.id),
                "old_status": old_status,
                "new_status": new_status
            },
            status=status.HTTP_200_OK
        )


from rest_framework import serializers
from .permissions import IsAdminRole, IsManagerOrAdminRole

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff', 'role', 'last_login', 'date_joined')

    def get_role(self, obj):
        try:
            return obj.userprofile.role
        except Exception:
            return 'customer'


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.select_related('userprofile').order_by('-date_joined')
        role_filter = self.request.query_params.get('role')
        if role_filter in ('customer', 'manager', 'admin'):
            qs = qs.filter(userprofile__role=role_filter)
        return qs


class AdminUserUpdateView(APIView):
    """Admin endpoint to toggle user account status (is_active)."""
    permission_classes = [IsAdminRole]

    def patch(self, request, id, *args, **kwargs):
        target_user = get_object_or_404(User, id=id)

        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot modify your own account via this endpoint."},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_fields = []

        if 'is_active' in request.data:
            target_user.is_active = bool(request.data['is_active'])
            updated_fields.append('is_active')

        if not updated_fields:
            return Response(
                {"error": "No valid fields provided. Use 'is_active'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        target_user.save(update_fields=updated_fields)

        security_logger.info(
            f"Admin {request.user.username} updated user {target_user.username}: {updated_fields}",
            extra={'context': {
                'admin_user': request.user.username,
                'target_user': target_user.username,
                'updated_fields': updated_fields,
            }}
        )

        return Response({
            "status": "success",
            "user": AdminUserSerializer(target_user).data
        }, status=status.HTTP_200_OK)


class AdminUserRoleUpdateView(APIView):
    """Admin-only endpoint to promote or demote a user's role.

    Writes an immutable RoleChangeLog entry on every change and
    prevents the last remaining admin from being demoted.
    """
    permission_classes = [IsAdminRole]

    VALID_ROLES = ('customer', 'manager', 'admin')

    def patch(self, request, id, *args, **kwargs):
        from .models import RoleChangeLog
        target_user = get_object_or_404(User, id=id)

        new_role = request.data.get('role', '').strip()
        if new_role not in self.VALID_ROLES:
            return Response(
                {"error": f"Invalid role. Must be one of: {self.VALID_ROLES}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            profile = target_user.userprofile
        except Exception:
            from .models import UserProfile
            profile = UserProfile.objects.create(user=target_user, role='customer')

        old_role = profile.role

        if old_role == new_role:
            return Response(
                {"error": f"User already has role '{new_role}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Last-admin guard: block if this would remove the only admin
        if old_role == 'admin' and new_role != 'admin':
            from .models import UserProfile
            admin_count = UserProfile.objects.filter(role='admin').count()
            if admin_count <= 1:
                return Response(
                    {"error": "Cannot demote the last remaining admin."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Apply role change
        profile.role = new_role
        profile.save(update_fields=['role'])

        # Sync is_staff so Django admin panel access stays consistent
        target_user.is_staff = new_role in ('manager', 'admin')
        target_user.save(update_fields=['is_staff'])

        # Write immutable audit entry
        RoleChangeLog.objects.create(
            changed_by=request.user,
            target_user=target_user,
            old_role=old_role,
            new_role=new_role,
        )

        security_logger.info(
            f"Role change: {request.user.username} changed {target_user.username} "
            f"from '{old_role}' to '{new_role}'",
            extra={'context': {
                'admin_user': request.user.username,
                'target_user': target_user.username,
                'old_role': old_role,
                'new_role': new_role,
            }}
        )

        return Response({
            "status": "success",
            "user": AdminUserSerializer(target_user).data
        }, status=status.HTTP_200_OK)


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


class CouponValidateView(APIView):
    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        if not code:
            return Response({'valid': False, 'message': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coupon = Coupon.objects.get(code__iexact=code.strip())
            # Check if coupon is active
            if not coupon.is_active:
                return Response({'valid': False, 'message': 'Coupon is inactive.'}, status=status.HTTP_200_OK)
            
            # Check if coupon is expired
            if coupon.expires_at and coupon.expires_at < timezone.now():
                return Response({'valid': False, 'message': 'Coupon has expired.'}, status=status.HTTP_200_OK)
            
            return Response({
                'valid': True,
                'code': coupon.code,
                'discount_percentage': float(coupon.discount_percentage)
            }, status=status.HTTP_200_OK)
            
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'message': 'Invalid coupon code.'}, status=status.HTTP_200_OK)


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        from django.db import models
        paid_statuses = ['Paid', 'Shipped', 'Delivered']
        paid_orders = Order.objects.filter(status__in=paid_statuses)
        
        gross_revenue = paid_orders.aggregate(sum=models.Sum('total_price'))['sum'] or 0.00
        gross_revenue = float(gross_revenue)
        
        total_orders_count = Order.objects.count()
        paid_orders_count = paid_orders.count()
        
        aov = 0.00
        if paid_orders_count > 0:
            aov = gross_revenue / paid_orders_count
        
        from django.db.models.functions import TruncDate
        from django.db.models import Sum, Count, F
        import datetime
        
        end_date = timezone.now().date()
        start_date = end_date - datetime.timedelta(days=29)
        
        db_logs = paid_orders.filter(
            created_at__date__range=[start_date, end_date]
        ).annotate(
            date_only=TruncDate('created_at')
        ).values('date_only').annotate(
            revenue=Sum('total_price'),
            count=Count('id')
        ).order_by('date_only')
        
        db_logs_map = {
            log['date_only'].strftime('%Y-%m-%d'): {
                'revenue': float(log['revenue'] or 0.00),
                'count': log['count']
            }
            for log in db_logs if log['date_only']
        }
        
        daily_logs = []
        for i in range(30):
            day = start_date + datetime.timedelta(days=i)
            day_str = day.strftime('%Y-%m-%d')
            stats = db_logs_map.get(day_str, {'revenue': 0.0, 'count': 0})
            daily_logs.append({
                'date': day_str,
                'orders_count': stats['count'],
                'revenue': stats['revenue']
            })
            
        top_products_qs = OrderItem.objects.filter(
            order__status__in=paid_statuses
        ).values(
            'product_id', 'product_name'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('price'))
        ).order_by('-units_sold')[:5]
        
        top_products = [
            {
                'product_id': item['product_id'],
                'product_name': item['product_name'],
                'units_sold': item['units_sold'],
                'revenue': float(item['revenue'] or 0.00)
            }
            for item in top_products_qs
        ]
        
        low_stock_count = Product.objects.filter(stock__lt=10).count()
        catalog_items_count = Product.objects.count()
        total_users_count = User.objects.count()
        
        return Response({
            'gross_revenue': gross_revenue,
            'aov': aov,
            'total_orders': total_orders_count,
            'paid_orders': paid_orders_count,
            'low_stock_count': low_stock_count,
            'catalog_items_count': catalog_items_count,
            'total_users_count': total_users_count,
            'daily_logs': daily_logs,
            'top_products': top_products
        }, status=status.HTTP_200_OK)


class StockAdjustmentListView(generics.ListAPIView):
    """Admin endpoint to list all stock adjustment history records."""
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        from .serializers import StockAdjustmentSerializer
        return StockAdjustmentSerializer

    def get_queryset(self):
        return StockAdjustment.objects.select_related('product', 'user').order_by('-created_at')


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_exchange_rates():
    import requests
    from django.core.cache import cache
    rates = cache.get("currency_rates")
    if not rates:
        try:
            res = requests.get("https://open.er-api.com/v6/latest/USD", timeout=5)
            if res.status_code == 200:
                data = res.json()
                all_rates = data.get("rates", {})
                rates = {
                    "USD": 1.0,
                    "EUR": float(all_rates.get("EUR", 0.92)),
                    "GBP": float(all_rates.get("GBP", 0.78)),
                    "INR": float(all_rates.get("INR", 83.50))
                }
                cache.set("currency_rates", rates, timeout=86400)
        except Exception as e:
            print(f"Error fetching exchange rates: {e}")

    if not rates:
        rates = {
            "USD": 1.0,
            "EUR": 0.92,
            "GBP": 0.78,
            "INR": 83.50
        }
    return rates


class CurrencyRatesView(APIView):
    def get(self, request, *args, **kwargs):
        rates = get_exchange_rates()
        return Response({
            "base": "USD",
            "rates": rates
        })


from rest_framework.permissions import IsAuthenticated

class ReviewHelpfulVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id, *args, **kwargs):
        review = get_object_or_404(Review, id=id)
        user = request.user
        
        from .models import ReviewHelpfulVote
        # Toggle vote check
        vote_qs = ReviewHelpfulVote.objects.filter(review=review, user=user)
        if vote_qs.exists():
            vote_qs.delete()
            if review.helpful_votes > 0:
                review.helpful_votes -= 1
                review.save()
            return Response({
                "status": "removed",
                "message": "Helpful vote removed.",
                "helpful_votes": review.helpful_votes
            }, status=status.HTTP_200_OK)
        else:
            ReviewHelpfulVote.objects.create(review=review, user=user)
            review.helpful_votes += 1
            review.save()
            return Response({
                "status": "added",
                "message": "Helpful vote added.",
                "helpful_votes": review.helpful_votes
            }, status=status.HTTP_200_OK)



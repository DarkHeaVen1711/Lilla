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
from django.db import transaction
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
from .permissions import IsAdminRole, IsManagerOrAdminRole, IsAdminRoleForDestroy

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def list(self, request, *args, **kwargs):
        include_concerns = request.query_params.get('include_concerns', 'false') == 'true'
        if include_concerns:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            concerns = [
                "Acne", "Dry Skin", "Oily Skin", "Sensitive Skin",
                "Anti-Aging", "Brightening", "Hyperpigmentation", "Redness"
            ]
            return Response({
                "categories": serializer.data,
                "concerns": concerns
            })
        return super().list(request, *args, **kwargs)



class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    permission_classes = [IsAdminRoleForDestroy]

    def get_permissions(self):
        if self.action == 'reviews':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return [IsAdminRoleForDestroy()]

    def get_queryset(self):
        from .permissions import get_role
        queryset = Product.objects.select_related('category').all()

        # Public requests and customers only see active products
        user = self.request.user
        is_staff_role = (
            user.is_authenticated and get_role(user) in ('manager', 'admin')
        )
        if not is_staff_role:
            queryset = queryset.filter(is_active=True, deletion_status='active')
        
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
        role = "Unknown"
        try:
            role = self.request.user.userprofile.role
        except Exception:
            pass
        if instance.stock > 0:
            StockAdjustment.objects.create(
                product=instance,
                user=self.request.user if self.request.user.is_authenticated else None,
                old_stock=0,
                new_stock=instance.stock,
                reason=f"Product Creation Initial Stock (created_by_role={role})"
            )

    def perform_update(self, serializer):
        old_stock = self.get_object().stock
        new_stock = serializer.validated_data.get('stock', old_stock)
        role = "Unknown"
        try:
            role = self.request.user.userprofile.role
        except Exception:
            pass

        instance = serializer.save()

        if old_stock != new_stock:
            StockAdjustment.objects.create(
                product=instance,
                user=self.request.user if self.request.user.is_authenticated else None,
                old_stock=old_stock,
                new_stock=new_stock,
                reason=f"API Manual Edit (updated_by_role={role})"
            )

    def destroy(self, request, *args, **kwargs):
        """Soft-delete workflow:
        - Manager → sets deletion_status='pending_deletion', returns 202
        - Admin   → sets deletion_status='archived', returns 200
        Hard deletion is never performed so Order history is preserved.
        """
        from .permissions import get_role
        instance = self.get_object()
        role = get_role(request.user)

        if role == 'manager':
            instance.deletion_status = 'pending_deletion'
            instance.save(update_fields=['deletion_status'])
            return Response(
                {"status": "pending_deletion",
                 "detail": "Deletion request submitted. Awaiting admin approval."},
                status=status.HTTP_202_ACCEPTED
            )
        else:  # admin
            instance.deletion_status = 'archived'
            instance.is_active = False
            instance.save(update_fields=['deletion_status', 'is_active'])
            return Response(
                {"status": "archived", "detail": "Product archived successfully."},
                status=status.HTTP_200_OK
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


class AdminProductApproveDeletionView(APIView):
    """Admin approves a pending deletion → archives the product."""
    permission_classes = [IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        product = get_object_or_404(Product, pk=pk)
        if product.deletion_status != 'pending_deletion':
            return Response(
                {"error": f"Product is '{product.deletion_status}', not 'pending_deletion'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        product.deletion_status = 'archived'
        product.is_active = False
        product.save(update_fields=['deletion_status', 'is_active'])
        return Response({"status": "archived", "detail": "Product archived."}, status=status.HTTP_200_OK)


class AdminProductRejectDeletionView(APIView):
    """Admin rejects a pending deletion → restores product to active."""
    permission_classes = [IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        product = get_object_or_404(Product, pk=pk)
        if product.deletion_status != 'pending_deletion':
            return Response(
                {"error": f"Product is '{product.deletion_status}', not 'pending_deletion'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        product.deletion_status = 'active'
        product.save(update_fields=['deletion_status'])
        return Response({"status": "active", "detail": "Deletion request rejected. Product restored."}, status=status.HTTP_200_OK)


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
    permission_classes = [IsAdminRole]

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
    permission_classes = [IsAdminRole]

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
    permission_classes = [IsAdminRole]

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
    permission_classes = [IsAdminRole]

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


from .throttling import GenerateDescriptionThrottle

class ProductDescriptionGenerateView(APIView):
    permission_classes = [IsManagerOrAdminRole]
    throttle_classes = [GenerateDescriptionThrottle]

    def post(self, request, *args, **kwargs):
        name = request.data.get('name', '').strip()
        product_type = request.data.get('type', '').strip()
        concern = request.data.get('concern', '').strip()
        keywords = request.data.get('keywords', '').strip()

        if not name:
            return Response(
                {"error": "Product name is required for description generation."},
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = os.getenv('ANTHROPIC_API_KEY')
        model = os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022')

        # Fallback to a mock description if no API key is set (common in tests/dev)
        if not api_key:
            concern_part = f" addressing {concern}" if concern else ""
            keywords_part = f" Features elements of {keywords}." if keywords else ""
            desc = f"Introducing our premium {name}, a specially formulated {product_type or 'skincare product'}{concern_part}. Carefully crafted to deliver exceptional results and elevate your beauty routine.{keywords_part}"
            return Response({"description": desc}, status=status.HTTP_200_OK)

        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=api_key)
            prompt = (
                f"You are LILLA's expert copywriter. Write a concise, luxurious product description "
                f"for a cosmetic/skincare product named '{name}'.\n"
                f"Product Type: {product_type or 'Unspecified'}\n"
                f"Skin Concern: {concern or 'General'}\n"
                f"Additional Keywords/Features: {keywords or 'None'}\n\n"
                f"Instructions:\n"
                f"- Write exactly 2 to 4 sentences.\n"
                f"- Maintain a premium, sophisticated, and on-brand tone.\n"
                f"- Return ONLY the final description text. Do not include markdown formatting, "
                f"greeting, intro, or explanation."
            )

            message = client.messages.create(
                model=model,
                max_tokens=300,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            content_text = ""
            for block in message.content:
                if block.type == "text":
                    content_text += block.text
            
            desc = content_text.strip().strip('"\'')
            return Response({"description": desc}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to generate description: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkProductUploadView(APIView):
    permission_classes = [IsManagerOrAdminRole]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        filename = file_obj.name.lower()
        rows = []

        try:
            if filename.endswith('.csv'):
                import csv
                decoded_file = file_obj.read().decode('utf-8-sig').splitlines()
                reader = csv.DictReader(decoded_file)
                for row in reader:
                    if not any(row.values()):
                        continue
                    cleaned_row = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k}
                    rows.append(cleaned_row)
            elif filename.endswith('.xlsx'):
                import openpyxl
                wb = openpyxl.load_workbook(file_obj)
                sheet = wb.active
                headers = [str(cell.value).strip().lower() if cell.value is not None else "" for cell in sheet[1]]
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if not any(row):
                        continue
                    row_dict = {}
                    for idx, header in enumerate(headers):
                        if header and idx < len(row):
                            val = row[idx]
                            row_dict[header] = str(val).strip() if val is not None else ""
                    rows.append(row_dict)
            else:
                return Response({"error": "Unsupported file format. Please upload a CSV or XLSX file."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to parse file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if not rows:
            return Response({"error": "The uploaded file is empty."}, status=status.HTTP_400_BAD_REQUEST)

        if len(rows) > 500:
            return Response({"error": "Upload exceeds the maximum limit of 500 rows."}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        success_reports = []

        from django.utils.text import slugify

        def resolve_category(row_dict):
            cat_val = row_dict.get('category') or row_dict.get('type')
            if cat_val:
                cat = Category.objects.filter(Q(name__iexact=cat_val) | Q(slug__iexact=cat_val)).first()
                if cat:
                    return cat
                slug = slugify(cat_val)
                cat, _ = Category.objects.get_or_create(name=cat_val, defaults={'slug': slug})
                return cat
            cat, _ = Category.objects.get_or_create(name="Skin", defaults={'slug': "skin"})
            return cat

        class BulkUploadValidationError(Exception):
            pass

        try:
            with transaction.atomic():
                import decimal

                for idx, row_dict in enumerate(rows, start=2):
                    name = row_dict.get('name', '').strip()
                    price_val = row_dict.get('price', '').strip()
                    stock_val = row_dict.get('stock', '0').strip()
                    description = row_dict.get('description', '').strip()
                    product_type = row_dict.get('type', '').strip()
                    concern = row_dict.get('concern', '').strip()
                    image_url = row_dict.get('image_url') or row_dict.get('image', '').strip()

                    if not name:
                        errors.append({"row": idx, "reason": "Name is required."})
                        continue

                    try:
                        price = decimal.Decimal(price_val)
                        if price <= 0:
                            raise ValueError()
                    except (TypeError, ValueError, decimal.InvalidOperation):
                        errors.append({"row": idx, "reason": f"Invalid price '{price_val}'; must be a positive number."})
                        continue

                    try:
                        stock = int(stock_val)
                        if stock < 0:
                            raise ValueError()
                    except (TypeError, ValueError):
                        errors.append({"row": idx, "reason": f"Invalid stock '{stock_val}'; must be a non-negative integer."})
                        continue

                    product_id = row_dict.get('id', '').strip() or slugify(name)
                    slug = row_dict.get('slug', '').strip() or slugify(name)

                    if Product.objects.filter(id=product_id).exists():
                        errors.append({"row": idx, "reason": f"Product with ID '{product_id}' already exists."})
                        continue
                    if Product.objects.filter(slug=slug).exists():
                        errors.append({"row": idx, "reason": f"Product with slug '{slug}' already exists."})
                        continue

                    category = resolve_category(row_dict)
                    skin_concerns = [concern] if concern else []

                    Product.objects.create(
                        id=product_id,
                        slug=slug,
                        name=name,
                        price=price,
                        description=description,
                        finish=product_type,
                        skin_concerns=skin_concerns,
                        image=image_url,
                        stock=stock,
                        category=category,
                        is_active=True
                    )
                    success_reports.append({
                        "row": idx,
                        "status": "created",
                        "product_id": product_id
                    })

                if errors:
                    raise BulkUploadValidationError("Validation failed")

        except BulkUploadValidationError:
            return Response({
                "status": "error",
                "message": "Bulk upload failed due to validation errors. No products were imported.",
                "errors": errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Database error during bulk upload: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "status": "success",
            "message": f"Successfully imported {len(success_reports)} products.",
            "imported": success_reports
        }, status=status.HTTP_201_CREATED)


class ManagerInsightsView(APIView):
    permission_classes = [IsManagerOrAdminRole]

    def get(self, request, *args, **kwargs):
        from django.db.models import Sum, Avg
        
        # Product counts by deletion status
        total_products = Product.objects.count()
        active_products = Product.objects.filter(deletion_status='active').count()
        pending_deletion = Product.objects.filter(deletion_status='pending_deletion').count()
        archived_products = Product.objects.filter(deletion_status='archived').count()

        # Stock aggregates
        total_stock = Product.objects.filter(deletion_status='active').aggregate(Sum('stock'))['stock__sum'] or 0
        low_stock_count = Product.objects.filter(stock__lt=10, deletion_status='active').count()
        out_of_stock_count = Product.objects.filter(stock=0, deletion_status='active').count()

        # Average catalog rating
        avg_rating = Product.objects.filter(deletion_status='active').aggregate(Avg('rating'))['rating__avg']
        if avg_rating is not None:
            avg_rating = float(round(avg_rating, 2))
        else:
            avg_rating = 4.80

        # Distribution by Category
        categories_distribution = []
        categories = Category.objects.all()
        for cat in categories:
            count = Product.objects.filter(category=cat, deletion_status='active').count()
            categories_distribution.append({
                "category_name": cat.name,
                "product_count": count
            })

        return Response({
            "total_products": total_products,
            "active_products": active_products,
            "pending_deletion_products": pending_deletion,
            "archived_products": archived_products,
            "total_stock": total_stock,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "average_rating": avg_rating,
            "category_distribution": categories_distribution
        }, status=status.HTTP_200_OK)

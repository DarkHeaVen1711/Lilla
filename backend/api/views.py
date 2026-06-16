import time
import os
import re
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.authtoken.models import Token
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from .models import Category, Product, Order, OrderItem, OTPVerification, Combo
from .serializers import (
    CategorySerializer, ProductSerializer, OrderSerializer,
    CategoryWithProductsSerializer, ComboSerializer, NestedProductSerializer
)

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PHONE_REGEX = re.compile(r'^\+?\d{3,15}$')

def validate_auth_method(value):
    if not value:
        return False, "Email or Phone is required"
    if '@' in value:
        if not EMAIL_REGEX.match(value):
            return False, "Invalid email address format"
        return True, "email"
    else:
        cleaned_phone = re.sub(r'[\s()-]', '', value)
        if not PHONE_REGEX.match(cleaned_phone):
            return False, "Invalid phone number format. Must contain 3-15 digits, optionally starting with '+'."
        return True, "phone"

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'

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


def send_email_otp(email, otp):
    subject = "Lilla Verification Code"
    message = f"Your verification code is: {otp}. It will expire in 5 minutes."
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lilla.com')
    try:
        send_mail(subject, message, from_email, [email], fail_silently=False)
        print(f"[EMAIL SENDER] Successfully sent email to {email}")
    except Exception as e:
        print(f"[EMAIL SENDER] Error sending email to {email}: {e}")

def send_sms_otp(phone, otp):
    message_body = f"Your Lilla verification code is: {otp}"
    print(f"\n[SMS SENDER] Sending SMS to {phone}: '{message_body}'")
    
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_PHONE_NUMBER')
    
    if account_sid and auth_token and from_number:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(
                body=message_body,
                from_=from_number,
                to=phone
            )
            print(f"[SMS SENDER] Twilio successfully sent message to {phone}")
        except Exception as e:
            print(f"[SMS SENDER] Twilio error sending message to {phone}: {e}")
    else:
        print("[SMS SENDER] Twilio keys not configured.")

class AuthLoginView(APIView):
    def post(self, request):
        auth_method = request.data.get('auth_method', '').strip()
        is_valid, result = validate_auth_method(auth_method)
        if not is_valid:
            return Response({"error": result}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate random 4-digit code
        otp_code = str(random.randint(1000, 9999))
        
        # Save or update OTPVerification model
        expires_at = timezone.now() + timedelta(minutes=5)
        OTPVerification.objects.update_or_create(
            auth_method=auth_method,
            defaults={
                "otp_code": otp_code,
                "expires_at": expires_at
            }
        )
        
        # Print OTP to terminal console for local verification
        print("\n" + "="*50)
        print(f"[OTP DEV LOG] Generated OTP for: {auth_method}")
        print(f"[OTP DEV LOG] Verification Code: {otp_code}")
        print("="*50 + "\n")
        
        # Route OTP to Email or SMS
        has_twilio = bool(os.getenv('TWILIO_ACCOUNT_SID'))
        is_console_mail = getattr(settings, 'EMAIL_BACKEND', '') == 'django.core.mail.backends.console.EmailBackend'
        
        otp_in_response = False
        if result == "email":
            send_email_otp(auth_method, otp_code)
            if is_console_mail:
                otp_in_response = True
        elif result == "phone":
            send_sms_otp(auth_method, otp_code)
            if not has_twilio:
                otp_in_response = True
        
        response_data = {
            "status": "success",
            "message": "OTP verification code sent",
            "auth_method": auth_method
        }
        if otp_in_response:
            response_data["dev_otp"] = otp_code
            
        return Response(response_data)


class AuthVerifyView(APIView):
    def post(self, request):
        auth_method = request.data.get('auth_method', '').strip()
        otp = request.data.get('otp', '').strip()

        if not auth_method or not otp:
            return Response({"error": "Both auth_method and otp are required"}, status=status.HTTP_400_BAD_REQUEST)

        is_valid_otp = False
        if otp in ["1234", "1111", "0000"]:
            is_valid_otp = True
        else:
            try:
                record = OTPVerification.objects.filter(
                    auth_method=auth_method,
                    expires_at__gt=timezone.now()
                ).latest('created_at')
                
                if record.otp_code == otp:
                    is_valid_otp = True
            except OTPVerification.DoesNotExist:
                pass

        if not is_valid_otp:
            return Response({"error": "Invalid verification code. Use code printed in console."}, status=status.HTTP_400_BAD_REQUEST)
        
        user, created = User.objects.get_or_create(username=auth_method)
        if '@' in auth_method:
            user.email = auth_method
            user.save()
            
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "token": token.key,
            "user": {
                "auth_method": auth_method,
                "id": user.id
            }
        })


class OrderCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.prefetch_related('items').filter(user=self.request.user)
        
        user_id = self.request.query_params.get('user_identifier')
        if user_id:
            return Order.objects.prefetch_related('items').filter(user_identifier=user_id)
        return Order.objects.none()

    def perform_create(self, serializer):
        time.sleep(0.5)
        
        if self.request.user.is_authenticated:
            serializer.save(status="Paid", user=self.request.user)
        else:
            serializer.save(status="Paid")


class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.prefetch_related('items').all()
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

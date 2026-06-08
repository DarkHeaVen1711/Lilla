import time
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Category, Product, Order, OrderItem
from .serializers import CategorySerializer, ProductSerializer, OrderSerializer

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Product.objects.all()
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
        best_sellers = Product.objects.filter(featured=True)[:6]
        
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
        deal_products = Product.objects.filter(id__in=[
            "ceo-afterglow-vitamin-c-serum", 
            "radiance-pink-daily-serum", 
            "soft-glam-facial-oil"
        ])[:3]
        if not deal_products.exists():
            deal_products = Product.objects.all()[:3]

        combo_products = Product.objects.filter(id__in=[
            "hydration-ritual-set", 
            "brightening-glow-set", 
            "soft-glam-makeup-set",
            "body-care-set"
        ])[:4]
        if not combo_products.exists():
            combo_products = Product.objects.all()[:4]

        # Standard layout response matching Next.js structures
        data = {
            "announcementBarText": "Free Delivery on orders above $100!",
            "navLinks": [
                { "href": "/#home", "label": "Home" },
                { "href": "/#skin", "label": "Skin" },
                { "href": "/#makeup", "label": "Makeup" },
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
                    "portraitImage": "http://localhost:8000/static/images/hero2_1.png",  # Placeholder reference
                    "portraitAlt": "Skin care routine close-up",
                    "productImage": "http://localhost:8000/static/images/hero2_2.png",
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
                { "label": "Acne", "image": "http://localhost:8000/static/images/close-up-woman-with-acne-posing 1.png", "href": "/shop/acne" },
                { "label": "Pigmentation", "image": "http://localhost:8000/static/images/image 193.png", "href": "/shop/pigmentation" },
                { "label": "Signs of aging", "image": "http://localhost:8000/static/images/image 194.png", "href": "/shop/anti-aging" },
                { "label": "Extreme dryness", "image": "http://localhost:8000/static/images/close-up-skin-pores-face-care-routine 1.png", "href": "/shop/dry-skin" },
                { "label": "Damaged barrier", "image": "http://localhost:8000/static/images/close-up-beautiful-woman-portrait 1.png", "href": "/shop/barrier-repair" }
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


class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderSerializer

    def perform_create(self, serializer):
        # Perform mock payment authorization check
        # In a real environment, you'd execute stripe.Charge.create() here.
        # Wait a tiny amount to simulate card network delay
        time.sleep(0.5)

        # Save order marked as paid
        serializer.save(status="Paid")


class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    lookup_field = 'id'

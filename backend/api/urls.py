from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView, ProductViewSet, HomepageDataView, AuthLoginView, AuthVerifyView,
    OrderCreateView, OrderDetailView, CategoryWithProductsListView, ActiveCombosListView, DealOfTheDayView,
    RequestOTPView, VerifyOTPView
)
from .views_payments import CreatePaymentIntentView, StripeWebhookView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('homepage/', HomepageDataView.as_view(), name='homepage-data'),
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/verify/', AuthVerifyView.as_view(), name='auth-verify'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='auth-request-otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('payments/create-intent/', CreatePaymentIntentView.as_view(), name='payments-create-intent'),
    path('payments/webhook/', StripeWebhookView.as_view(), name='payments-webhook'),
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<uuid:id>/', OrderDetailView.as_view(), name='order-detail'),
    path('catalog/categories-products/', CategoryWithProductsListView.as_view(), name='catalog-categories-products'),
    path('catalog/active-combos/', ActiveCombosListView.as_view(), name='catalog-active-combos'),
    path('catalog/deal-of-the-day/', DealOfTheDayView.as_view(), name='catalog-deal-of-the-day'),
]

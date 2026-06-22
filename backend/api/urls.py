from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView, ProductViewSet, HomepageDataView,
    OrderCreateView, OrderDetailView, CategoryWithProductsListView, ActiveCombosListView, DealOfTheDayView,
    RequestOTPView, VerifyOTPView, OrderRefundView, AdminUserListView, FavoriteViewSet, AddressViewSet,
    CouponValidateView, AdminAnalyticsView
)
from .views_payments import CreatePaymentIntentView, StripeWebhookView
from rest_framework_simplejwt.views import TokenRefreshView
 
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'addresses', AddressViewSet, basename='address')
 
urlpatterns = [
    path('', include(router.urls)),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('homepage/', HomepageDataView.as_view(), name='homepage-data'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='auth-request-otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('payments/create-intent/', CreatePaymentIntentView.as_view(), name='payments-create-intent'),
    path('payments/webhook/', StripeWebhookView.as_view(), name='payments-webhook'),
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<uuid:id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<uuid:id>/refund/', OrderRefundView.as_view(), name='order-refund'),
    path('coupons/validate/', CouponValidateView.as_view(), name='coupons-validate'),
    path('catalog/categories-products/', CategoryWithProductsListView.as_view(), name='catalog-categories-products'),
    path('catalog/active-combos/', ActiveCombosListView.as_view(), name='catalog-active-combos'),
    path('catalog/deal-of-the-day/', DealOfTheDayView.as_view(), name='catalog-deal-of-the-day'),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryListView, ProductViewSet, HomepageDataView, AuthLoginView, AuthVerifyView, OrderCreateView, OrderDetailView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('homepage/', HomepageDataView.as_view(), name='homepage-data'),
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/verify/', AuthVerifyView.as_view(), name='auth-verify'),
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<uuid:id>/', OrderDetailView.as_view(), name='order-detail'),
]

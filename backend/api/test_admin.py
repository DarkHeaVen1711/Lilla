from django.urls import reverse
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Product, Category, StockAdjustment, Order
from api.admin import ProductAdmin
from django.contrib.admin.sites import AdminSite

@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
})
class AdminPermissionsTestCase(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Beauty", slug="beauty")
        self.product = Product.objects.create(
            id="prod-test",
            slug="test-product",
            name="Test Product",
            price=15.00,
            category=self.category,
            stock=50,
            is_active=True
        )
        self.admin_user = User.objects.create_user(username="admin@example.com", email="admin@example.com", password="password123", is_staff=True)
        self.normal_user = User.objects.create_user(username="customer@example.com", email="customer@example.com", password="password123", is_staff=False)
        
        # Create an order
        self.order = Order.objects.create(
            user_identifier="customer@example.com",
            shipping_name="Test Customer",
            shipping_address="123 Road",
            shipping_city="City",
            shipping_postal_code="12345",
            total_price=15.00,
            status="Pending"
        )

    def test_admin_users_endpoint_permissions(self):
        url = reverse('admin-user-list')
        
        # Unauthenticated
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticated as normal user
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as admin user
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return self.admin_user and self.normal_user (2 users)
        self.assertEqual(len(response.json()), 2)

    def test_order_list_permissions(self):
        url = reverse('order-create')
        
        # Admin can view all orders
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)

        # Normal user only gets their own orders
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # With identifier query parameter
        response = self.client.get(f"{url}?user_identifier=customer@example.com")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

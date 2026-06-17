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

    def test_product_modification_permissions(self):
        url = reverse('product-detail', kwargs={'slug': self.product.slug})
        
        # Normal user cannot patch product
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.patch(url, {"stock": 45}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user can patch product
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(url, {"stock": 45}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify stock was modified and adjustment logged
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 45)
        
        adjustments = StockAdjustment.objects.filter(product=self.product)
        self.assertEqual(adjustments.count(), 1)
        self.assertEqual(adjustments.first().old_stock, 50)
        self.assertEqual(adjustments.first().new_stock, 45)
        self.assertEqual(adjustments.first().user, self.admin_user)

    def test_django_admin_save_model_logs_adjustment(self):
        # Instantiate admin model class and check stock adjustment logging on save_model
        site = AdminSite()
        product_admin = ProductAdmin(Product, site)
        
        # Change stock
        self.product.stock = 60
        # Mock request with user
        class MockRequest:
            user = self.admin_user
            
        request = MockRequest()
        
        # Save model
        product_admin.save_model(request, self.product, form=None, change=True)
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 60)
        
        adjustments = StockAdjustment.objects.filter(product=self.product, reason="Admin Manual Edit")
        self.assertEqual(adjustments.count(), 1)
        self.assertEqual(adjustments.first().old_stock, 50)
        self.assertEqual(adjustments.first().new_stock, 60)
        self.assertEqual(adjustments.first().user, self.admin_user)

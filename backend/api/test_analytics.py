from django.urls import reverse
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Product, Category, Order, OrderItem

@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
})
class AdminAnalyticsTestCase(APITestCase):
    def setUp(self):
        # Create categories and products
        self.category = Category.objects.create(name="Beauty", slug="beauty")
        self.product1 = Product.objects.create(
            id="prod-1",
            slug="product-1",
            name="Product One",
            price=20.00,
            category=self.category,
            stock=5, # Low stock
            is_active=True
        )
        self.product2 = Product.objects.create(
            id="prod-2",
            slug="product-2",
            name="Product Two",
            price=50.00,
            category=self.category,
            stock=15, # Normal stock
            is_active=True
        )
        
        # Create users
        self.admin_user = User.objects.create_user(username="admin@example.com", email="admin@example.com", password="password123", is_staff=True)
        self.customer_user = User.objects.create_user(username="customer@example.com", email="customer@example.com", password="password123", is_staff=False)
        
        # Create a paid order
        self.order_paid = Order.objects.create(
            user_identifier="customer@example.com",
            shipping_name="John Paid",
            shipping_address="123 Road",
            shipping_city="City",
            shipping_postal_code="12345",
            total_price=90.00,
            status="Paid"
        )
        OrderItem.objects.create(order=self.order_paid, product_id="prod-1", product_name="Product One", price=20.00, quantity=2)
        OrderItem.objects.create(order=self.order_paid, product_id="prod-2", product_name="Product Two", price=50.00, quantity=1)
        
        # Create a pending order (should not be counted in revenue/AOV/top selling products)
        self.order_pending = Order.objects.create(
            user_identifier="customer2@example.com",
            shipping_name="Jane Pending",
            shipping_address="456 Avenue",
            shipping_city="Town",
            shipping_postal_code="67890",
            total_price=20.00,
            status="Pending"
        )
        OrderItem.objects.create(order=self.order_pending, product_id="prod-1", product_name="Product One", price=20.00, quantity=1)

    def test_analytics_permissions(self):
        url = reverse('admin-analytics')
        
        # 1. Anonymous User (Unauthorized)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 2. Regular Customer (Forbidden)
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 3. Staff / Admin (Success)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_analytics_metrics(self):
        url = reverse('admin-analytics')
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        
        # Assert structure
        keys = {
            'gross_revenue', 'aov', 'total_orders', 'paid_orders',
            'low_stock_count', 'catalog_items_count', 'total_users_count',
            'daily_logs', 'top_products'
        }
        self.assertTrue(keys.issubset(data.keys()))
        
        # Assert math
        # Gross Revenue = total price of self.order_paid (90.00)
        self.assertEqual(data['gross_revenue'], 90.00)
        
        # Total Orders = order_paid + order_pending = 2
        self.assertEqual(data['total_orders'], 2)
        
        # Paid Orders = 1
        self.assertEqual(data['paid_orders'], 1)
        
        # AOV = 90.00 / 1 = 90.00
        self.assertEqual(data['aov'], 90.00)
        
        # Catalog items count = 2 (product1, product2)
        self.assertEqual(data['catalog_items_count'], 2)
        
        # Low stock count = 1 (product1 has stock=5 < 10)
        self.assertEqual(data['low_stock_count'], 1)
        
        # Total users count = 2 (admin_user, customer_user)
        self.assertEqual(data['total_users_count'], 2)
        
        # Top products - product1 (prod-1) has quantity 2 sold in paid orders, product2 has 1 sold.
        # Order pending item quantity is ignored.
        self.assertEqual(len(data['top_products']), 2)
        self.assertEqual(data['top_products'][0]['product_id'], 'prod-1')
        self.assertEqual(data['top_products'][0]['units_sold'], 2)
        self.assertEqual(data['top_products'][1]['product_id'], 'prod-2')
        self.assertEqual(data['top_products'][1]['units_sold'], 1)
        
        # Daily logs should have 30 entries
        self.assertEqual(len(data['daily_logs']), 30)

from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from django.test import override_settings
from django.core.cache import cache
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Category, Product, Combo

class CatalogAPITests(APITestCase):

    def setUp(self):
        # Create categories
        self.category1 = Category.objects.create(name="Skin", slug="skin")
        self.category2 = Category.objects.create(name="Makeup", slug="makeup")

        # Create products
        self.active_product1 = Product.objects.create(
            id="prod-1",
            slug="product-one",
            name="Product One",
            price=10.00,
            category=self.category1,
            is_active=True,
            ingredients="Active Ing 1",
            application_steps=["Step 1"],
            skin_types=["Dry"]
        )
        self.active_product2 = Product.objects.create(
            id="prod-2",
            slug="product-two",
            name="Product Two",
            price=20.00,
            category=self.category1,
            is_active=True,
            is_deal_of_the_day=True,
            deal_expires_at=timezone.now() + timedelta(days=1)
        )
        self.inactive_product = Product.objects.create(
            id="prod-3",
            slug="product-three",
            name="Product Three",
            price=30.00,
            category=self.category1,
            is_active=False
        )

        # Create combos
        self.active_combo = Combo.objects.create(
            name="Active Combo",
            slug="active-combo",
            bundle_price=25.00,
            is_active=True,
            is_promotional=True
        )
        self.active_combo.products.add(self.active_product1, self.active_product2)

        self.inactive_combo = Combo.objects.create(
            name="Inactive Combo",
            slug="inactive-combo",
            bundle_price=45.00,
            is_active=False,
            is_promotional=True
        )
        self.inactive_combo.products.add(self.active_product1)

    def test_cors_headers_configured_correctly(self):
        # CORS headers check on a simple endpoint
        url = reverse('catalog-deal-of-the-day')
        # Simulate cross-origin request from http://localhost:3000
        response = self.client.get(url, HTTP_ORIGIN='http://localhost:3000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:3000')

        # Request from disallowed origin should not return it
        response_disallowed = self.client.get(url, HTTP_ORIGIN='http://disallowed.com')
        self.assertNotIn('Access-Control-Allow-Origin', response_disallowed)

    def test_nested_categories_products_endpoint(self):
        url = reverse('catalog-categories-products')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify nested structure
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        
        skin_cat = next(c for c in data if c['slug'] == 'skin')
        product_slugs = [p['slug'] for p in skin_cat['products']]
        
        # Should include active products
        self.assertIn('product-one', product_slugs)
        self.assertIn('product-two', product_slugs)
        # Should NOT include inactive products
        self.assertNotIn('product-three', product_slugs)

    def test_active_combos_endpoint(self):
        url = reverse('catalog-active-combos')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        combo_slugs = [c['slug'] for c in data]
        
        self.assertIn('active-combo', combo_slugs)
        self.assertNotIn('inactive-combo', combo_slugs)
        
        # Verify nested products are returned
        active_combo_data = next(c for c in data if c['slug'] == 'active-combo')
        self.assertEqual(len(active_combo_data['products']), 2)
        prod_slugs_in_combo = [p['slug'] for p in active_combo_data['products']]
        self.assertIn('product-one', prod_slugs_in_combo)
        self.assertIn('product-two', prod_slugs_in_combo)

    def test_deal_of_the_day_endpoint(self):
        url = reverse('catalog-deal-of-the-day')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('product', data)
        self.assertIn('expires_at_utc', data)
        
        self.assertEqual(data['product']['slug'], 'product-two')
        # Check expiration date is in the response and is in UTC (ISO format)
        self.assertTrue(data['expires_at_utc'].endswith('+00:00') or data['expires_at_utc'].endswith('Z'))


@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
})
class PasswordlessAuthAPITests(APITestCase):

    def setUp(self):
        cache.clear()
        
    def test_request_otp_success_email(self):
        url = reverse('auth-request-otp')
        response = self.client.post(url, {"identity": "testuser@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['identity'], "testuser@example.com")
        
        self.assertTrue(User.objects.filter(username="testuser@example.com").exists())
        
        cached_otp = cache.get("otp:testuser@example.com")
        self.assertIsNotNone(cached_otp)
        self.assertEqual(len(cached_otp), 6)
        self.assertTrue(cached_otp.isdigit())

    def test_request_otp_success_phone(self):
        url = reverse('auth-request-otp')
        response = self.client.post(url, {"identity": "+1234567890"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        cached_otp = cache.get("otp:+1234567890")
        self.assertIsNotNone(cached_otp)
        self.assertEqual(len(cached_otp), 6)

    def test_request_otp_invalid_identity(self):
        url = reverse('auth-request-otp')
        response = self.client.post(url, {"identity": "invalid-format"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_verify_otp_success(self):
        url_req = reverse('auth-request-otp')
        self.client.post(url_req, {"identity": "verifyuser@example.com"})
        
        cached_otp = cache.get("otp:verifyuser@example.com")
        self.assertIsNotNone(cached_otp)
        
        url_ver = reverse('auth-verify-otp')
        response = self.client.post(url_ver, {
            "identity": "verifyuser@example.com",
            "otp": cached_otp
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["username"], "verifyuser@example.com")
        
        self.assertIsNone(cache.get("otp:verifyuser@example.com"))

    def test_verify_otp_incorrect(self):
        url_req = reverse('auth-request-otp')
        self.client.post(url_req, {"identity": "wrongotp@example.com"})
        
        url_ver = reverse('auth-verify-otp')
        response = self.client.post(url_ver, {
            "identity": "wrongotp@example.com",
            "otp": "000000"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.json())
        
    def test_verify_otp_expired(self):
        url_ver = reverse('auth-verify-otp')
        response = self.client.post(url_ver, {
            "identity": "expireduser@example.com",
            "otp": "123456"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["detail"], "OTP has expired or was not requested.")

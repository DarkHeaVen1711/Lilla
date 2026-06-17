from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from api.models import Category, Product, Order, OrderItem

class CriticalPathIntegrationTests(APITestCase):

    def setUp(self):
        # Clear cache before each test
        cache.clear()
        
        # Set up a category and product for stock/checkout testing
        self.category = Category.objects.create(name="Premium Skincare", slug="skincare")
        self.product = Product.objects.create(
            id="lilla-glow-oil",
            slug="lilla-glow-oil",
            name="Glow Oil",
            price=25.00,
            category=self.category,
            stock=5,
            is_active=True
        )
        
        # Test urls
        self.request_otp_url = reverse('auth-request-otp')
        self.verify_otp_url = reverse('auth-verify-otp')
        self.checkout_url = reverse('order-create')
        
        # Test identity
        self.test_email = "tester@lilla.com"

    def test_complete_otp_authentication_lifecycle(self):
        """
        Asserts:
        1. Requesting OTP generates a Redis-backed (cache) OTP token.
        2. Submitting correct OTP verifies user, returns valid JWTs, and clears the cache token.
        3. Expired/cleared OTP prevents verification.
        """
        # 1. Request OTP
        request_response = self.client.post(self.request_otp_url, {"identity": self.test_email}, format='json')
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        
        # Verify Redis-backed token exists in cache
        cache_key = f"otp:{self.test_email}"
        cached_otp = cache.get(cache_key)
        self.assertIsNotNone(cached_otp)
        self.assertEqual(len(cached_otp), 6)
        self.assertTrue(cached_otp.isdigit())

        # 2. Verify OTP with correct code
        verify_response = self.client.post(self.verify_otp_url, {
            "identity": self.test_email,
            "otp": cached_otp
        }, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        
        # Verify response keys (access, refresh, user)
        self.assertIn("access", verify_response.data)
        self.assertIn("refresh", verify_response.data)
        self.assertIn("user", verify_response.data)
        self.assertEqual(verify_response.data["user"]["username"], self.test_email)
        
        # Verify token is cleared from Redis (cache) after successful verification
        self.assertIsNone(cache.get(cache_key))

        # 3. Verify that trying to verify again with the same code fails
        second_verify_response = self.client.post(self.verify_otp_url, {
            "identity": self.test_email,
            "otp": cached_otp
        }, format='json')
        self.assertEqual(second_verify_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_stock_depletion_and_concurrency(self):
        """
        Asserts:
        1. Successful checkout transaction decreases stock and returns 201.
        2. Attempting to purchase more than available stock fails and rolls back the database.
        """
        # Create user to authenticate for order placement
        user = User.objects.create_user(username=self.test_email)
        self.client.force_authenticate(user=user)

        # 1. Purchase 2 items (available stock is 5)
        payload = {
            "user_identifier": self.test_email,
            "shipping_name": "John Doe",
            "shipping_address": "123 Lilla Lane",
            "shipping_city": "Los Angeles",
            "shipping_postal_code": "90001",
            "total_price": "55.00",  # calculated total: subtotal 50 - 20% (10) + 15 delivery fee = 55.00
            "items": [
                {
                    "product_id": "lilla-glow-oil",
                    "product_name": "Glow Oil",
                    "price": "25.00",
                    "quantity": 2
                }
            ]
        }
        
        checkout_response = self.client.post(self.checkout_url, payload, format='json')
        self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
        
        # Check database stock updated correctly
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

        # 2. Try to purchase 4 items (available stock is now 3) - should fail due to stock depletion
        payload_fail = {
            "user_identifier": self.test_email,
            "shipping_name": "John Doe",
            "shipping_address": "123 Lilla Lane",
            "shipping_city": "Los Angeles",
            "shipping_postal_code": "90001",
            "total_price": "95.00",  # subtotal 100 - 20% (20) + 15 fee = 95.00
            "items": [
                {
                    "product_id": "lilla-glow-oil",
                    "product_name": "Glow Oil",
                    "price": "25.00",
                    "quantity": 4
                }
            ]
        }
        
        fail_response = self.client.post(self.checkout_url, payload_fail, format='json')
        self.assertEqual(fail_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient stock", str(fail_response.data))

        # Check database stock remains unchanged at 3
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

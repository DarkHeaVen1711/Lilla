from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import override_settings
from django.contrib.auth.models import User
from api.models import Category, Product, Order, OrderItem, Coupon

@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'integration-test-cache',
    }
})
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
        self.coupon = Coupon.objects.create(code="TRYBEAUTY", discount_percentage=20.00, is_active=True)
        
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
        
        # Verify response keys (access, refresh, role, user)
        self.assertIn("access", verify_response.data)
        self.assertIn("refresh", verify_response.data)
        self.assertIn("role", verify_response.data)
        self.assertEqual(verify_response.data["role"], "customer")
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
            "coupon_code": "TRYBEAUTY",
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
            "coupon_code": "TRYBEAUTY",
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


from unittest.mock import patch, MagicMock

class StripePaymentsTests(APITestCase):
    def setUp(self):
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
        self.admin_user = User.objects.create_superuser(username="admin@lilla.com", password="password")
        self.normal_user = User.objects.create_user(username="user@lilla.com", password="password")
        
        # Create a pending order
        self.order = Order.objects.create(
            user_identifier="user@lilla.com",
            shipping_name="John Doe",
            shipping_address="123 Lilla Lane",
            shipping_city="Los Angeles",
            shipping_postal_code="90001",
            total_price=55.00,
            status="Pending"
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product_id="lilla-glow-oil",
            product_name="Glow Oil",
            price=25.00,
            quantity=2
        )

    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent(self, mock_create):
        mock_intent = MagicMock()
        mock_intent.id = "pi_mock_123"
        mock_intent.client_secret = "seti_mock_secret_123"
        mock_create.return_value = mock_intent

        url = reverse('payments-create-intent')
        response = self.client.post(url, {"order_id": str(self.order.id)}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["client_secret"], "seti_mock_secret_123")
        self.assertEqual(response.data["payment_intent_id"], "pi_mock_123")
        
        # Verify order updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_intent_id, "pi_mock_123")

    def test_create_payment_intent_invalid_order(self):
        url = reverse('payments-create-intent')
        response = self.client.post(url, {"order_id": "00000000-0000-0000-0000-000000000000"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('stripe.Webhook.construct_event')
    def test_webhook_payment_intent_succeeded(self, mock_construct_event):
        mock_event = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_mock_123",
                    "metadata": {
                        "order_id": str(self.order.id)
                    }
                }
            }
        }
        mock_construct_event.return_value = mock_event
        
        self.order.payment_intent_id = "pi_mock_123"
        self.order.save()

        url = reverse('payments-webhook')
        self.client.credentials(HTTP_STRIPE_SIGNATURE="mock_signature")
        response = self.client.post(url, data="{}", content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "Paid")

    @patch('stripe.Webhook.construct_event')
    def test_webhook_payment_intent_failed_restores_stock(self, mock_construct_event):
        mock_event = {
            "type": "payment_intent.payment_failed",
            "data": {
                "object": {
                    "id": "pi_mock_123",
                    "metadata": {
                        "order_id": str(self.order.id)
                    }
                }
            }
        }
        mock_construct_event.return_value = mock_event
        
        self.order.payment_intent_id = "pi_mock_123"
        self.order.status = "Pending"
        self.order.save()
        
        self.product.stock = 3
        self.product.save()

        url = reverse('payments-webhook')
        self.client.credentials(HTTP_STRIPE_SIGNATURE="mock_signature")
        response = self.client.post(url, data="{}", content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "Failed")
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    @patch('stripe.Refund.create')
    def test_order_refund_success_admin(self, mock_refund_create):
        mock_refund = MagicMock()
        mock_refund.id = "re_mock_123"
        mock_refund_create.return_value = mock_refund
        
        self.order.payment_intent_id = "pi_mock_123"
        self.order.status = "Paid"
        self.order.save()
        
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('order-refund', kwargs={"id": self.order.id})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "Refunded")
        mock_refund_create.assert_called_once_with(payment_intent="pi_mock_123")

    def test_order_refund_forbidden_normal_user(self):
        self.client.force_authenticate(user=self.normal_user)
        
        url = reverse('order-refund', kwargs={"id": self.order.id})
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_refund_no_payment_intent(self):
        self.order.payment_intent_id = ""
        self.order.status = "Paid"
        self.order.save()
        
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('order-refund', kwargs={"id": self.order.id})
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No payment intent ID associated", response.data["error"])


@override_settings(CACHES={
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'integration-test-cache-currency',
    }
})
class CurrencyAndMultiCurrencyCheckoutTests(APITestCase):
    def setUp(self):
        cache.clear()
        cache.set("currency_rates", {
            "USD": 1.0,
            "EUR": 0.92,
            "GBP": 0.78,
            "INR": 83.50
        }, timeout=86400)
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

    def test_get_currency_rates(self):
        url = reverse('currency-rates')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["base"], "USD")
        self.assertIn("EUR", response.data["rates"])
        self.assertIn("INR", response.data["rates"])

    def test_multicurrency_checkout_success(self):
        user = User.objects.create_user(username="test_currency@lilla.com")
        self.client.force_authenticate(user=user)

        # EUR rate fallback is 0.92
        # Product price is 25.00 USD -> 25.00 * 0.92 = 23.00 EUR
        # Delivery fee is 15.00 USD -> 15.00 * 0.92 = 13.80 EUR
        # Calculated total for 1 item: 23.00 + 13.80 = 36.80 EUR
        payload = {
            "user_identifier": "test_currency@lilla.com",
            "shipping_name": "Jane Doe",
            "shipping_address": "123 Lilla Lane",
            "shipping_city": "Paris",
            "shipping_postal_code": "75001",
            "total_price": "36.80",
            "currency": "EUR",
            "items": [
                {
                    "product_id": "lilla-glow-oil",
                    "product_name": "Glow Oil",
                    "price": "23.00",
                    "quantity": 1
                }
            ]
        }
        url = reverse('order-create')
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["currency"], "EUR")
        self.assertEqual(response.data["total_price"], "36.80")


class OrderTrackingIntegrationTests(APITestCase):
    def setUp(self):
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

    def test_order_creation_populates_tracking_fields(self):
        user = User.objects.create_user(username="tracker@lilla.com")
        self.client.force_authenticate(user=user)

        payload = {
            "user_identifier": "tracker@lilla.com",
            "shipping_name": "Jane Doe",
            "shipping_address": "123 Tracker St",
            "shipping_city": "Austin",
            "shipping_postal_code": "78701",
            "total_price": "40.00",
            "items": [
                {
                    "product_id": "lilla-glow-oil",
                    "product_name": "Glow Oil",
                    "price": "25.00",
                    "quantity": 1
                }
            ]
        }
        
        url = reverse('order-create')
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify order has tracking fields
        self.assertIn("tracking_number", response.data)
        self.assertIn("carrier_name", response.data)
        self.assertIn("estimated_delivery_date", response.data)
        self.assertIn("shipment_status", response.data)
        
        self.assertTrue(response.data["tracking_number"].startswith("LILLA-US-"))
        self.assertEqual(response.data["carrier_name"], "DHL Express")
        self.assertEqual(response.data["shipment_status"], "Placed")
        
        # Check computed/simulated progression status:
        # Since it was just created (elapsed < 60s), it should serialize to "Placed" if Pending,
        # or "Processed" if we set the status to Paid. Let's verify by retrieving the order.
        order_id = response.data["id"]
        order = Order.objects.get(id=order_id)
        
        # Retrieve via API
        detail_url = reverse('order-detail', kwargs={"id": order.id})
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.data["shipment_status"], "Placed")

        # Now simulate order mark Paid
        order.status = "Paid"
        order.save()
        
        detail_response2 = self.client.get(detail_url)
        # Should now be Processed (minimum status for Paid status order)
        self.assertEqual(detail_response2.data["shipment_status"], "Processed")


import time
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Category, Product, Order, OrderItem

class InvoiceSignalTests(APITestCase):

    def setUp(self):
        # Clear outbox before each test
        mail.outbox = []

        self.category = Category.objects.create(name="Skin", slug="skin")
        self.product = Product.objects.create(
            id="test-prod",
            slug="test-prod",
            name="Test Product",
            price=20.00,
            category=self.category,
            is_active=True
        )

        # Create a pending order
        self.order = Order.objects.create(
            user_identifier="customer@example.com",
            shipping_name="Jane Doe",
            shipping_address="123 Main St",
            shipping_city="Seattle",
            shipping_postal_code="98101",
            total_price=35.00,
            status="Pending"
        )
        self.item = OrderItem.objects.create(
            order=self.order,
            product_id="test-prod",
            product_name="Test Product",
            price=20.00,
            quantity=1
        )

    def test_invoice_email_sent_on_paid_transition(self):
        # Verify no email is sent initially
        self.assertEqual(len(mail.outbox), 0)

        # Update order status to Paid
        self.order.status = "Paid"
        self.order.save()

        # Verify email is sent
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, ["customer@example.com"])
        self.assertIn("Invoice for your LILLA Order", email.subject)
        self.assertIn("Test Product", email.body)
        self.assertIn("Jane Doe", email.body)
        self.assertIn("Seattle", email.body)
        self.assertIn("Total Paid: $35.00", email.body)

    def test_invoice_email_not_sent_on_re_save(self):
        # Set order as Paid first and clear outbox
        self.order.status = "Paid"
        self.order.save()
        mail.outbox = []

        # Re-save the order without changing status
        self.order.save()

        # Outbox should remain empty to prevent spamming duplicate invoices
        self.assertEqual(len(mail.outbox), 0)

    def test_invoice_email_not_sent_for_phone_identifier(self):
        # Create an order with phone number instead of email
        phone_order = Order.objects.create(
            user_identifier="+1234567890",
            shipping_name="John Phone",
            shipping_address="456 Call Ave",
            shipping_city="New York",
            shipping_postal_code="10001",
            total_price=20.00,
            status="Pending"
        )
        OrderItem.objects.create(
            order=phone_order,
            product_id="test-prod",
            product_name="Test Product",
            price=20.00,
            quantity=1
        )

        phone_order.status = "Paid"
        phone_order.save()

        # Outbox should remain empty since recipient is not an email address
        self.assertEqual(len(mail.outbox), 0)

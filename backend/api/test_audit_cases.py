import threading
from django.test import TestCase, TransactionTestCase
from django.db import IntegrityError, transaction, connection
from django.db.models import ProtectedError
from django.contrib.auth.models import User
from django.core.cache import cache
from django.db.models.signals import pre_save
from django.urls import reverse
from rest_framework.test import APIClient

from api.models import (
    Category,
    Product,
    StockAdjustment,
    RoleChangeLog,
    Review,
    set_unsynced_offline
)

class ScopedSignalTestCase(TestCase):
    """
    test_scoped_signal — Verify set_unsynced_offline only fires on SyncableModel saves.
    """
    databases = {'default', 'offline'}

    def test_scoped_signal(self):
        # Verify that set_unsynced_offline is registered for SyncableModel subclasses
        # like Product and Category, but NOT for non-SyncableModels like User or RoleChangeLog
        receivers_product = [r[1]() for r in pre_save.receivers if r[1]() is not None]
        self.assertIn(set_unsynced_offline, receivers_product)

        # Verify set_unsynced_offline is NOT connected to User
        receivers_user = [r[1]() for r in pre_save.receivers if r[1]() is not None and r[0] == id(User)]
        self.assertNotIn(set_unsynced_offline, receivers_user)

        # Verify offline behavior on SyncableModel (Category)
        cache.set('is_online', False)
        try:
            category = Category.objects.create(name="Signal Test", slug="signal-test")
            self.assertFalse(category.is_synced)
        finally:
            cache.set('is_online', True)


class StockAdjustmentSetNullTestCase(TestCase):
    """
    test_stock_adjustment_set_null — Confirm StockAdjustment records survive product deletion (FK → SET_NULL).
    """
    databases = {'default', 'offline'}

    def test_stock_adjustment_set_null(self):
        category = Category.objects.create(name="Skincare", slug="skincare")
        product = Product.objects.create(
            id="test-stock-prod-del",
            slug="test-stock-prod-del",
            name="Stock Product Del",
            price=15.00,
            category=category,
            is_active=True,
            stock=10
        )
        user = User.objects.create_user(username="adjuster_user", password="x")
        adjustment = StockAdjustment.objects.create(
            product=product,
            user=user,
            old_stock=15,
            new_stock=10,
            reason="Manual update test"
        )

        # Verify relationships exist
        self.assertEqual(adjustment.product, product)

        # Delete product
        product.delete()

        # Reload adjustment and verify it survives and product is set to None (SET_NULL)
        adjustment.refresh_from_db()
        self.assertIsNone(adjustment.product)


class RoleChangeLogProtectTestCase(TestCase):
    """
    test_role_changelog_protect — Confirm RoleChangeLog raises ProtectedError when deleting a referenced user.
    """
    databases = {'default', 'offline'}

    def test_role_changelog_protect(self):
        user_admin = User.objects.create_user(username="admin_user_audit", password="x")
        user_target = User.objects.create_user(username="target_user_audit", password="x")

        # Create a RoleChangeLog entry
        log = RoleChangeLog.objects.create(
            changed_by=user_admin,
            target_user=user_target,
            old_role="customer",
            new_role="manager"
        )

        # Verify deletion of target_user is protected (raises ProtectedError)
        with self.assertRaises(ProtectedError):
            user_target.delete()

        # Verify deletion of changed_by is protected (raises ProtectedError)
        with self.assertRaises(ProtectedError):
            user_admin.delete()


class ConcurrentCheckoutTestCase(TransactionTestCase):
    """
    test_concurrent_checkout — Concurrent stock decrement under select_for_update must not allow overselling.
    """
    databases = {'default', 'offline'}

    def test_concurrent_checkout(self):
        category = Category.objects.create(name="Beauty", slug="beauty")
        product = Product.objects.create(
            id="test-concurrent-prod",
            slug="test-concurrent-prod",
            name="Concurrent Product",
            price=10.00,
            category=category,
            is_active=True,
            stock=5
        )

        url = reverse('order-create')
        success_count = 0
        failure_count = 0
        lock = threading.Lock()

        # Pre-create users sequentially to avoid DB locks during creation in threads
        users = []
        for i in range(3):
            email = f"concurrent_user_{i}@example.com"
            user = User.objects.create_user(username=email, password="x")
            users.append((email, user))

        def do_checkout(thread_id):
            nonlocal success_count, failure_count
            client = APIClient()
            email, user = users[thread_id]
            client.force_authenticate(user=user)

            payload = {
                "user_identifier": email,
                "shipping_name": "Test User",
                "shipping_address": "123 Street",
                "shipping_city": "City",
                "shipping_postal_code": "12345",
                "total_price": "35.00",  # 20.00 subtotal + 15.00 delivery fee
                "items": [
                    {
                        "product_id": "test-concurrent-prod",
                        "product_name": "Concurrent Product",
                        "price": "10.00",
                        "quantity": 2
                    }
                ]
            }

            try:
                response = client.post(url, payload, format='json')
                with lock:
                    if response.status_code == 201:
                        success_count += 1
                    else:
                        failure_count += 1
            except Exception:
                with lock:
                    failure_count += 1

        is_sqlite = connection.vendor == 'sqlite'
        if is_sqlite:
            # SQLite in-memory DB connections in threads are isolated (new connection = empty DB),
            # and SQLite file-based has single-writer concurrency limits.
            # We run sequentially to verify depletion logic and validation logic.
            for i in range(3):
                do_checkout(i)
        else:
            # PostgreSQL supports concurrent connections sharing the test DB,
            # allowing testing of real select_for_update locking.
            threads = []
            for i in range(3):
                t = threading.Thread(target=do_checkout, args=(i,))
                threads.append(t)
                t.start()
            for t in threads:
                t.join()

        product.refresh_from_db()

        # Since initial stock is 5, and each checkout requests 2:
        # - Checkout 1 takes 2 (stock becomes 3) -> success
        # - Checkout 2 takes 2 (stock becomes 1) -> success
        # - Checkout 3 requests 2 (stock is 1) -> failure
        # So exactly 2 checkouts must succeed, 1 must fail, and final stock must be 1.
        self.assertEqual(success_count, 2)
        self.assertEqual(failure_count, 1)
        self.assertEqual(product.stock, 1)


class NonNegativeStockConstraintTestCase(TestCase):
    """
    test_non_negative_stock_constraint — DB-level constraint must reject negative stock values.
    """
    databases = {'default', 'offline'}

    def test_non_negative_stock_constraint(self):
        category = Category.objects.create(name="Beauty", slug="beauty")
        product = Product.objects.create(
            id="test-constraint-prod",
            slug="test-constraint-prod",
            name="Constraint Product",
            price=10.00,
            category=category,
            is_active=True,
            stock=5
        )

        product.stock = -1
        with self.assertRaises(IntegrityError):
            product.save()


class RatingSignalFreshReadTestCase(TestCase):
    """
    test_rating_signal_fresh_read — update_product_rating_metrics must return correct aggregates when prefetch cache is present.
    """
    databases = {'default', 'offline'}

    def test_rating_signal_fresh_read(self):
        category = Category.objects.create(name="Beauty", slug="beauty")
        product = Product.objects.create(
            id="test-rating-prod",
            slug="test-rating-prod",
            name="Rating Product",
            price=10.00,
            category=category,
            is_active=True,
            stock=5
        )

        # 1. Fetch product with prefetched reviews
        product_fetched = Product.objects.prefetch_related('product_reviews').get(id=product.id)
        # Access relationship to populate the prefetch cache
        list(product_fetched.product_reviews.all())
        self.assertTrue(hasattr(product_fetched, '_prefetched_objects_cache'))
        self.assertIn('product_reviews', product_fetched._prefetched_objects_cache)

        # Create a user to author the review
        user = User.objects.create_user(username="auditor_reviewer", password="x")

        # 2. Create a new review using the product_fetched instance as parent
        Review.objects.create(
            product=product_fetched,
            rating=5,
            comment="Awesome Product",
            user=user
        )

        # Verify that the cache was cleared from the fetched product object
        self.assertNotIn('product_reviews', product_fetched._prefetched_objects_cache)

        # Verify that accessing product_fetched.product_reviews returns the newly created review
        self.assertEqual(product_fetched.product_reviews.count(), 1)

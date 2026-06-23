from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Product, Category
from api.test_manager_products import make_user

class ManagerInsightsTest(APITestCase):
    def setUp(self):
        self.manager = make_user("mgr_ins", "manager")
        self.customer = make_user("cust_ins", "customer")
        self.url = reverse("manager-insights")

        # Setup categories
        self.skin_cat = Category.objects.create(name="Skin Care", slug="skin-care")
        self.makeup_cat = Category.objects.create(name="Makeup", slug="makeup")

        # Setup products
        Product.objects.create(
            id="prod-1", slug="prod-1", name="Serum A", price=29.99,
            stock=15, rating=4.5, category=self.skin_cat, deletion_status="active"
        )
        Product.objects.create(
            id="prod-2", slug="prod-2", name="Moisturizer B", price=19.99,
            stock=5, rating=4.0, category=self.skin_cat, deletion_status="active" # low stock
        )
        Product.objects.create(
            id="prod-3", slug="prod-3", name="Lipstick C", price=14.99,
            stock=0, rating=5.0, category=self.makeup_cat, deletion_status="active" # out of stock
        )
        Product.objects.create(
            id="prod-4", slug="prod-4", name="Archived D", price=9.99,
            stock=100, rating=3.5, category=self.makeup_cat, deletion_status="archived"
        )
        Product.objects.create(
            id="prod-5", slug="prod-5", name="Pending E", price=39.99,
            stock=2, rating=4.8, category=self.skin_cat, deletion_status="pending_deletion"
        )

    def test_customer_cannot_view_insights(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_view_insights(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_manager_can_view_insights(self):
        self.client.force_authenticate(user=self.manager)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["total_products"], 5)
        self.assertEqual(data["active_products"], 3)
        self.assertEqual(data["pending_deletion_products"], 1)
        self.assertEqual(data["archived_products"], 1)

        # Active product stock: 15 (prod-1) + 5 (prod-2) + 0 (prod-3) = 20
        self.assertEqual(data["total_stock"], 20)
        # Low stock (< 10): prod-2 (5) and prod-3 (0) -> 2 items
        self.assertEqual(data["low_stock_count"], 2)
        # Out of stock (0): prod-3 (0) -> 1 item
        self.assertEqual(data["out_of_stock_count"], 1)

        # Avg rating of active products: (4.5 + 4.0 + 5.0) / 3 = 4.5
        self.assertAlmostEqual(data["average_rating"], 4.5)

        # Category distribution of active products
        dist = data["category_distribution"]
        skin_dist = next(d for d in dist if d["category_name"] == "Skin Care")
        makeup_dist = next(d for d in dist if d["category_name"] == "Makeup")

        # Active products in Skin Care: prod-1 and prod-2 -> 2
        self.assertEqual(skin_dist["product_count"], 2)
        # Active products in Makeup: prod-3 -> 1
        self.assertEqual(makeup_dist["product_count"], 1)

    def test_financial_isolation(self):
        self.client.force_authenticate(user=self.manager)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Confirm absolutely no transactional or sales keywords leak in keys or values
        forbidden_keys = [
            "revenue", "sales", "orders", "transactions", "payment",
            "earnings", "checkout", "refund", "total_price", "sold"
        ]
        for key in res.data.keys():
            for f in forbidden_keys:
                self.assertNotIn(f, key.lower())

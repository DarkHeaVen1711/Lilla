"""
Phase 19 — Manager Product CRUD + Soft-Delete Approval Flow Tests.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

from api.models import Category, Product, UserProfile


def make_user(username, role="customer"):
    user = User.objects.create_user(username=username, password="test1234")
    profile = user.userprofile
    profile.role = role
    profile.save()
    if role in ("manager", "admin"):
        user.is_staff = True
        user.save()
    return user


def make_product(name="Test Product", slug="test-product", stock=10):
    cat = Category.objects.get_or_create(name="Skin", slug="skin")[0]
    return Product.objects.create(
        id=slug,
        slug=slug,
        name=name,
        price=29.99,
        category=cat,
        is_active=True,
        stock=stock,
    )


class ManagerProductCRUDTest(APITestCase):
    """Manager can create and update products; customer is blocked."""

    def setUp(self):
        self.manager = make_user("mgr_user", "manager")
        self.customer = make_user("cust_user", "customer")
        self.admin = make_user("adm_user", "admin")
        cat = Category.objects.get_or_create(name="Skin", slug="skin")[0]
        self.cat_id = cat.id
        self.product = make_product()

    def test_manager_can_create_product(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "id": "new-product-mgr",
            "slug": "new-product-mgr",
            "name": "Manager Product",
            "price": "19.99",
            "category": self.cat_id,
            "stock": 50,
            "image": "https://example.com/img.jpg",
        }
        url = reverse("product-list")
        res = self.client.post(url, payload, format="json")
        self.assertIn(res.status_code, [201, 200])

    def test_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse("product-list")
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_update_product(self):
        self.client.force_authenticate(user=self.manager)
        url = reverse("product-detail", kwargs={"slug": self.product.slug})
        res = self.client.patch(url, {"name": "Updated Name"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_can_list_products(self):
        url = reverse("product-list")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class SoftDeleteWorkflowTest(APITestCase):
    """Manager DELETE → pending_deletion (202). Admin approve/reject cycle."""

    def setUp(self):
        self.manager = make_user("mgr_del", "manager")
        self.admin = make_user("adm_del", "admin")
        self.customer = make_user("cust_del", "customer")
        self.product = make_product("Deletable Product", "deletable-product")

    def _delete_url(self):
        return reverse("product-detail", kwargs={"slug": self.product.slug})

    def _approve_url(self):
        return reverse("admin-product-approve-deletion", kwargs={"pk": self.product.pk})

    def _reject_url(self):
        return reverse("admin-product-reject-deletion", kwargs={"pk": self.product.pk})

    def test_manager_delete_sets_pending_deletion(self):
        self.client.force_authenticate(user=self.manager)
        res = self.client.delete(self._delete_url())
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.deletion_status, "pending_deletion")
        # Product is still in DB — not hard-deleted
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())

    def test_admin_delete_archives_product(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(self._delete_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.deletion_status, "archived")
        self.assertFalse(self.product.is_active)

    def test_admin_can_approve_pending_deletion(self):
        self.product.deletion_status = "pending_deletion"
        self.product.save()
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(self._approve_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.deletion_status, "archived")

    def test_admin_can_reject_pending_deletion(self):
        self.product.deletion_status = "pending_deletion"
        self.product.save()
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(self._reject_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.deletion_status, "active")

    def test_archived_product_excluded_from_public_list(self):
        self.product.deletion_status = "archived"
        self.product.is_active = False
        self.product.save()
        url = reverse("product-list")
        res = self.client.get(url)
        ids = [p["id"] for p in res.data]
        self.assertNotIn(self.product.pk, ids)

    def test_customer_cannot_delete_product(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.delete(self._delete_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_requires_admin(self):
        self.product.deletion_status = "pending_deletion"
        self.product.save()
        self.client.force_authenticate(user=self.manager)
        res = self.client.post(self._approve_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

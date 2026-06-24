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

    def test_manager_can_create_product_with_image_file(self):
        self.client.force_authenticate(user=self.manager)
        from django.core.files.uploadedfile import SimpleUploadedFile
        # 1x1 pixel GIF
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9'
            b'\x04\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00'
            b'\x00\x02\x02\x4c\x01\x00\x3b'
        )
        img_file = SimpleUploadedFile("test_product.gif", small_gif, content_type="image/gif")
        payload = {
            "id": "new-product-file-mgr",
            "slug": "new-product-file-mgr",
            "name": "Manager Image Product",
            "price": "19.99",
            "category": self.cat_id,
            "stock": 50,
            "image_file": img_file,
        }
        url = reverse("product-list")
        res = self.client.post(url, payload, format="multipart")
        self.assertIn(res.status_code, [201, 200])
        product = Product.objects.get(id="new-product-file-mgr")
        self.assertTrue(product.image_file.name.endswith(".gif"))
        self.assertTrue(product.image.endswith(product.image_file.url))

    def test_manager_can_update_product_image_file(self):
        self.client.force_authenticate(user=self.manager)
        from django.core.files.uploadedfile import SimpleUploadedFile
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9'
            b'\x04\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00'
            b'\x00\x02\x02\x4c\x01\x00\x3b'
        )
        img_file = SimpleUploadedFile("updated_product.gif", small_gif, content_type="image/gif")
        url = reverse("product-detail", kwargs={"slug": self.product.slug})
        res = self.client.patch(url, {"image_file": img_file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertTrue(self.product.image_file.name.endswith(".gif"))
        self.assertTrue(self.product.image.endswith(self.product.image_file.url))



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


class CategoriesEndpointTest(APITestCase):
    """Categories endpoint optionally returns cosmetic concerns."""

    def test_categories_normal_returns_list(self):
        res = self.client.get(reverse("category-list"))
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.data, list)

    def test_categories_with_concerns_returns_dict(self):
        url = reverse("category-list") + "?include_concerns=true"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.data, dict)
        self.assertIn("categories", res.data)
        self.assertIn("concerns", res.data)
        self.assertIsInstance(res.data["categories"], list)
        self.assertIsInstance(res.data["concerns"], list)
        self.assertEqual(len(res.data["concerns"]), 8)


from unittest.mock import patch, MagicMock

class DescriptionGenerationTest(APITestCase):
    """Test AI-assisted description generation endpoint."""

    def setUp(self):
        self.manager = make_user("mgr_ai", "manager")
        self.customer = make_user("cust_ai", "customer")
        self.url = reverse("manager-products-generate-description")
        from django.core.cache import cache
        cache.clear()

    def test_customer_cannot_generate_description(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(self.url, {"name": "Glow Cream"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_generate_description_missing_name(self):
        self.client.force_authenticate(user=self.manager)
        res = self.client.post(self.url, {"type": "Serum"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)

    @patch('os.getenv')
    def test_manager_generate_description_fallback_mock(self, mock_getenv):
        # Force ANTHROPIC_API_KEY to be empty/unset
        mock_getenv.side_effect = lambda key, default=None: "" if key == 'ANTHROPIC_API_KEY' else default
        
        self.client.force_authenticate(user=self.manager)
        payload = {"name": "Hydration Boost", "type": "Moisturizer", "concern": "Dry Skin"}
        res = self.client.post(self.url, payload, format="json")
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("description", res.data)
        self.assertIn("Hydration Boost", res.data["description"])
        self.assertIn("Moisturizer", res.data["description"])
        self.assertIn("Dry Skin", res.data["description"])

    @patch('os.getenv')
    @patch('anthropic.Anthropic')
    def test_manager_generate_description_with_api_key(self, mock_anthropic_class, mock_getenv):
        # Mock API Key and Model env vars
        mock_getenv.side_effect = lambda key, default=None: "mock-key" if key == 'ANTHROPIC_API_KEY' else default

        # Mock the Anthropic client instance and return values
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client
        
        mock_message = MagicMock()
        mock_text_block = MagicMock()
        mock_text_block.type = "text"
        mock_text_block.text = "This is a premium, high-quality description generated by AI."
        mock_message.content = [mock_text_block]
        mock_client.messages.create.return_value = mock_message

        self.client.force_authenticate(user=self.manager)
        payload = {"name": "Rose Serum", "type": "Serum", "concern": "Anti-Aging"}
        res = self.client.post(self.url, payload, format="json")
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["description"], "This is a premium, high-quality description generated by AI.")
        mock_client.messages.create.assert_called_once()

    def test_generate_description_throttling(self):
        from django.core.cache import cache
        cache.clear()
        self.client.force_authenticate(user=self.manager)
        # Call 10 times successfully
        for _ in range(10):
            res = self.client.post(self.url, {"name": "Test Serum"}, format="json")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            
        # 11th call should trigger rate limiting (429)
        res = self.client.post(self.url, {"name": "Test Serum"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class AutoSlugAndDefaultIDTest(APITestCase):
    def setUp(self):
        self.manager = make_user("mgr_slug_test", "manager")
        self.cat = Category.objects.get_or_create(name="Skin", slug="skin")[0]

    def test_auto_generate_slug_and_id(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "Super Hydra Serum",
            "price": "25.00",
            "category": self.cat.id,
            "stock": 30,
        }
        res = self.client.post(reverse("product-list"), payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["slug"], "super-hydra-serum")
        self.assertEqual(res.data["id"], "super-hydra-serum")

    def test_auto_generate_slug_uniqueness_counter(self):
        self.client.force_authenticate(user=self.manager)
        # Create first product
        payload1 = {
            "name": "Super Hydra Serum",
            "price": "25.00",
            "category": self.cat.id,
            "stock": 30,
        }
        res1 = self.client.post(reverse("product-list"), payload1, format="json")
        self.assertEqual(res1.status_code, 201)
        self.assertEqual(res1.data["slug"], "super-hydra-serum")

        # Create second product with the same name
        payload2 = {
            "name": "Super Hydra Serum",
            "price": "28.00",
            "category": self.cat.id,
            "stock": 20,
        }
        res2 = self.client.post(reverse("product-list"), payload2, format="json")
        self.assertEqual(res2.status_code, 201)
        self.assertEqual(res2.data["slug"], "super-hydra-serum-1")
        self.assertEqual(res2.data["id"], "super-hydra-serum-1")


class ManagerProductFormMetadataViewTest(APITestCase):
    def setUp(self):
        self.manager = make_user("mgr_meta_test", "manager")
        self.customer = make_user("cust_meta_test", "customer")
        self.cat1 = Category.objects.get_or_create(name="Cleanser", slug="cleanser")[0]
        self.cat2 = Category.objects.get_or_create(name="Toner", slug="toner")[0]
        
        # Create a product with some concerns and ingredients to test dynamic collection
        Product.objects.create(
            id="dummy-prod-1",
            slug="dummy-prod-1",
            name="Dummy Prod 1",
            price="10.00",
            category=self.cat1,
            skin_concerns=["Dryness", "Redness"],
            key_ingredients=["Ceramides", "Centella Asiatica"],
            stock=10,
        )

    def test_anonymous_cannot_access_metadata(self):
        res = self.client.get(reverse("manager-products-form-metadata"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_cannot_access_metadata(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get(reverse("manager-products-form-metadata"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_access_metadata_and_returns_correct_data(self):
        self.client.force_authenticate(user=self.manager)
        res = self.client.get(reverse("manager-products-form-metadata"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("categories", res.data)
        self.assertIn("skin_concerns", res.data)
        self.assertIn("key_ingredients", res.data)
        
        # Verify categories are serialized properly
        categories_slugs = [c["slug"] for c in res.data["categories"]]
        self.assertIn("cleanser", categories_slugs)
        self.assertIn("toner", categories_slugs)

        # Verify skin concerns and key ingredients are aggregated correctly
        self.assertIn("Dryness", res.data["skin_concerns"])
        self.assertIn("Redness", res.data["skin_concerns"])
        self.assertIn("Ceramides", res.data["key_ingredients"])
        self.assertIn("Centella Asiatica", res.data["key_ingredients"])




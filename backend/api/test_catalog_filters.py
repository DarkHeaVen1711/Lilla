from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Category, Product

class CatalogFilterTests(APITestCase):

    def setUp(self):
        # Create categories
        self.cat_skin = Category.objects.create(name="Skin Care", slug="skin")
        self.cat_makeup = Category.objects.create(name="Makeup", slug="makeup")
        self.cat_hair = Category.objects.create(name="Hair Care", slug="hair")

        # Create products with varying prices, ratings, and concerns
        self.p1 = Product.objects.create(
            id="p1",
            slug="p1-slug",
            name="Alpha Product",
            price=15.00,
            category=self.cat_skin,
            rating=4.50,
            skin_concerns=["Dryness", "Redness"],
            key_ingredients=["Vitamin C"],
            is_active=True
        )
        # Manually alter created_at to test newest sorting
        self.p1.created_at = timezone.now() - timedelta(days=5)
        self.p1.save()

        self.p2 = Product.objects.create(
            id="p2",
            slug="p2-slug",
            name="Beta Product",
            price=25.00,
            category=self.cat_makeup,
            rating=4.90,
            skin_concerns=["Pores"],
            key_ingredients=["Niacinamide"],
            is_active=True
        )
        self.p2.created_at = timezone.now() - timedelta(days=2)
        self.p2.save()

        self.p3 = Product.objects.create(
            id="p3",
            slug="p3-slug",
            name="Gamma Product",
            price=5.00,
            category=self.cat_hair,
            rating=4.80,
            skin_concerns=["Dryness"],
            key_ingredients=["Rosewater"],
            is_active=True
        )
        self.p3.created_at = timezone.now()
        self.p3.save()

        self.url = reverse('product-list')

    def test_filter_multiple_categories(self):
        # Test comma-separated category slugs
        response = self.client.get(self.url, {'category': 'skin,makeup'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        slugs = [p['slug'] for p in data]
        self.assertIn('p1-slug', slugs)
        self.assertIn('p2-slug', slugs)
        self.assertNotIn('p3-slug', slugs)

        # Test multiple category query params
        response = self.client.get(self.url + '?category=skin&category=hair')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        slugs = [p['slug'] for p in data]
        self.assertIn('p1-slug', slugs)
        self.assertIn('p3-slug', slugs)
        self.assertNotIn('p2-slug', slugs)

    def test_filter_multiple_concerns(self):
        # Test matching either concern
        response = self.client.get(self.url, {'concern': 'Redness,Pores'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        slugs = [p['slug'] for p in data]
        self.assertIn('p1-slug', slugs) # Has redness
        self.assertIn('p2-slug', slugs) # Has pores
        self.assertNotIn('p3-slug', slugs) # Only dryness

    def test_filter_multiple_ingredients(self):
        response = self.client.get(self.url, {'ingredient': 'Vitamin C,Rosewater'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        slugs = [p['slug'] for p in data]
        self.assertIn('p1-slug', slugs)
        self.assertIn('p3-slug', slugs)
        self.assertNotIn('p2-slug', slugs)

    def test_sorting_price_asc(self):
        response = self.client.get(self.url, {'sort': 'price_asc'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        prices = [float(p['price']) for p in data]
        self.assertEqual(prices, [5.00, 15.00, 25.00]) # p3, p1, p2

    def test_sorting_price_desc(self):
        response = self.client.get(self.url, {'sort': 'price_desc'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        prices = [float(p['price']) for p in data]
        self.assertEqual(prices, [25.00, 15.00, 5.00]) # p2, p1, p3

    def test_sorting_rating(self):
        response = self.client.get(self.url, {'sort': 'rating'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        ratings = [float(p['rating']) for p in data]
        self.assertEqual(ratings, [4.90, 4.80, 4.50]) # p2, p3, p1

    def test_sorting_newest(self):
        response = self.client.get(self.url, {'sort': 'newest'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        slugs = [p['slug'] for p in data]
        self.assertEqual(slugs, ['p3-slug', 'p2-slug', 'p1-slug']) # p3 (newest), p2, p1

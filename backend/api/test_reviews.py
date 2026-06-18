from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Category, Product, Review

class ReviewAPITests(APITestCase):

    def setUp(self):
        self.category = Category.objects.create(name="Skin", slug="skin")
        self.product = Product.objects.create(
            id="prod-1",
            slug="product-one",
            name="Product One",
            price=10.00,
            category=self.category,
            is_active=True,
            rating=4.80,
            reviews=0
        )
        self.user1 = User.objects.create_user(username="user1", password="testpassword123")
        self.user2 = User.objects.create_user(username="user2", password="testpassword123")

    def test_get_reviews_anonymous(self):
        url = reverse('product-reviews', kwargs={'slug': self.product.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_post_review_anonymous(self):
        url = reverse('product-reviews', kwargs={'slug': self.product.slug})
        payload = {"rating": 5, "comment": "Great product!"}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_review_authenticated_success(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('product-reviews', kwargs={'slug': self.product.slug})
        payload = {"rating": 5, "comment": "Excellent!"}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify database
        self.assertEqual(Review.objects.count(), 1)
        review = Review.objects.first()
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, "Excellent!")
        
        # Verify signal updated product metrics
        self.product.refresh_from_db()
        self.assertEqual(self.product.reviews, 1)
        self.assertEqual(float(self.product.rating), 5.00)

    def test_rating_boundary_validation(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('product-reviews', kwargs={'slug': self.product.slug})
        
        # Rating 0 (too low)
        payload = {"rating": 0, "comment": "Too low"}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Rating 6 (too high)
        payload = {"rating": 6, "comment": "Too high"}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_review_prevention(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('product-reviews', kwargs={'slug': self.product.slug})
        
        # First review
        response1 = self.client.post(url, {"rating": 5, "comment": "First"}, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second review
        response2 = self.client.post(url, {"rating": 4, "comment": "Second"}, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_multiple_users_aggregate_calculation(self):
        # User 1 posts 5-star review
        self.client.force_authenticate(user=self.user1)
        url = reverse('product-reviews', kwargs={'slug': self.product.slug})
        self.client.post(url, {"rating": 5, "comment": "Nice"}, format='json')

        # User 2 posts 3-star review
        self.client.force_authenticate(user=self.user2)
        self.client.post(url, {"rating": 3, "comment": "Okay"}, format='json')

        self.product.refresh_from_db()
        self.assertEqual(self.product.reviews, 2)
        # (5 + 3) / 2 = 4.0
        self.assertEqual(float(self.product.rating), 4.00)

        # Delete User 1 review
        Review.objects.filter(user=self.user1, product=self.product).delete()
        self.product.refresh_from_db()
        self.assertEqual(self.product.reviews, 1)
        self.assertEqual(float(self.product.rating), 3.00)

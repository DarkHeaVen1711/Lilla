from django.urls import reverse
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Product, Category, Favorite, Address

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class AccountPersistenceTests(APITestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Beauty", slug="beauty")
        self.prod1 = Product.objects.create(id="p1", slug="p1", name="P1", price=10.0, category=self.cat, stock=10)
        self.prod2 = Product.objects.create(id="p2", slug="p2", name="P2", price=20.0, category=self.cat, stock=10)
        self.u1 = User.objects.create_user(username="u1", password="pw")
        self.u2 = User.objects.create_user(username="u2", password="pw")

    def test_permissions(self):
        for path in ['favorite-list', 'address-list']:
            res = self.client.get(reverse(path))
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_favorites_crud_and_clear(self):
        self.client.force_authenticate(user=self.u1)
        res = self.client.post(reverse('favorite-list'), {'product_id': self.prod1.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        res = self.client.post(reverse('favorite-list'), {'product_id': self.prod1.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.get(reverse('favorite-list'))
        self.assertEqual(len(res.json()), 1)
        res = self.client.delete(reverse('favorite-detail', kwargs={'product_id': self.prod1.id}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.client.post(reverse('favorite-list'), {'product_id': self.prod2.id})
        res = self.client.delete(reverse('favorite-clear'))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Favorite.objects.filter(user=self.u1).count(), 0)

    def test_address_defaults_toggle(self):
        self.client.force_authenticate(user=self.u1)
        addr1_data = {
            'first_name': 'A', 'last_name': 'B', 'email': 'a@b.com', 'country': 'US',
            'address': '1 Main St', 'state': 'NY', 'city': 'NYC', 'zip': '10001', 'phone': '123', 'is_default': True
        }
        res = self.client.post(reverse('address-list'), addr1_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        a1_id = res.json()['id']
        addr2_data = addr1_data.copy()
        addr2_data['address'] = '2 Main St'
        res = self.client.post(reverse('address-list'), addr2_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Address.objects.get(id=res.json()['id']).is_default)
        self.assertFalse(Address.objects.get(id=a1_id).is_default)

    def test_token_refresh(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.u1)
        res = self.client.post(reverse('auth-token-refresh'), {'refresh': str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.json())

    def test_profile_unauthorized(self):
        res = self.client.get(reverse('auth-profile'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_crud(self):
        self.client.force_authenticate(user=self.u1)
        res = self.client.get(reverse('auth-profile'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['email'], self.u1.email)

        # Update profile
        update_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@example.com'
        }
        res = self.client.patch(reverse('auth-profile'), update_data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['first_name'], 'John')
        self.assertEqual(res.json()['last_name'], 'Doe')
        self.assertEqual(res.json()['email'], 'john.doe@example.com')

        # Check in DB
        self.u1.refresh_from_db()
        self.assertEqual(self.u1.first_name, 'John')
        self.assertEqual(self.u1.last_name, 'Doe')
        self.assertEqual(self.u1.email, 'john.doe@example.com')

    def test_profile_username_sync(self):
        # Create user where username is an email address
        email_user = User.objects.create_user(username="test@lilla.com", password="pw", email="test@lilla.com")
        self.client.force_authenticate(user=email_user)
        
        res = self.client.patch(reverse('auth-profile'), {'email': 'new@lilla.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        email_user.refresh_from_db()
        self.assertEqual(email_user.email, 'new@lilla.com')
        self.assertEqual(email_user.username, 'new@lilla.com')

    def test_profile_email_conflict(self):
        self.client.force_authenticate(user=self.u1)
        # u2's username is 'u2'. Let's give u2 an email
        self.u2.email = 'taken@lilla.com'
        self.u2.save()

        res = self.client.patch(reverse('auth-profile'), {'email': 'taken@lilla.com'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.json())



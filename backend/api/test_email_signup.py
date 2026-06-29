from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from django.core.cache import cache

class EmailSignupTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

    def _payload(self, **overrides):
        base = {
            "name": "Asha Patel",
            "email": "asha@example.com",
            "gender": "female",
            "password": "SecurePass123",
            "confirm_password": "SecurePass123",
        }
        base.update(overrides)
        return base

    @patch("api.views.send_otp_for_user")
    def test_signup_creates_user_with_correct_fields(self, mock_send_otp):
        mock_send_otp.return_value = "123456"
        response = self.client.post("/api/auth/signup/", self._payload())
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="asha@example.com")
        self.assertEqual(user.first_name, "Asha Patel")
        self.assertEqual(user.userprofile.gender, "female")
        self.assertEqual(user.userprofile.signup_method, "email")
        self.assertTrue(user.check_password("SecurePass123"))
        mock_send_otp.assert_called_once()

    @patch("api.views.send_otp_for_user")
    def test_duplicate_email_rejected(self, mock_send_otp):
        mock_send_otp.return_value = "123456"
        User.objects.create_user(username="existing", email="asha@example.com", password="x")
        response = self.client.post("/api/auth/signup/", self._payload())
        self.assertEqual(response.status_code, 400)

    @patch("api.views.send_otp_for_user")
    def test_password_mismatch_rejected(self, mock_send_otp):
        mock_send_otp.return_value = "123456"
        response = self.client.post(
            "/api/auth/signup/", self._payload(confirm_password="DifferentPass123")
        )
        self.assertEqual(response.status_code, 400)

    @patch("api.views.send_otp_for_user")
    def test_weak_password_rejected(self, mock_send_otp):
        mock_send_otp.return_value = "123456"
        response = self.client.post(
            "/api/auth/signup/", self._payload(password="weak", confirm_password="weak")
        )
        self.assertEqual(response.status_code, 400)

    @patch("api.views.send_otp_for_user")
    def test_invalid_gender_rejected(self, mock_send_otp):
        mock_send_otp.return_value = "123456"
        response = self.client.post("/api/auth/signup/", self._payload(gender="unknown"))
        self.assertEqual(response.status_code, 400)

    @patch("api.views.send_otp_for_user")
    def test_missing_name_rejected(self, mock_send_otp):
        mock_send_otp.return_value = "123456"
        payload = self._payload()
        del payload["name"]
        response = self.client.post("/api/auth/signup/", payload)
        self.assertEqual(response.status_code, 400)

    def test_phone_only_signup_path_unaffected(self):
        response = self.client.post("/api/auth/request-otp/", {"identity": "+15551234567"})
        self.assertIn(response.status_code, [200, 201])

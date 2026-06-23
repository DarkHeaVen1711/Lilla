"""
Phase 17 — Role Field, Permissions & Migration Tests
Tests: role defaults, permission class matrix, admin backfill, JWT role claim.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import reverse

from api.models import UserProfile
from api.permissions import IsAdminRole, IsManagerOrAdminRole, IsAdminRoleForDestroy


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username, role="customer", is_staff=False, is_superuser=False):
    user = User.objects.create_user(username=username, password="test1234")
    user.is_staff = is_staff
    user.is_superuser = is_superuser
    user.save()
    # Signal creates the profile; override role if explicitly given
    profile = user.userprofile
    if role != "customer":
        profile.role = role
        profile.save()
    return user


# ── Permission Stub Views ─────────────────────────────────────────────────────

class AdminOnlyView(APIView):
    permission_classes = [IsAdminRole]
    def get(self, request): return Response({"ok": True})


class ManagerOrAdminView(APIView):
    permission_classes = [IsManagerOrAdminRole]
    def get(self, request): return Response({"ok": True})


class DestroyGatedView(APIView):
    permission_classes = [IsAdminRoleForDestroy]
    def get(self, request): return Response({"ok": True})
    def post(self, request): return Response({"ok": True})
    def delete(self, request): return Response({"ok": True})


# ── Tests ─────────────────────────────────────────────────────────────────────

class UserProfileDefaultRoleTest(TestCase):
    """New users must default to role='customer'."""

    def test_new_user_gets_customer_role(self):
        user = User.objects.create_user(username="newuser@test.com", password="pass1234")
        self.assertEqual(user.userprofile.role, "customer")

    def test_superuser_gets_admin_role(self):
        user = User.objects.create_superuser(username="superadmin", password="pass1234")
        self.assertEqual(user.userprofile.role, "admin")

    def test_staff_user_gets_admin_role(self):
        user = User.objects.create_user(username="staffuser", password="pass1234", is_staff=True)
        self.assertEqual(user.userprofile.role, "admin")

    def test_profile_str(self):
        user = User.objects.create_user(username="strtest", password="pass1234")
        self.assertIn("customer", str(user.userprofile))


class PermissionClassTest(TestCase):
    """Allow/deny matrix for all three roles × permission classes."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.customer = make_user("customer_user", role="customer")
        self.manager = make_user("manager_user", role="manager")
        self.admin = make_user("admin_user", role="admin")

    def _check(self, view_class, user, method="get"):
        view = view_class.as_view()
        req = getattr(self.factory, method)("/")
        req.user = user
        response = view(req)
        return response.status_code

    # IsAdminRole
    def test_admin_role_allows_admin(self):
        self.assertEqual(self._check(AdminOnlyView, self.admin), 200)

    def test_admin_role_blocks_manager(self):
        self.assertEqual(self._check(AdminOnlyView, self.manager), 403)

    def test_admin_role_blocks_customer(self):
        self.assertEqual(self._check(AdminOnlyView, self.customer), 403)

    # IsManagerOrAdminRole
    def test_manager_or_admin_allows_admin(self):
        self.assertEqual(self._check(ManagerOrAdminView, self.admin), 200)

    def test_manager_or_admin_allows_manager(self):
        self.assertEqual(self._check(ManagerOrAdminView, self.manager), 200)

    def test_manager_or_admin_blocks_customer(self):
        self.assertEqual(self._check(ManagerOrAdminView, self.customer), 403)

    # IsAdminRoleForDestroy — safe methods open to all authenticated
    def test_destroy_gated_allows_safe_for_manager(self):
        self.assertEqual(self._check(DestroyGatedView, self.manager, "get"), 200)

    def test_destroy_gated_allows_post_for_manager(self):
        self.assertEqual(self._check(DestroyGatedView, self.manager, "post"), 200)

    def test_destroy_gated_allows_delete_for_manager(self):
        # Manager can call DELETE; the view decides the *behaviour* (soft vs hard)
        self.assertEqual(self._check(DestroyGatedView, self.manager, "delete"), 200)

    def test_destroy_gated_allows_delete_for_admin(self):
        self.assertEqual(self._check(DestroyGatedView, self.admin, "delete"), 200)

    def test_destroy_gated_blocks_post_for_customer(self):
        self.assertEqual(self._check(DestroyGatedView, self.customer, "post"), 403)


class JWTRoleClaimTest(APITestCase):
    """OTP verify endpoint must embed role in both JWT payload and response body."""

    def setUp(self):
        from django.core.cache import cache
        self.identity = "roletest@example.com"
        self.user = User.objects.create_user(username=self.identity, password="pass1234")
        self.user.email = self.identity
        self.user.save()
        self.user.userprofile.role = "manager"
        self.user.userprofile.save()
        # Pre-set OTP in cache
        cache.set(f"otp:{self.identity}", "123456", timeout=300)

    def test_verify_otp_returns_role_in_body(self):
        url = reverse("auth-verify-otp")
        res = self.client.post(url, {"identity": self.identity, "otp": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["user"]["role"], "manager")

    def test_verify_otp_embeds_role_in_jwt(self):
        import base64, json
        from django.core.cache import cache
        cache.set(f"otp:{self.identity}", "123456", timeout=300)
        url = reverse("auth-verify-otp")
        res = self.client.post(url, {"identity": self.identity, "otp": "123456"}, format="json")
        access = res.data["access"]
        # Decode JWT payload without verification (test-only)
        payload_b64 = access.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.b64decode(payload_b64))
        self.assertEqual(payload.get("role"), "manager")

    def test_profile_endpoint_returns_role(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("auth-profile")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "manager")

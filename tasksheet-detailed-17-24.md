# LILLA — Multi-Role Access System (Customer / Manager / Admin)
## EXHAUSTIVE Implementation Tasksheet — Phases 17–24

This document continues the repo's existing `tasksheet.md` (Phases 1–13/16) with the full multi-role access system: explicit role modeling, Admin user management, Manager product CRUD with a soft-delete approval workflow, AI-assisted descriptions, bulk CSV upload, a Manager insights dashboard, and the frontend routing/guard layer that ties it all together.

**This is the detailed companion to the higher-level Phase 17–24 tasksheet produced earlier in this conversation.** Every backend field, endpoint, serializer, permission class, and frontend component/hook/page is specified explicitly below — file paths, function signatures, request/response shapes — so an implementing agent does not need to make naming or architecture decisions on its own.

### How to use this document

- Work phases in order: **17 → 18 → 19 → 20 → 21 → 22 → 23 → 24**. Phase 17 is a hard dependency for every later phase.
- Every phase ends with an **Acceptance Checklist** — do not move to the next phase until every box is checked and `python backend/manage.py test api` is green.
- Wherever this document says "confirm against actual repo state" or similar — open the real file first. This spec is written from the README's documented feature set, not a live diff of the repository, so exact existing field/class names may differ slightly; the *shape, behavior, and intent* specified here is the requirement.
- Code blocks are implementation-ready but assume certain existing conventions (serializer base classes, API client wrapper, Shadcn/ui components, toast library) that must be confirmed against the real codebase — substitute exact existing names/imports where this doc's guess doesn't match.
- Replace raw HTML/Tailwind in example components with the project's existing Shadcn/ui primitives (`Button`, `Input`, `Select`, `Dialog`, `Table`, etc. from `frontend/src/components/ui/`) wherever they're available — the JSX in this document specifies behavior and data flow, not final pixel-level styling.

---

# LILLA — Multi-Role Access System (Customer / Manager / Admin) — EXHAUSTIVE Tasksheet

This is the fully-detailed implementation spec for Phases 17–24, continuing from the repo's existing `tasksheet.md` (currently through Phase 13/16). Every phase below specifies exact file paths, field names, function signatures, request/response shapes, and wiring points so an implementing agent can execute without needing to make naming decisions.

**Read this before starting anything:**

- All file paths are relative to the repo root (`backend/...`, `frontend/...`).
- Wherever this document says "confirm against actual repo state," it means: the exact current field/class/file may differ slightly from what's described (this document is written from the documented README feature set, not a live diff), so the agent must `view`/open the real file first and adapt names if they differ — but the *shape and behavior* specified here is the requirement, not a suggestion.
- Every phase ends with explicit backend wiring (urls.py registration) and frontend wiring (where a new API call plugs into an existing hook/store) — nothing is left as "add this somewhere."
- Run `python backend/manage.py test api` after every phase. Do not proceed to the next phase with a red test suite.

---

## PHASE 17 — Role Field, Permissions Backbone, JWT Claims, Migration

### 17.1 — Backend: Add `role` field to User model

**File**: `backend/api/models.py`

Locate the custom User model (LILLA uses OTP-based auth, so there is almost certainly a custom user model already, likely named `User` extending `AbstractUser` or `AbstractBaseUser`, since Django's default user model can't be modified after a project has migrations — confirm the actual class name and import path by opening the file before editing).

Add the field:

```python
class User(AbstractUser):  # or whatever the actual base class is — confirm in file
    # ... existing fields (phone, email, etc.) ...

    ROLE_CUSTOMER = "customer"
    ROLE_MANAGER = "manager"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = [
        (ROLE_CUSTOMER, "Customer"),
        (ROLE_MANAGER, "Manager"),
        (ROLE_ADMIN, "Admin"),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_CUSTOMER,
        db_index=True,
        help_text="Application-level role. Distinct from is_staff/is_superuser, which remain Django-admin-panel concerns.",
    )

    @property
    def is_manager(self) -> bool:
        return self.role == self.ROLE_MANAGER

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.ROLE_ADMIN

    @property
    def is_manager_or_admin(self) -> bool:
        return self.role in (self.ROLE_MANAGER, self.ROLE_ADMIN)
```

> If the User model is in a different app (some Django setups put it in an `accounts` app rather than `api`), confirm via `backend/lilla_backend/settings.py` → `AUTH_USER_MODEL` setting, and apply this edit to the correct file.

### 17.2 — Backend: Migration + data backfill

```bash
cd backend
python manage.py makemigrations api -n add_user_role_field
```

After the migration file is generated, **add a data migration in the same file** (or a follow-up migration `00XX_backfill_user_roles.py`) to backfill existing accounts so no current admin loses access:

```python
from django.db import migrations

def backfill_roles(apps, schema_editor):
    User = apps.get_model("api", "User")  # confirm app label
    User.objects.filter(is_superuser=True).update(role="admin")
    User.objects.filter(is_staff=True, is_superuser=False).update(role="admin")
    # Anyone not staff/superuser keeps the model default of "customer" — no action needed.

def reverse_backfill(apps, schema_editor):
    pass  # no-op reverse; role field removal is handled by the schema migration itself

class Migration(migrations.Migration):
    dependencies = [
        ("api", "00XX_add_user_role_field"),  # set to the actual preceding migration name
    ]
    operations = [
        migrations.RunPython(backfill_roles, reverse_backfill),
    ]
```

Run:

```bash
python manage.py migrate
```

**Verification step (do not skip)**: open the Django shell and confirm:

```bash
python manage.py shell -c "from api.models import User; print(User.objects.values('username','is_staff','is_superuser','role'))"
```

Every existing staff/superuser account must show `role: admin`. Every plain customer account must show `role: customer`.

### 17.3 — Backend: Permission classes

**File**: `backend/api/permissions.py` (create this file if it does not already exist — check first, since `IsAdminUser` may currently be imported directly from `rest_framework.permissions` rather than a custom module)

```python
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """Allows access only to users with role == 'admin'."""

    message = "This action requires Admin privileges."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsManagerOrAdminRole(BasePermission):
    """Allows access to users with role == 'manager' or role == 'admin'."""

    message = "This action requires Manager or Admin privileges."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("manager", "admin")
        )


class IsAdminRoleForDestroy(BasePermission):
    """
    Allows Manager and Admin for all safe methods, POST, PUT, PATCH.
    Restricts DELETE to Admin only.
    Used on ProductViewSet so Managers can create/update but
    only Admin can hard-delete (Managers instead trigger the
    soft pending_deletion flow handled in the viewset itself — see Phase 19).
    """

    message = "Only Admin can permanently delete this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role not in ("manager", "admin"):
            return False
        if request.method == "DELETE" and request.user.role != "admin":
            return False
        return True
```

> Note: `IsAdminRoleForDestroy` as written above blocks Manager from ever calling `DELETE` at the permission-class level. Phase 19 deliberately changes this — re-read Phase 19.4 before assuming this class is final. The actual final behavior: Manager's `DELETE` call must reach the view (not be blocked at the permission layer) so the view can intercept it and convert it into a soft `pending_deletion` update. **Therefore**, the permission class above should NOT block Manager's DELETE — correct version:

```python
class IsAdminRoleForDestroy(BasePermission):
    """
    Allows Manager and Admin to call DELETE — the viewset itself
    decides whether that means a real delete (Admin) or a soft
    pending_deletion flag (Manager). This permission class only
    gatekeeps Customers out entirely.
    """

    message = "This action requires Manager or Admin privileges."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("manager", "admin")
        )
```

Use this corrected version. Delete the first draft above — it's left in this document only to explain *why* the simpler version is correct (the destroy-vs-soft-delete branching belongs in the view, not the permission class).

### 17.4 — Backend: JWT claim injection

**File**: wherever SimpleJWT's `TokenObtainPairSerializer` is currently subclassed for the OTP flow — likely `backend/api/serializers.py` near the OTP-verify logic, or a dedicated `backend/api/auth_serializers.py`. Search for `TokenObtainPairSerializer` or `RefreshToken.for_user` to find the exact call site (the OTP flow likely calls `RefreshToken.for_user(user)` directly rather than using the standard SimpleJWT serializer, since login is OTP-based not password-based).

If tokens are minted via `RefreshToken.for_user(user)`:

```python
from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role  # <-- ADD THIS LINE
    access = refresh.access_token
    access["role"] = user.role  # <-- ADD THIS LINE
    return {
        "refresh": str(refresh),
        "access": str(access),
    }
```

If a custom `TokenObtainPairSerializer` subclass exists instead, add a `get_token` override:

```python
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token
```

**Find the exact call site** by searching the codebase for where the OTP-verify endpoint (`POST /api/auth/verify-otp/`) returns tokens to the client — that function must produce a token with `role` embedded. Confirm by decoding a real token after implementing (e.g. paste an issued access token into jwt.io and verify a `"role": "customer"` claim appears in the payload).

### 17.5 — Backend: Profile endpoint includes role

**File**: `backend/api/serializers.py` — find the serializer used by `GET/PATCH /api/auth/profile/` (likely `UserProfileSerializer` or `UserSerializer`).

```python
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "phone",
            # ... existing fields ...
            "role",  # <-- ADD THIS
        ]
        read_only_fields = [
            # ... existing read-only fields ...
            "role",  # <-- role is never settable via this endpoint; only via Phase 18's dedicated admin endpoint
        ]
```

### 17.6 — Backend: Django admin panel visibility

**File**: `backend/api/admin.py`

```python
@admin.register(User)
class UserAdmin(BaseUserAdmin):  # confirm actual existing registration/base class
    list_display = BaseUserAdmin.list_display + ("role",)  # adjust if list_display is fully overridden rather than extended
    list_filter = BaseUserAdmin.list_filter + ("role",)
```

> If `User` is not currently registered in `admin.py` at all, add a full registration block; check the file first.

### 17.7 — Backend: urls.py — nothing new to wire in this phase

Phase 17 introduces no new endpoints — it only modifies existing serializers/permissions/models. Confirm no route changes are needed in `backend/api/urls.py` for this phase specifically (Phase 18 onward will add routes).

### 17.8 — Frontend: Type definitions

**File**: `frontend/src/lib/types.ts` (or wherever the `User`/`AuthUser` type currently lives — search for `interface User` or `type User`)

```typescript
export type UserRole = "customer" | "manager" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  // ...existing fields...
  role: UserRole;
}
```

### 17.9 — Frontend: Decode role from JWT / auth store

**File**: wherever the Zustand auth slice lives — likely `frontend/src/store/authSlice.ts` or `frontend/src/store/useAuthStore.ts`. Also check `frontend/src/lib/jwt.ts` or similar for any existing JWT-decode helper (the silent-refresh feature documented in the README implies one already exists).

If a JWT decode helper already exists (e.g. using `jwt-decode` package), extend the decoded-payload type:

```typescript
// lib/jwt.ts (or wherever the decode helper lives)
interface DecodedAccessToken {
  user_id: number;
  exp: number;
  role: UserRole;  // <-- ADD THIS
  // ...other existing claims...
}
```

Update the Zustand auth store to expose role and derived booleans:

```typescript
// store/authSlice.ts — adjust to match actual existing store shape
interface AuthState {
  user: User | null;
  accessToken: string | null;
  // ...existing fields...

  // ADD:
  role: UserRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isManagerOrAdmin: boolean;
}

// Wherever the store currently sets `user`/`accessToken` after login or token refresh,
// also derive and set role:
set({
  user: decodedUser,
  accessToken: token,
  role: decodedUser.role,
  isAdmin: decodedUser.role === "admin",
  isManager: decodedUser.role === "manager",
  isManagerOrAdmin: decodedUser.role === "manager" || decodedUser.role === "admin",
});
```

**Wiring point**: this must run in every place tokens are currently set — that's likely (a) right after `verify-otp` success, and (b) right after the silent token-refresh cycle restores/rotates the access token. Find both call sites (search for `setAccessToken`, `set({ accessToken`, or the refresh-scheduling function mentioned in the README's "Client-Side Silent Token Refresh" feature) and apply the same role-derivation logic in both places — if only the login path sets `role` and the refresh path doesn't, the role will silently go stale/null after the first token rotation.

### 17.10 — Tests

**File**: `backend/api/test_roles.py` (new file)

```python
from django.test import TestCase
from rest_framework.test import APIClient
from api.models import User
from api.permissions import IsAdminRole, IsManagerOrAdminRole, IsAdminRoleForDestroy


class RoleFieldDefaultsTest(TestCase):
    def test_new_user_defaults_to_customer_role(self):
        user = User.objects.create_user(username="newcust", password="x")
        self.assertEqual(user.role, "customer")

    def test_superuser_backfill_assigns_admin_role(self):
        # Simulates what the data migration should have done;
        # for a fresh test DB this confirms the model default isn't
        # accidentally "admin" for superusers created post-migration.
        admin_user = User.objects.create_superuser(username="root", password="x", email="r@example.com")
        # NOTE: createsuperuser does NOT automatically get role="admin" unless
        # you've overridden create_superuser() to set it. Decide explicitly:
        # either override User.objects.create_superuser to default role="admin",
        # or require manual role assignment post-creation. Test below assumes
        # the override exists — if it doesn't, add it to the custom UserManager.
        self.assertEqual(admin_user.role, "admin")


class PermissionClassTest(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(username="cust", password="x", role="customer")
        self.manager = User.objects.create_user(username="mgr", password="x", role="manager")
        self.admin = User.objects.create_user(username="adm", password="x", role="admin")

    def _fake_request(self, user, method="GET"):
        class FakeRequest:
            pass
        req = FakeRequest()
        req.user = user
        req.method = method
        return req

    def test_is_admin_role_permission(self):
        perm = IsAdminRole()
        self.assertFalse(perm.has_permission(self._fake_request(self.customer), None))
        self.assertFalse(perm.has_permission(self._fake_request(self.manager), None))
        self.assertTrue(perm.has_permission(self._fake_request(self.admin), None))

    def test_is_manager_or_admin_role_permission(self):
        perm = IsManagerOrAdminRole()
        self.assertFalse(perm.has_permission(self._fake_request(self.customer), None))
        self.assertTrue(perm.has_permission(self._fake_request(self.manager), None))
        self.assertTrue(perm.has_permission(self._fake_request(self.admin), None))

    def test_is_admin_role_for_destroy_allows_manager_delete_through(self):
        # Per 17.3's corrected version: Manager IS allowed through this
        # permission class on DELETE — the soft-delete branching happens
        # in the view (Phase 19), not here.
        perm = IsAdminRoleForDestroy()
        self.assertTrue(perm.has_permission(self._fake_request(self.manager, method="DELETE"), None))
        self.assertTrue(perm.has_permission(self._fake_request(self.admin, method="DELETE"), None))
        self.assertFalse(perm.has_permission(self._fake_request(self.customer, method="DELETE"), None))


class JWTRoleClaimTest(TestCase):
    def test_access_token_contains_role_claim(self):
        from api.serializers import get_tokens_for_user  # adjust import to actual function location
        user = User.objects.create_user(username="claimtest", password="x", role="manager")
        tokens = get_tokens_for_user(user)
        from rest_framework_simplejwt.tokens import AccessToken
        decoded = AccessToken(tokens["access"])
        self.assertEqual(decoded["role"], "manager")


class ProfileEndpointRoleTest(TestCase):
    def test_profile_endpoint_returns_role(self):
        client = APIClient()
        user = User.objects.create_user(username="profiletest", password="x", role="manager")
        client.force_authenticate(user=user)
        response = client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], "manager")
```

Run:

```bash
python backend/manage.py test api.test_roles
python backend/manage.py test api   # full regression
```

### 17.11 — Phase 17 Acceptance Checklist

- [ ] `role` field exists on User, default `customer`, migrated.
- [ ] Data migration backfilled all existing staff/superuser accounts to `role="admin"`.
- [ ] `IsAdminRole`, `IsManagerOrAdminRole`, `IsAdminRoleForDestroy` exist in `permissions.py` and pass unit tests.
- [ ] Access and refresh JWTs both carry a `role` claim — verified by decoding a real issued token.
- [ ] `GET /api/auth/profile/` response includes `role`.
- [ ] Django admin User list shows/filters by `role`.
- [ ] Frontend `User`/`AuthUser` type includes `role: UserRole`.
- [ ] Zustand auth store exposes `role`, `isAdmin`, `isManager`, `isManagerOrAdmin`, correctly re-derived on both login AND silent token refresh.
- [ ] Full existing test suite (`python backend/manage.py test api`) still passes — zero regressions in OTP, checkout, review, or analytics tests.
## PHASE 18 — Admin User Management: Promote/Demote to Manager

**Depends on**: Phase 17 (role field, `IsAdminRole` permission, role-aware JWT).

### 18.1 — Backend: `RoleChangeLog` model

**File**: `backend/api/models.py`

```python
class RoleChangeLog(models.Model):
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="role_changes_made"
    )
    target_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="role_changes_received"
    )
    old_role = models.CharField(max_length=10, choices=User.ROLE_CHOICES)
    new_role = models.CharField(max_length=10, choices=User.ROLE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.target_user.username}: {self.old_role} → {self.new_role} (by {self.changed_by})"
```

Migration:

```bash
cd backend
python manage.py makemigrations api -n add_role_change_log
python manage.py migrate
```

Register in `backend/api/admin.py`:

```python
@admin.register(RoleChangeLog)
class RoleChangeLogAdmin(admin.ModelAdmin):
    list_display = ("target_user", "old_role", "new_role", "changed_by", "timestamp")
    list_filter = ("old_role", "new_role")
    readonly_fields = ("changed_by", "target_user", "old_role", "new_role", "timestamp")
```

### 18.2 — Backend: Extend `GET /api/admin/users/`

**File**: `backend/api/views.py` — find the existing view backing `GET /api/admin/users/` (per the README's API table, this already exists, `IsAdminUser`-gated). Confirm its current implementation (likely a `ListAPIView` or a `ViewSet` action) before editing.

Required changes:
1. Swap `permission_classes = [IsAdminUser]` → `permission_classes = [IsAdminRole]` (import from `api.permissions`).
2. Add query param support for `?role=manager` (or `customer`/`admin`) filtering.
3. Ensure the serializer includes `role`, `date_joined`, `last_login`.

```python
# views.py
from .permissions import IsAdminRole

class AdminUserListView(generics.ListAPIView):  # adjust to actual existing class name/base
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserListSerializer  # see 18.2.1 below

    def get_queryset(self):
        qs = User.objects.all().order_by("-date_joined")
        role_filter = self.request.query_params.get("role")
        if role_filter in ("customer", "manager", "admin"):
            qs = qs.filter(role=role_filter)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )
        return qs
```

#### 18.2.1 — Serializer

**File**: `backend/api/serializers.py`

```python
class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "phone", "role", "date_joined", "last_login", "is_active"]
```

### 18.3 — Backend: `PATCH /api/admin/users/<id>/role/`

**File**: `backend/api/views.py`

```python
class AdminUserRoleUpdateView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, user_id):
        new_role = request.data.get("role")
        if new_role not in ("customer", "manager", "admin"):
            return Response(
                {"detail": "role must be one of: customer, manager, admin"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = get_object_or_404(User, id=user_id)
        old_role = target_user.role

        if old_role == new_role:
            return Response(
                {"detail": "User already has this role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guard: prevent demoting the last remaining admin
        if old_role == "admin" and new_role != "admin":
            remaining_admins = User.objects.filter(role="admin").exclude(id=target_user.id).count()
            if remaining_admins == 0:
                return Response(
                    {"detail": "Cannot demote the last remaining Admin account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            target_user.role = new_role
            target_user.save(update_fields=["role"])
            RoleChangeLog.objects.create(
                changed_by=request.user,
                target_user=target_user,
                old_role=old_role,
                new_role=new_role,
            )

        return Response(
            {
                "id": target_user.id,
                "username": target_user.username,
                "role": target_user.role,
            },
            status=status.HTTP_200_OK,
        )
```

### 18.4 — Backend: urls.py wiring

**File**: `backend/api/urls.py`

```python
from .views import AdminUserListView, AdminUserRoleUpdateView  # add to existing imports

urlpatterns = [
    # ...existing patterns...
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),  # confirm if already registered; if so, only the view/permission changes from 18.2 apply
    path("admin/users/<int:user_id>/role/", AdminUserRoleUpdateView.as_view(), name="admin-user-role-update"),  # NEW
]
```

> If `admin/users/` is already registered via a router rather than a direct `path()`, locate the router registration instead and confirm the URL name doesn't collide.

### 18.5 — Backend: Tests

**File**: `backend/api/test_admin.py` (extend existing file — do not create a duplicate; this file already has admin permission tests per the README's test list)

```python
class RoleChangeEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username="admin1", password="x", role="admin")
        self.admin2 = User.objects.create_user(username="admin2", password="x", role="admin")
        self.manager = User.objects.create_user(username="mgr1", password="x", role="manager")
        self.customer = User.objects.create_user(username="cust1", password="x", role="customer")

    def test_admin_can_promote_customer_to_manager(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f"/api/admin/users/{self.customer.id}/role/", {"role": "manager"})
        self.assertEqual(response.status_code, 200)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role, "manager")

    def test_role_change_creates_audit_log(self):
        self.client.force_authenticate(user=self.admin)
        self.client.patch(f"/api/admin/users/{self.customer.id}/role/", {"role": "manager"})
        log = RoleChangeLog.objects.get(target_user=self.customer)
        self.assertEqual(log.old_role, "customer")
        self.assertEqual(log.new_role, "manager")
        self.assertEqual(log.changed_by, self.admin)

    def test_manager_cannot_call_role_update_endpoint(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(f"/api/admin/users/{self.customer.id}/role/", {"role": "manager"})
        self.assertEqual(response.status_code, 403)

    def test_customer_cannot_call_role_update_endpoint(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.patch(f"/api/admin/users/{self.manager.id}/role/", {"role": "admin"})
        self.assertEqual(response.status_code, 403)

    def test_cannot_demote_last_remaining_admin(self):
        # Demote admin2 first so only self.admin remains
        self.client.force_authenticate(user=self.admin)
        self.client.patch(f"/api/admin/users/{self.admin2.id}/role/", {"role": "customer"})
        # Now try to demote the last admin (self.admin) — should fail
        response = self.client.patch(f"/api/admin/users/{self.admin.id}/role/", {"role": "customer"})
        self.assertEqual(response.status_code, 400)

    def test_invalid_role_value_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f"/api/admin/users/{self.customer.id}/role/", {"role": "superhero"})
        self.assertEqual(response.status_code, 400)

    def test_admin_user_list_filters_by_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/users/?role=manager")
        usernames = [u["username"] for u in response.data]
        self.assertIn("mgr1", usernames)
        self.assertNotIn("cust1", usernames)
```

Run: `python backend/manage.py test api.test_admin`

### 18.6 — Frontend: API client function

**File**: `frontend/src/lib/api/admin.ts` (or wherever existing admin API calls live — search for the function currently calling `/api/admin/analytics/` or `/api/admin/users/` to find the right file and match its existing fetch-wrapper pattern, e.g. an `apiClient` axios instance or a custom `fetchWithAuth` helper)

```typescript
import { apiClient } from "@/lib/api/client"; // adjust import to actual existing client

export interface AdminUserListItem {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: "customer" | "manager" | "admin";
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
}

export async function fetchAdminUsers(params?: {
  role?: "customer" | "manager" | "admin";
  search?: string;
}): Promise<AdminUserListItem[]> {
  const response = await apiClient.get("/api/admin/users/", { params });
  return response.data;
}

export async function updateUserRole(
  userId: number,
  role: "customer" | "manager" | "admin"
): Promise<{ id: number; username: string; role: string }> {
  const response = await apiClient.patch(`/api/admin/users/${userId}/role/`, { role });
  return response.data;
}
```

### 18.7 — Frontend: `/admin/users` page

**File**: `frontend/src/app/admin/users/page.tsx` (new file; sits alongside the existing `frontend/src/app/admin/` analytics page per the documented directory structure)

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchAdminUsers, updateUserRole, AdminUserListItem } from "@/lib/api/admin";
import { useAuthStore } from "@/store/useAuthStore"; // adjust to actual store hook name

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "customer" | "manager" | "admin">("");
  const [confirmTarget, setConfirmTarget] = useState<{ user: AdminUserListItem; newRole: string } | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  async function handleConfirmRoleChange() {
    if (!confirmTarget) return;
    await updateUserRole(confirmTarget.user.id, confirmTarget.newRole as any);
    setConfirmTarget(null);
    await loadUsers();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">User Management</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadUsers()}
          className="border rounded px-3 py-2 w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={loadUsers} className="border rounded px-4 py-2">
          Search
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-200">
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                <td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "—"}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) =>
                      setConfirmTarget({ user: u, newRole: e.target.value })
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option value="customer">Customer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <p className="mb-4">
              Change <strong>{confirmTarget.user.username}</strong>'s role to{" "}
              <strong>{confirmTarget.newRole}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2">
                Cancel
              </button>
              <button
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 bg-black text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

> Replace raw Tailwind classes and the plain `<select>`/modal above with the project's existing Shadcn/ui `Select`, `Dialog`, and `Table` components (check `frontend/src/components/ui/`) for visual consistency — the inline JSX above specifies *behavior and data flow*, not final pixel-level styling, since Shadcn component APIs need to be confirmed against what's actually installed in the repo (`alert`, `dialog`, `select`, `table` etc. may or may not all be present).

### 18.8 — Frontend: Route guard

This page must only be reachable by `role === "admin"`. If Phase 24's `withRoleGuard`/middleware already exists by the time this is implemented, use it here directly:

```tsx
// If Phase 24 is done first:
export default withRoleGuard(["admin"])(AdminUsersPage);
```

If Phase 24 is not done yet, add a minimal inline guard for now (to be replaced by Phase 24's centralized version — note this explicitly in a code comment so it isn't duplicated later):

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

function useAdminGuard() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  useEffect(() => {
    if (role !== null && role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);
}
// Call useAdminGuard() at the top of AdminUsersPage.
// TODO(Phase 24): replace with centralized withRoleGuard once implemented.
```

### 18.9 — Phase 18 Acceptance Checklist

- [ ] `RoleChangeLog` model exists, migrated, registered in Django admin.
- [ ] `GET /api/admin/users/` supports `?role=` and `?search=` filtering, gated by `IsAdminRole`.
- [ ] `PATCH /api/admin/users/<id>/role/` works, validates role values, blocks self-lockout (last-admin guard), writes an audit log row every time.
- [ ] All new backend tests pass; full suite still green.
- [ ] `/admin/users` page renders a searchable/filterable table with working role-change dropdown + confirmation modal.
- [ ] Non-admin roles cannot reach this page (guarded) or call the endpoint (403 from backend regardless of frontend guard — backend is the real enforcement layer).
## PHASE 19 — Manager Product Management: Backend CRUD + Soft-Delete Workflow

**Depends on**: Phase 17 (`role` field, `IsAdminRoleForDestroy` permission).

### 19.1 — Backend: `deletion_status` field on Product

**File**: `backend/api/models.py` — locate the existing `Product` model.

```python
class Product(models.Model):
    # ...existing fields (name, slug, price, description, stock, category, concern, image, rating, etc.)...

    DELETION_STATUS_ACTIVE = "active"
    DELETION_STATUS_PENDING = "pending_deletion"
    DELETION_STATUS_ARCHIVED = "archived"

    DELETION_STATUS_CHOICES = [
        (DELETION_STATUS_ACTIVE, "Active"),
        (DELETION_STATUS_PENDING, "Pending Deletion"),
        (DELETION_STATUS_ARCHIVED, "Archived"),
    ]

    deletion_status = models.CharField(
        max_length=20,
        choices=DELETION_STATUS_CHOICES,
        default=DELETION_STATUS_ACTIVE,
        db_index=True,
    )

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="products_created"
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="products_updated"
    )
```

> `created_by`/`updated_by` are additive audit fields requested implicitly by "wiring everything" — they let the Manager insights dashboard (Phase 23) and Admin views show who authored a product. If the agent finds these names collide with existing fields, rename to `authored_by`/`last_modified_by`.

Migration:

```bash
cd backend
python manage.py makemigrations api -n add_product_deletion_status_and_audit_fields
python manage.py migrate
```

### 19.2 — Backend: Update default manager / queryset filtering for public-facing views

**File**: `backend/api/models.py` (same file, on `Product`) or `backend/api/views.py` wherever `Product.objects.all()` is currently called for the **public** product list/detail endpoints (`GET /api/products/`, `GET /api/products/<slug>/`, `/api/homepage/`, `/api/catalog/...`).

Add a custom manager so archived/pending-deletion products never leak into customer-facing views without having to remember to filter every single queryset by hand:

```python
class ActiveProductManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().exclude(deletion_status=Product.DELETION_STATUS_ARCHIVED)


class Product(models.Model):
    # ...existing fields...
    objects = models.Manager()            # default manager — unrestricted, for Admin/Manager views
    active_objects = ActiveProductManager()  # excludes archived only; pending_deletion still shows (see note below)
```

**Important nuance**: `pending_deletion` products should likely **still appear on the public storefront** until an Admin actually approves the deletion — a Manager flagging something for removal shouldn't instantly vanish it from customers mid-review, unless the business intent is "hide immediately, decide later." Given your earlier framing ("deleting requires Admin approval" — implying the delete hasn't happened yet), the correct behavior is: **`pending_deletion` still displays normally to customers; only `archived` is hidden.** Update all public-facing queryset call sites (search `Product.objects.all()` / `Product.objects.filter(` across `views.py`, and any direct ORM calls in `signals.py` for ISR revalidation) to use `Product.active_objects` instead of `Product.objects` **only for customer-facing endpoints**. Admin/Manager-facing endpoints (Phase 19.3 below) must continue using `Product.objects` (unrestricted) so they can see and manage every state.

### 19.3 — Backend: ProductViewSet permission + destroy override

**File**: `backend/api/views.py` — locate the existing `ProductViewSet` (per the README's documented filtering feature, this already exists with `?category=`, `?concern=`, `?search=` support).

```python
from .permissions import IsAdminRoleForDestroy
from rest_framework.permissions import AllowAny

class ProductViewSet(viewsets.ModelViewSet):
    # ...existing queryset/serializer_class/filtering logic — DO NOT remove...

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        # create, update, partial_update, destroy all require Manager or Admin
        return [IsAdminRoleForDestroy()]

    def get_queryset(self):
        # Public list/retrieve: only active_objects (active + pending_deletion, never archived)
        # Manager/Admin-initiated requests for their own management views should hit a
        # SEPARATE endpoint (19.4 below) that explicitly uses Product.objects unrestricted —
        # do not bypass active_objects here just because the requester happens to be staff,
        # since this viewset is also the one the public storefront calls.
        if self.action in ("list", "retrieve"):
            qs = Product.active_objects.all()
            # ...re-apply existing category/concern/search filtering logic here, unchanged...
            return qs
        return Product.objects.all()  # create/update/destroy operate on the unrestricted manager

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if request.user.role == "admin":
            # Admin DELETE = real action. If it's already pending_deletion, finalize as archived
            # (soft-archive, not a hard DB delete, to protect Order history FK integrity — see 19.3.1).
            instance.deletion_status = Product.DELETION_STATUS_ARCHIVED
            instance.save(update_fields=["deletion_status"])
            return Response(
                {"detail": "Product archived.", "deletion_status": instance.deletion_status},
                status=status.HTTP_200_OK,
            )

        # Manager DELETE = soft request only
        if instance.deletion_status == Product.DELETION_STATUS_PENDING:
            return Response(
                {"detail": "Deletion already pending Admin approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.deletion_status = Product.DELETION_STATUS_PENDING
        instance.save(update_fields=["deletion_status"])
        return Response(
            {"detail": "Deletion requested. Awaiting Admin approval.", "deletion_status": instance.deletion_status},
            status=status.HTTP_202_ACCEPTED,
        )
```

#### 19.3.1 — Why archive, never hard-delete

`Order` line items almost certainly hold a ForeignKey to `Product` (to display historical order contents). A hard `DELETE` on a Product referenced by any past Order will either cascade-delete order history (if `on_delete=CASCADE`) or raise an integrity error (if `PROTECT`) or null out the reference (if `SET_NULL`, silently breaking the customer's order detail page). **Confirm the actual `on_delete` behavior on `OrderItem.product` (or equivalent) before assuming archiving is merely a "nice to have"** — if it's `CASCADE`, archiving instead of hard-deleting is not optional, it's the only way to avoid silently destroying a customer's purchase history the moment a product is removed from sale. Do not change this FK's `on_delete` behavior as part of this phase; just confirm it and let that confirmation justify the archive-not-delete design already specified above.

### 19.4 — Backend: Admin approve/reject deletion endpoints

**File**: `backend/api/views.py`

```python
from .permissions import IsAdminRole

class ApproveProductDeletionView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        if product.deletion_status != Product.DELETION_STATUS_PENDING:
            return Response(
                {"detail": "Product is not pending deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.deletion_status = Product.DELETION_STATUS_ARCHIVED
        product.save(update_fields=["deletion_status"])
        return Response({"detail": "Deletion approved. Product archived.", "id": product.id})


class RejectProductDeletionView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        if product.deletion_status != Product.DELETION_STATUS_PENDING:
            return Response(
                {"detail": "Product is not pending deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.deletion_status = Product.DELETION_STATUS_ACTIVE
        product.save(update_fields=["deletion_status"])
        return Response({"detail": "Deletion rejected. Product restored to active.", "id": product.id})
```

### 19.5 — Backend: Manager/Admin product management list endpoint (unrestricted queryset)

This is the endpoint the Manager's `/manager/products` page (Phase 20) and Admin's product section will actually call — **not** the public `ProductViewSet` list action, since that one filters out archived items and applies public-only logic. This endpoint shows everything, including `pending_deletion` and `archived`, with status badges.

**File**: `backend/api/views.py`

```python
class ManagementProductListView(generics.ListAPIView):
    permission_classes = [IsManagerOrAdminRole]
    serializer_class = ProductSerializer  # reuse the existing serializer used by ProductViewSet

    def get_queryset(self):
        qs = Product.objects.all().select_related("category", "concern").order_by("-id")
        status_filter = self.request.query_params.get("deletion_status")
        if status_filter in ("active", "pending_deletion", "archived"):
            qs = qs.filter(deletion_status=status_filter)
        return qs
```

**File**: `backend/api/urls.py`

```python
from .views import (
    ApproveProductDeletionView,
    RejectProductDeletionView,
    ManagementProductListView,
)

urlpatterns = [
    # ...existing...
    path("manager/products/", ManagementProductListView.as_view(), name="manager-product-list"),
    path("admin/products/<int:product_id>/approve-deletion/", ApproveProductDeletionView.as_view(), name="approve-product-deletion"),
    path("admin/products/<int:product_id>/reject-deletion/", RejectProductDeletionView.as_view(), name="reject-product-deletion"),
]
```

> The existing `ProductViewSet` is presumably already registered via a DRF router (`router.register("products", ProductViewSet)`) per the README's routers.py mention — leave that registration untouched; this phase only modifies the viewset's internals (19.3) and adds the three net-new endpoints above alongside it.

### 19.6 — Backend: Confirm ISR revalidation signal still fires correctly

**File**: `backend/api/signals.py`

The existing post-save/post-delete signal on `Product` (documented under "Dynamic Performance & Revalidation") must still fire for Manager-authored saves — confirm it's a model-level `post_save` receiver (fires regardless of which user/role triggered the save) rather than something wired only inside the old `IsAdminUser`-gated view logic. If the signal is currently attached inside the view rather than via `@receiver(post_save, sender=Product)`, **do not refactor it to a true signal as part of this phase** unless it's already broken for the existing single-admin-role flow — just confirm and document; refactoring revalidation wiring is out of scope here and risks an unrelated regression.

Additionally: since `deletion_status` changes (Manager requesting deletion, Admin approving/rejecting) are saves too, confirm whether the revalidation signal should fire on those state transitions as well — a product flipping to `archived` should trigger ISR revalidation so it actually disappears from the live storefront cache, not just the database. If the signal currently only fires on full product create/update and not on this kind of partial `save(update_fields=[...])` call, verify Django's signal dispatch still fires for `update_fields`-scoped saves (it does, by default — `post_save` fires regardless of `update_fields`), so no special-casing should be needed, but confirm in a quick manual test (archive a product locally, check whether the Next.js revalidation endpoint receives a call).

### 19.7 — Backend: Tests

**File**: `backend/api/test_manager_products.py` (new file)

```python
from django.test import TestCase
from rest_framework.test import APIClient
from api.models import User, Product, Category


class ManagerProductCRUDTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="mgr", password="x", role="manager")
        self.admin = User.objects.create_user(username="adm", password="x", role="admin")
        self.customer = User.objects.create_user(username="cust", password="x", role="customer")
        self.category = Category.objects.create(name="Skincare", slug="skincare")

    def _product_payload(self):
        return {
            "name": "Test Serum",
            "slug": "test-serum",
            "price": "29.99",
            "description": "A hydrating test serum.",
            "category": self.category.id,
            "stock": 50,
        }

    def test_manager_can_create_product(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post("/api/products/", self._product_payload())
        self.assertEqual(response.status_code, 201)
        product = Product.objects.get(slug="test-serum")
        self.assertEqual(product.created_by, self.manager)
        self.assertEqual(product.deletion_status, "active")

    def test_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post("/api/products/", self._product_payload())
        self.assertEqual(response.status_code, 403)

    def test_manager_delete_sets_pending_deletion_not_real_delete(self):
        self.client.force_authenticate(user=self.manager)
        create_resp = self.client.post("/api/products/", self._product_payload())
        product_id = create_resp.data["id"]

        delete_resp = self.client.delete(f"/api/products/{product_id}/")
        self.assertEqual(delete_resp.status_code, 202)

        product = Product.objects.get(id=product_id)
        self.assertEqual(product.deletion_status, "pending_deletion")  # NOT deleted from DB

    def test_admin_delete_archives_immediately(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post("/api/products/", self._product_payload())
        product_id = create_resp.data["id"]

        delete_resp = self.client.delete(f"/api/products/{product_id}/")
        self.assertEqual(delete_resp.status_code, 200)

        product = Product.objects.get(id=product_id)
        self.assertEqual(product.deletion_status, "archived")

    def test_archived_product_excluded_from_public_list(self):
        self.client.force_authenticate(user=self.admin)
        create_resp = self.client.post("/api/products/", self._product_payload())
        product_id = create_resp.data["id"]
        self.client.delete(f"/api/products/{product_id}/")  # archives it

        self.client.force_authenticate(user=None)  # public/anonymous
        public_resp = self.client.get("/api/products/")
        slugs = [p["slug"] for p in public_resp.data.get("results", public_resp.data)]
        self.assertNotIn("test-serum", slugs)

    def test_pending_deletion_product_still_visible_publicly(self):
        self.client.force_authenticate(user=self.manager)
        create_resp = self.client.post("/api/products/", self._product_payload())
        product_id = create_resp.data["id"]
        self.client.delete(f"/api/products/{product_id}/")  # pending_deletion, not archived

        public_resp = self.client.get("/api/products/")
        slugs = [p["slug"] for p in public_resp.data.get("results", public_resp.data)]
        self.assertIn("test-serum", slugs)

    def test_admin_can_approve_pending_deletion(self):
        self.client.force_authenticate(user=self.manager)
        create_resp = self.client.post("/api/products/", self._product_payload())
        product_id = create_resp.data["id"]
        self.client.delete(f"/api/products/{product_id}/")

        self.client.force_authenticate(user=self.admin)
        approve_resp = self.client.post(f"/api/admin/products/{product_id}/approve-deletion/")
        self.assertEqual(approve_resp.status_code, 200)
        product = Product.objects.get(id=product_id)
        self.assertEqual(product.deletion_status, "archived")

    def test_admin_can_reject_pending_deletion(self):
        self.client.force_authenticate(user=self.manager)
        create_resp = self.client.post("/api/products/", self._product_payload())
        product_id = create_resp.data["id"]
        self.client.delete(f"/api/products/{product_id}/")

        self.client.force_authenticate(user=self.admin)
        reject_resp = self.client.post(f"/api/admin/products/{product_id}/reject-deletion/")
        self.assertEqual(reject_resp.status_code, 200)
        product = Product.objects.get(id=product_id)
        self.assertEqual(product.deletion_status, "active")

    def test_management_list_shows_all_statuses(self):
        self.client.force_authenticate(user=self.manager)
        self.client.post("/api/products/", self._product_payload())
        response = self.client.get("/api/manager/products/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
```

Run: `python backend/manage.py test api.test_manager_products`

### 19.8 — Phase 19 Acceptance Checklist

- [ ] `Product.deletion_status`, `created_by`, `updated_by` fields exist and migrated.
- [ ] `Product.active_objects` manager excludes only `archived` (NOT `pending_deletion`) and is used on every public-facing queryset.
- [ ] `ProductViewSet.destroy()` branches correctly: Manager → `pending_deletion` (202), Admin → `archived` (200).
- [ ] No hard `DELETE` ever occurs on a Product through this flow — confirmed by test and by checking `OrderItem.product`'s `on_delete` behavior.
- [ ] `/api/manager/products/` returns the full unrestricted list (all deletion_status values) for Manager/Admin.
- [ ] `/api/admin/products/<id>/approve-deletion/` and `/reject-deletion/` work, Admin-only.
- [ ] ISR revalidation signal confirmed to still fire on Manager-authored creates/updates and on archive transitions.
- [ ] Full test suite green.
## PHASE 20 — Manager Product Form UI (Name, Price, Image, Description, Type)

**Depends on**: Phase 17, Phase 19 (backend CRUD + soft-delete must exist first).

### 20.1 — Backend: Image upload support on Product serializer

**File**: `backend/api/models.py` — confirm the existing image field. The repo likely already has something like `image_url = models.URLField()` or `image = models.CharField()` since seeded products need an image reference. Add a parallel `ImageField` for actual uploads without removing the existing URL field:

```python
class Product(models.Model):
    # ...existing fields...
    image_url = models.URLField(blank=True, null=True)  # existing — confirm actual name, may differ
    image_upload = models.ImageField(upload_to="products/", blank=True, null=True)  # NEW

    @property
    def display_image(self) -> str:
        """Returns whichever image source is set — uploaded file takes priority over URL."""
        if self.image_upload:
            return self.image_upload.url
        return self.image_url or ""
```

> If the existing field is already named `image` and is itself an `ImageField` (not a URL string), then this phase is simpler than written: just confirm the existing `ProductViewSet`/serializer already accepts `multipart/form-data`, and skip straight to 20.2's frontend work. Open `models.py` first — do not add a duplicate field if one already serves this purpose.

**File**: `backend/lilla_backend/settings.py` — confirm `MEDIA_URL` and `MEDIA_ROOT` are configured:

```python
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

**File**: `backend/lilla_backend/urls.py` (dev-only static media serving):

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ...existing patterns...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Production note** (document in code comment, do not implement the actual S3/Cloudinary wiring in this phase unless explicitly requested separately): swap `DEFAULT_FILE_STORAGE` to `storages.backends.s3boto3.S3Boto3Storage` (django-storages) when deploying, keeping `ImageField`'s usage in models/serializers completely unchanged — the storage backend is the only thing that needs to change at deploy time.

### 20.2 — Backend: Serializer accepts multipart with optional file OR url

**File**: `backend/api/serializers.py`

```python
class ProductSerializer(serializers.ModelSerializer):
    image_upload = serializers.ImageField(required=False, allow_null=True)
    display_image = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "price", "description",
            "category", "concern", "stock", "rating", "review_count",
            "image_url", "image_upload", "display_image",
            "deletion_status", "created_by", "updated_by",
            # ...any other existing fields...
        ]
        read_only_fields = ["deletion_status", "created_by", "updated_by", "rating", "review_count"]

    def validate(self, attrs):
        # At least one image source should be present for new products (not strictly required
        # for partial updates that don't touch the image at all).
        return attrs
```

**File**: `backend/api/views.py` — ensure `ProductViewSet` declares the parser classes needed for file upload:

```python
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class ProductViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # ...rest unchanged from Phase 19...
```

### 20.3 — Backend: Expose categories/concerns for the form dropdown

`GET /api/categories/` already exists per the README. Confirm it returns enough shape for a dropdown (`id`, `name`, `slug`) — if concerns are a separate model with their own list endpoint, confirm that endpoint's path too (search `views.py`/`urls.py` for `Concern`). If no dedicated `/api/concerns/` endpoint exists yet, add one mirroring the categories view exactly:

```python
# views.py
class ConcernListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Concern.objects.all()
    serializer_class = ConcernSerializer

# urls.py
path("concerns/", ConcernListView.as_view(), name="concern-list"),
```

### 20.4 — Frontend: API client for product CRUD (Manager-facing)

**File**: `frontend/src/lib/api/products.ts` (extend existing file — public product-fetching functions likely already live here)

```typescript
import { apiClient } from "@/lib/api/client";

export interface ProductFormPayload {
  name: string;
  price: string;
  description: string;
  category: number;
  concern?: number;
  stock: number;
  image_url?: string;
  image_upload?: File | null;
}

export interface ManagementProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  description: string;
  category: number;
  concern: number | null;
  stock: number;
  display_image: string;
  deletion_status: "active" | "pending_deletion" | "archived";
  created_by: number | null;
  updated_by: number | null;
}

function buildFormData(payload: ProductFormPayload): FormData {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("price", payload.price);
  form.append("description", payload.description);
  form.append("category", String(payload.category));
  if (payload.concern) form.append("concern", String(payload.concern));
  form.append("stock", String(payload.stock));
  if (payload.image_upload) {
    form.append("image_upload", payload.image_upload);
  } else if (payload.image_url) {
    form.append("image_url", payload.image_url);
  }
  return form;
}

export async function createProduct(payload: ProductFormPayload): Promise<ManagementProduct> {
  const form = buildFormData(payload);
  const response = await apiClient.post("/api/products/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function updateProduct(
  id: number,
  payload: ProductFormPayload
): Promise<ManagementProduct> {
  const form = buildFormData(payload);
  const response = await apiClient.patch(`/api/products/${id}/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function requestProductDeletion(id: number): Promise<void> {
  await apiClient.delete(`/api/products/${id}/`);
}

export async function fetchManagementProducts(params?: {
  deletion_status?: "active" | "pending_deletion" | "archived";
}): Promise<ManagementProduct[]> {
  const response = await apiClient.get("/api/manager/products/", { params });
  return response.data;
}

export async function fetchProductById(id: number): Promise<ManagementProduct> {
  const response = await apiClient.get(`/api/products/${id}/`);
  return response.data;
}
```

### 20.5 — Frontend: Product form component

**File**: `frontend/src/components/manager/ProductForm.tsx` (new directory `components/manager/` — mirrors the existing `components/product/`, `components/checkout/` pattern)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, ManagementProduct } from "@/lib/api/products";
import { fetchCategories, fetchConcerns } from "@/lib/api/catalog"; // adjust to actual existing function names

interface ProductFormProps {
  existingProduct?: ManagementProduct; // omit for "create" mode, pass for "edit" mode
}

type ImageInputMode = "url" | "file";

export function ProductForm({ existingProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(existingProduct);

  const [name, setName] = useState(existingProduct?.name ?? "");
  const [price, setPrice] = useState(existingProduct?.price ?? "");
  const [description, setDescription] = useState(existingProduct?.description ?? "");
  const [category, setCategory] = useState<number | "">(existingProduct?.category ?? "");
  const [concern, setConcern] = useState<number | "">(existingProduct?.concern ?? "");
  const [stock, setStock] = useState<number>(existingProduct?.stock ?? 0);

  const [imageMode, setImageMode] = useState<ImageInputMode>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingProduct?.display_image ?? null);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [concerns, setConcerns] = useState<{ id: number; name: string }[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchConcerns().then(setConcerns);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Only JPG, PNG, or WEBP files are allowed." }));
      return;
    }
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 5MB." }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: "" }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!price || Number(price) <= 0) newErrors.price = "Price must be greater than 0.";
    if (!category) newErrors.category = "Category is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!isEditMode && !imageUrl && !imageFile) {
      newErrors.image = "Provide an image URL or upload a file.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).every((k) => !newErrors[k]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name,
        price,
        description,
        category: category as number,
        concern: concern ? (concern as number) : undefined,
        stock,
        image_url: imageMode === "url" ? imageUrl : undefined,
        image_upload: imageMode === "file" ? imageFile : undefined,
      };

      if (isEditMode && existingProduct) {
        await updateProduct(existingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      router.push("/manager/products");
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        submit: err?.response?.data?.detail || "Something went wrong. Please try again.",
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Price (USD)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setImageMode("url")}
            className={`px-3 py-1 rounded text-sm ${imageMode === "url" ? "bg-black text-white" : "bg-neutral-100"}`}
          >
            Paste URL
          </button>
          <button
            type="button"
            onClick={() => setImageMode("file")}
            className={`px-3 py-1 rounded text-sm ${imageMode === "file" ? "bg-black text-white" : "bg-neutral-100"}`}
          >
            Upload File
          </button>
        </div>

        {imageMode === "url" ? (
          <input
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImagePreview(e.target.value || null);
            }}
            className="w-full border rounded px-3 py-2"
          />
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="w-full border rounded px-3 py-2"
          />
        )}

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-3 w-32 h-32 object-cover rounded border"
          />
        )}
        {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
        {/* AI-assist "Generate with AI" button is added here in Phase 21 — do not implement yet */}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type (Category)</label>
        <select
          value={category}
          onChange={(e) => setCategory(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Concern (optional)</label>
        <select
          value={concern}
          onChange={(e) => setConcern(e.target.value ? Number(e.target.value) : "")}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">None</option>
          {concerns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stock</label>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {submitting ? "Saving…" : isEditMode ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
```

> As with Phase 18's table, swap raw inputs/buttons for the project's existing Shadcn/ui `Input`, `Textarea`, `Select`, `Button` components once confirmed present — this code specifies field set, validation, and submission flow exactly; final styling should match `components/ui/`.

### 20.6 — Frontend: Pages

**File**: `frontend/src/app/manager/products/new/page.tsx`

```tsx
import { ProductForm } from "@/components/manager/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Add New Product</h1>
      <ProductForm />
    </div>
  );
}
```

**File**: `frontend/src/app/manager/products/[id]/edit/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/manager/ProductForm";
import { fetchProductById, ManagementProduct } from "@/lib/api/products";

export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<ManagementProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(params.id);
    fetchProductById(id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!product) return <div className="p-6">Product not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Product</h1>
      <ProductForm existingProduct={product} />
    </div>
  );
}
```

**File**: `frontend/src/app/manager/products/page.tsx` (list view)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchManagementProducts,
  requestProductDeletion,
  ManagementProduct,
} from "@/lib/api/products";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending_deletion: "bg-yellow-100 text-yellow-800",
  archived: "bg-neutral-200 text-neutral-600",
};

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<ManagementProduct[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchManagementProducts();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeleteRequest(id: number) {
    if (!confirm("Request deletion of this product? It will need Admin approval.")) return;
    await requestProductDeletion(id);
    await load();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-3">
          <Link href="/manager/products/bulk-upload" className="border rounded px-4 py-2">
            Bulk Upload
          </Link>
          <Link href="/manager/products/new" className="bg-black text-white rounded px-4 py-2">
            Add Product
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">
                  <img src={p.display_image} alt={p.name} className="w-12 h-12 object-cover rounded" />
                </td>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>{p.stock}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[p.deletion_status]}`}>
                    {p.deletion_status.replace("_", " ")}
                  </span>
                </td>
                <td className="flex gap-2">
                  <Link href={`/manager/products/${p.id}/edit`} className="text-blue-600">
                    Edit
                  </Link>
                  {p.deletion_status === "active" && (
                    <button onClick={() => handleDeleteRequest(p.id)} className="text-red-600">
                      Request Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### 20.7 — Frontend route guard

`/manager/*` accessible to `role in (manager, admin)`. If Phase 24's centralized guard exists, use it; otherwise apply the same inline-guard-with-TODO pattern from Phase 18.8, generalized:

```tsx
// app/manager/layout.tsx — temporary, until Phase 24/25 supply the real DashboardShell
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (role !== null && role !== "manager" && role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  return <>{children}</>;
  // TODO(Phase 24/25): wrap children in <DashboardShell role={role}> instead of a bare fragment.
}
```

### 20.8 — Tests

**File**: `frontend/playwright tests` — add `frontend/tests/manager-products.spec.ts` (confirm actual test directory naming convention by checking `playwright.config.ts`):

```typescript
import { test, expect } from "@playwright/test";
// Assumes existing test helpers for OTP-based login exist already (per documented E2E admin analytics verification) — reuse that helper, don't write a new login flow from scratch.
import { loginAs } from "./helpers/auth"; // adjust import to actual existing helper location

test("manager can create a product with an image URL", async ({ page }) => {
  await loginAs(page, "manager");
  await page.goto("/manager/products/new");
  await page.fill('input[type="text"]', "E2E Test Product");
  await page.fill('input[type="number"]', "19.99");
  await page.click("text=Paste URL");
  await page.fill('input[type="url"]', "https://example.com/test.jpg");
  await page.fill("textarea", "An E2E test product description.");
  await page.selectOption("select", { index: 1 });
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/manager/products");
  await expect(page.locator("text=E2E Test Product")).toBeVisible();
});

test("manager request-delete shows pending_deletion status, not removal", async ({ page }) => {
  await loginAs(page, "manager");
  await page.goto("/manager/products");
  await page.click("text=Request Delete >> nth=0");
  page.on("dialog", (dialog) => dialog.accept());
  await expect(page.locator("text=pending deletion")).toBeVisible();
});
```

### 20.9 — Phase 20 Acceptance Checklist

- [ ] `Product` supports both `image_url` and `image_upload`, `display_image` resolves correctly with upload taking priority.
- [ ] `MEDIA_URL`/`MEDIA_ROOT` configured, dev static serving wired in `urls.py`.
- [ ] `ProductViewSet` accepts `multipart/form-data`.
- [ ] `/manager/products/new`, `/manager/products/[id]/edit`, `/manager/products` all render and function against the real backend (not mocked).
- [ ] Client-side validation blocks bad submissions (missing fields, oversized/wrong-type images) before any network call.
- [ ] Manager's "Request Delete" action correctly produces `pending_deletion`, never an actual removal, and the row updates the badge without manual refresh.
- [ ] Route guard prevents Customer access to `/manager/*`.
## PHASE 21 — AI-Assisted Product Description Generation

**Depends on**: Phase 17, Phase 20 (form must exist for the button to attach to).

### 21.1 — Backend: Install SDK, configure env

**File**: `backend/requirements.txt` — add line:

```
anthropic>=0.40.0
```

```bash
cd backend
pip install -r requirements.txt --break-system-packages
```

**File**: `backend/.env.example` and `backend/.env` (the latter is gitignored — confirm via `.gitignore` before assuming, then add the real key only to the local `.env`, never commit it):

```
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-sonnet-4-6"
```

**File**: `backend/lilla_backend/settings.py`

```python
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
```

### 21.2 — Backend: Throttle class

**File**: `backend/api/throttling.py` (extend existing file — custom DRF throttles already live here per the README)

```python
from rest_framework.throttling import UserRateThrottle

class AIDescriptionGenerationThrottle(UserRateThrottle):
    scope = "ai_description_generation"
```

**File**: `backend/lilla_backend/settings.py` — add to the existing `DEFAULT_THROTTLE_RATES` dict (don't replace the dict, extend it):

```python
REST_FRAMEWORK = {
    # ...existing config...
    "DEFAULT_THROTTLE_RATES": {
        # ...existing rates (otp-request, otp-verify, etc.)...
        "ai_description_generation": "10/minute",
    },
}
```

### 21.3 — Backend: Generation endpoint

**File**: `backend/api/views.py`

```python
import anthropic
from django.conf import settings
from .permissions import IsManagerOrAdminRole
from .throttling import AIDescriptionGenerationThrottle

class GenerateProductDescriptionView(APIView):
    permission_classes = [IsManagerOrAdminRole]
    throttle_classes = [AIDescriptionGenerationThrottle]

    def post(self, request):
        name = request.data.get("name", "").strip()
        product_type = request.data.get("type", "").strip()
        concern = request.data.get("concern", "").strip()
        keywords = request.data.get("keywords", "").strip()

        if not name or not product_type:
            return Response(
                {"detail": "name and type are required to generate a description."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not settings.ANTHROPIC_API_KEY:
            return Response(
                {"detail": "AI description generation is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        prompt = (
            f"Write a concise, premium product description (2-4 sentences) for a cosmetic/skincare "
            f"e-commerce listing. Tone: elegant, minimalist, confident — not overly salesy.\n\n"
            f"Product name: {name}\n"
            f"Product type/category: {product_type}\n"
        )
        if concern:
            prompt += f"Targets skin concern: {concern}\n"
        if keywords:
            prompt += f"Incorporate these keywords naturally if relevant: {keywords}\n"
        prompt += "\nRespond with ONLY the description text. No preamble, no markdown, no quotation marks."

        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            generated_text = "".join(
                block.text for block in response.content if block.type == "text"
            ).strip()
        except anthropic.APIError as e:
            return Response(
                {"detail": "AI generation failed. Please write a description manually or try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Sanitize: strip markdown artifacts, cap length defensively
        generated_text = generated_text.replace("**", "").replace("##", "").strip()
        max_chars = 800
        if len(generated_text) > max_chars:
            generated_text = generated_text[:max_chars].rsplit(".", 1)[0] + "."

        return Response({"description": generated_text}, status=status.HTTP_200_OK)
```

**File**: `backend/api/urls.py`

```python
from .views import GenerateProductDescriptionView

urlpatterns = [
    # ...existing...
    path("manager/products/generate-description/", GenerateProductDescriptionView.as_view(), name="generate-product-description"),
]
```

### 21.4 — Backend: Tests (mock the Anthropic client — never hit the real API in CI)

**File**: `backend/api/test_ai_description.py` (new file)

```python
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from api.models import User


@override_settings(ANTHROPIC_API_KEY="test-key-for-mocking")
class GenerateDescriptionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="mgr", password="x", role="manager")
        self.customer = User.objects.create_user(username="cust", password="x", role="customer")

    @patch("api.views.anthropic.Anthropic")
    def test_manager_can_generate_description(self, mock_anthropic_cls):
        mock_block = MagicMock()
        mock_block.type = "text"
        mock_block.text = "A luminous serum crafted to hydrate and renew."
        mock_response = MagicMock()
        mock_response.content = [mock_block]
        mock_anthropic_cls.return_value.messages.create.return_value = mock_response

        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/manager/products/generate-description/",
            {"name": "Glow Serum", "type": "Skincare"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("description", response.data)
        self.assertTrue(len(response.data["description"]) > 0)

    def test_customer_forbidden(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            "/api/manager/products/generate-description/",
            {"name": "Glow Serum", "type": "Skincare"},
        )
        self.assertEqual(response.status_code, 403)

    def test_missing_required_fields_rejected(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post("/api/manager/products/generate-description/", {})
        self.assertEqual(response.status_code, 400)

    @patch("api.views.anthropic.Anthropic")
    def test_api_error_returns_graceful_502(self, mock_anthropic_cls):
        import anthropic as anthropic_module
        mock_anthropic_cls.return_value.messages.create.side_effect = anthropic_module.APIError(
            "boom", request=MagicMock(), body=None
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/manager/products/generate-description/",
            {"name": "Glow Serum", "type": "Skincare"},
        )
        self.assertEqual(response.status_code, 502)

    def test_unconfigured_api_key_returns_503(self):
        with self.settings(ANTHROPIC_API_KEY=""):
            self.client.force_authenticate(user=self.manager)
            response = self.client.post(
                "/api/manager/products/generate-description/",
                {"name": "Glow Serum", "type": "Skincare"},
            )
            self.assertEqual(response.status_code, 503)
```

Run: `python backend/manage.py test api.test_ai_description`

### 21.5 — Frontend: API client function

**File**: `frontend/src/lib/api/products.ts` (extend)

```typescript
export async function generateProductDescription(params: {
  name: string;
  type: string;
  concern?: string;
  keywords?: string;
}): Promise<string> {
  const response = await apiClient.post("/api/manager/products/generate-description/", params);
  return response.data.description;
}
```

### 21.6 — Frontend: Wire the "Generate with AI" button into `ProductForm.tsx`

**File**: `frontend/src/components/manager/ProductForm.tsx` — modify the Description field block from Phase 20:

```tsx
// Add near the top of the component, alongside other useState calls:
const [generating, setGenerating] = useState(false);
const [generationError, setGenerationError] = useState<string | null>(null);

// Add this handler inside the component:
async function handleGenerateDescription() {
  if (!name.trim() || !category) {
    setGenerationError("Enter a product name and select a category first.");
    return;
  }
  setGenerating(true);
  setGenerationError(null);
  try {
    const categoryName = categories.find((c) => c.id === category)?.name ?? "";
    const concernName = concerns.find((c) => c.id === concern)?.name ?? "";
    const result = await generateProductDescription({
      name,
      type: categoryName,
      concern: concernName || undefined,
    });
    setDescription(result);
  } catch (err: any) {
    setGenerationError(
      err?.response?.status === 503
        ? "AI generation isn't available right now. Please write a description manually."
        : "Generation failed. You can try again or write one manually."
    );
  } finally {
    setGenerating(false);
  }
}

// Replace the Description field JSX block with:
<div>
  <div className="flex justify-between items-center mb-1">
    <label className="block text-sm font-medium">Description</label>
    <button
      type="button"
      onClick={handleGenerateDescription}
      disabled={generating}
      className="text-sm text-purple-600 disabled:opacity-50"
    >
      {generating ? "Generating…" : description ? "✨ Regenerate with AI" : "✨ Generate with AI"}
    </button>
  </div>
  <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    rows={4}
    className="w-full border rounded px-3 py-2"
  />
  <div className="flex justify-between mt-1">
    {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
    <p className="text-xs text-neutral-500 ml-auto">{description.length} characters</p>
  </div>
  {generationError && <p className="text-amber-600 text-sm mt-1">{generationError}</p>}
</div>
```

### 21.7 — Phase 21 Acceptance Checklist

- [ ] `anthropic` SDK installed, key/model configured via env vars, never exposed client-side.
- [ ] Throttle limits generation to 10/minute per user.
- [ ] Endpoint validates required fields, handles missing API key (503) and upstream API errors (502) gracefully.
- [ ] Mocked tests pass without ever calling the real Anthropic API in CI.
- [ ] Frontend button populates the textarea, is fully editable afterward, never auto-submits the form.
- [ ] Failure states show an inline message; manual typing always remains possible regardless of AI availability.

---

## PHASE 22 — Bulk Product Upload (CSV / Spreadsheet)

**Depends on**: Phase 17, Phase 19, Phase 20.

### 22.1 — Backend: Confirm CSV/XLSX parsing library availability

Check `backend/requirements.txt` for `openpyxl` (likely already present if the project does any spreadsheet work — if not, add it):

```
openpyxl>=3.1.0
```

```bash
pip install -r requirements.txt --break-system-packages
```

Python's built-in `csv` module handles `.csv`; `openpyxl` handles `.xlsx`.

### 22.2 — Backend: Bulk upload endpoint

**File**: `backend/api/views.py`

```python
import csv
import io
from openpyxl import load_workbook
from django.db import transaction
from .permissions import IsManagerOrAdminRole

REQUIRED_COLUMNS = ["name", "price", "description", "type", "concern", "image_url", "stock"]
MAX_ROWS = 500
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


class BulkProductUploadView(APIView):
    permission_classes = [IsManagerOrAdminRole]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_file.size > MAX_FILE_SIZE_BYTES:
            return Response({"detail": "File exceeds 5MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        filename = uploaded_file.name.lower()
        rows = []

        try:
            if filename.endswith(".csv"):
                decoded = uploaded_file.read().decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(decoded))
                rows = list(reader)
            elif filename.endswith(".xlsx"):
                workbook = load_workbook(uploaded_file, read_only=True, data_only=True)
                sheet = workbook.active
                headers = [str(c.value).strip() if c.value else "" for c in next(sheet.iter_rows(max_row=1))]
                for row_cells in sheet.iter_rows(min_row=2):
                    row_values = [c.value for c in row_cells]
                    rows.append(dict(zip(headers, row_values)))
            else:
                return Response(
                    {"detail": "Unsupported file type. Upload a .csv or .xlsx file."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception:
            return Response(
                {"detail": "Could not parse the file. Please check the format and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(rows) == 0:
            return Response({"detail": "File contains no data rows."}, status=status.HTTP_400_BAD_REQUEST)
        if len(rows) > MAX_ROWS:
            return Response(
                {"detail": f"File contains {len(rows)} rows; max allowed is {MAX_ROWS}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        missing_cols = [c for c in REQUIRED_COLUMNS if c not in (rows[0].keys() if rows else [])]
        if missing_cols:
            return Response(
                {"detail": f"Missing required columns: {', '.join(missing_cols)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate every row BEFORE committing any (atomic all-or-nothing)
        row_results = []
        validated_rows = []
        has_errors = False

        for idx, row in enumerate(rows, start=2):  # row 1 is header
            row_errors = []
            name = (row.get("name") or "").strip()
            price_raw = row.get("price")
            category_slug = (row.get("type") or "").strip()
            concern_slug = (row.get("concern") or "").strip()
            description = (row.get("description") or "").strip()
            image_url = (row.get("image_url") or "").strip()
            stock_raw = row.get("stock")

            if not name:
                row_errors.append("name is required")
            try:
                price = float(price_raw)
                if price <= 0:
                    row_errors.append("price must be > 0")
            except (TypeError, ValueError):
                row_errors.append("price must be a number")
                price = None

            category = Category.objects.filter(slug=category_slug).first()
            if not category:
                row_errors.append(f"unknown category/type '{category_slug}'")

            concern = None
            if concern_slug:
                concern = Concern.objects.filter(slug=concern_slug).first()
                if not concern:
                    row_errors.append(f"unknown concern '{concern_slug}'")

            if not description:
                row_errors.append("description is required")

            try:
                stock = int(stock_raw)
                if stock < 0:
                    row_errors.append("stock cannot be negative")
            except (TypeError, ValueError):
                row_errors.append("stock must be a whole number")
                stock = None

            if image_url and not (image_url.startswith("http://") or image_url.startswith("https://")):
                row_errors.append("image_url must start with http:// or https://")

            if row_errors:
                has_errors = True
                row_results.append({"row": idx, "status": "error", "reason": "; ".join(row_errors)})
            else:
                validated_rows.append({
                    "row": idx, "name": name, "price": price, "description": description,
                    "category": category, "concern": concern, "image_url": image_url, "stock": stock,
                })

        if has_errors:
            # Atomic: report failures, create NOTHING
            for vr in validated_rows:
                row_results.append({"row": vr["row"], "status": "would_create_but_batch_failed"})
            row_results.sort(key=lambda r: r["row"])
            return Response(
                {
                    "detail": "Some rows failed validation. No products were created.",
                    "results": row_results,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_products = []
        with transaction.atomic():
            for vr in validated_rows:
                product = Product.objects.create(
                    name=vr["name"],
                    slug=slugify(vr["name"]) + f"-{get_random_string(6).lower()}",  # ensure uniqueness; confirm actual slug generation convention used elsewhere in the codebase and match it
                    price=vr["price"],
                    description=vr["description"],
                    category=vr["category"],
                    concern=vr["concern"],
                    image_url=vr["image_url"] or None,
                    stock=vr["stock"],
                    created_by=request.user,
                    updated_by=request.user,
                )
                created_products.append(product)
                row_results.append({"row": vr["row"], "status": "created", "product_id": product.id})

        row_results.sort(key=lambda r: r["row"])
        return Response(
            {
                "detail": f"{len(created_products)} products created.",
                "results": row_results,
            },
            status=status.HTTP_201_CREATED,
        )
```

> `slugify`/`get_random_string` imports: `from django.utils.text import slugify` and `from django.utils.crypto import get_random_string`. **Confirm the actual existing slug-generation convention** used by the manual product-create path (Phase 19/20) and reuse the exact same approach here rather than inventing a second slug strategy — consistency matters since both paths write to the same `slug` field with its own uniqueness constraint.

**File**: `backend/api/urls.py`

```python
from .views import BulkProductUploadView

urlpatterns = [
    # ...existing...
    path("manager/products/bulk-upload/", BulkProductUploadView.as_view(), name="bulk-product-upload"),
]
```

### 22.3 — Backend: Tests

**File**: `backend/api/test_bulk_upload.py` (new file)

```python
import io
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import User, Category, Product


class BulkProductUploadTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="mgr", password="x", role="manager")
        self.customer = User.objects.create_user(username="cust", password="x", role="customer")
        Category.objects.create(name="Skincare", slug="skincare")

    def _csv_file(self, content: str) -> SimpleUploadedFile:
        return SimpleUploadedFile("products.csv", content.encode("utf-8"), content_type="text/csv")

    def test_valid_csv_creates_all_rows(self):
        csv_content = (
            "name,price,description,type,concern,image_url,stock\n"
            "Test Serum,29.99,A great serum,skincare,,https://example.com/a.jpg,40\n"
            "Test Cream,19.99,A great cream,skincare,,https://example.com/b.jpg,25\n"
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/manager/products/bulk-upload/",
            {"file": self._csv_file(csv_content)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Product.objects.count(), 2)

    def test_one_invalid_row_fails_entire_batch(self):
        csv_content = (
            "name,price,description,type,concern,image_url,stock\n"
            "Good Product,29.99,A great product,skincare,,https://example.com/a.jpg,40\n"
            "Bad Product,-5,A bad product,skincare,,https://example.com/b.jpg,10\n"
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/manager/products/bulk-upload/",
            {"file": self._csv_file(csv_content)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Product.objects.count(), 0)  # nothing committed — atomic

    def test_unknown_category_rejected(self):
        csv_content = (
            "name,price,description,type,concern,image_url,stock\n"
            "Mystery Product,10.00,Desc,nonexistent-category,,https://example.com/a.jpg,5\n"
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/manager/products/bulk-upload/",
            {"file": self._csv_file(csv_content)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    def test_customer_forbidden(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            "/api/manager/products/bulk-upload/",
            {"file": self._csv_file("name,price,description,type,concern,image_url,stock\n")},
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)

    def test_missing_columns_rejected(self):
        csv_content = "name,price\nIncomplete Product,10.00\n"
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/manager/products/bulk-upload/",
            {"file": self._csv_file(csv_content)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
```

Run: `python backend/manage.py test api.test_bulk_upload`

### 22.4 — Frontend: API client function

**File**: `frontend/src/lib/api/products.ts` (extend)

```typescript
export interface BulkUploadRowResult {
  row: number;
  status: "created" | "error";
  product_id?: number;
  reason?: string;
}

export interface BulkUploadResponse {
  detail: string;
  results: BulkUploadRowResult[];
}

export async function bulkUploadProducts(file: File): Promise<BulkUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await apiClient.post("/api/manager/products/bulk-upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
```

### 22.5 — Frontend: Bulk upload page

**File**: `frontend/src/app/manager/products/bulk-upload/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { bulkUploadProducts, BulkUploadResponse } from "@/lib/api/products";

const CSV_TEMPLATE = `name,price,description,type,concern,image_url,stock
Example Hydrating Serum,29.99,A lightweight serum that deeply hydrates and restores skin barrier function.,skincare,dryness,https://example.com/serum.jpg,50`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lilla-product-upload-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const response = await bulkUploadProducts(file);
      setResult(response);
    } catch (err: any) {
      if (err?.response?.data) {
        setResult(err.response.data); // backend returns structured row errors even on 400
      } else {
        setError("Upload failed. Please check your connection and try again.");
      }
    } finally {
      setUploading(false);
    }
  }

  const successCount = result?.results.filter((r) => r.status === "created").length ?? 0;
  const errorCount = result?.results.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Bulk Upload Products</h1>
        <Link href="/manager/products" className="text-sm underline">
          Back to Products
        </Link>
      </div>

      <button onClick={downloadTemplate} className="border rounded px-4 py-2 mb-6 text-sm">
        Download CSV Template
      </button>

      <div className="border-2 border-dashed rounded p-8 text-center mb-4">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-3"
        />
        {file && <p className="text-sm text-neutral-600">{file.name}</p>}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-6">
          <p className="font-medium mb-2">
            {successCount} created, {errorCount} failed
          </p>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1">Row</th>
                <th>Status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.row} className="border-b">
                  <td className="py-1">{r.row}</td>
                  <td>
                    <span className={r.status === "created" ? "text-green-700" : "text-red-700"}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.status === "created" ? `Product #${r.product_id}` : r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### 22.6 — Phase 22 Acceptance Checklist

- [ ] Endpoint parses both `.csv` and `.xlsx`, enforces row/size caps, validates every row before committing any (true atomicity — confirmed by test).
- [ ] Unknown category/concern slugs are caught with a clear per-row reason.
- [ ] Slug generation for bulk-created products reuses the same convention as manual creation (no divergent uniqueness scheme).
- [ ] Frontend: template download, drag/pick file, upload, and a clear per-row results table all work against the real endpoint.
- [ ] Customer/unauthenticated requests forbidden (403).
- [ ] Full test suite green.
## PHASE 23 — Manager Insights Dashboard (Catalog & Inventory Only)

**Depends on**: Phase 17, Phase 19. **Must be implemented as a separate endpoint from `/api/admin/analytics/` — see 23.1's explicit warning.**

### 23.1 — Backend: Why this is a new view, not a gated version of the existing one

**Do not** open the existing `/api/admin/analytics/` view and add an `if request.user.role == "manager": filter out revenue fields` branch. That pattern is fragile — the next time someone extends that view to add a new financial metric, there's nothing stopping it from silently appearing in the Manager-facing response too. Instead, write a fully independent view whose queryset **never touches** `Order`, `Payment`, or any revenue-adjacent model at all, so a financial-data leak is structurally impossible rather than policy-prevented.

### 23.2 — Backend: Insights endpoint

**File**: `backend/api/views.py`

```python
from django.db.models import Avg, Count, Q
from .permissions import IsManagerOrAdminRole

LOW_STOCK_THRESHOLD = 10  # confirm/adjust against any existing stock-alert convention already in StockAdjustment logic

class ManagerInsightsView(APIView):
    permission_classes = [IsManagerOrAdminRole]

    def get(self, request):
        all_products = Product.objects.all()

        total_active = all_products.filter(deletion_status="active").count()
        total_pending_deletion = all_products.filter(deletion_status="pending_deletion").count()
        total_archived = all_products.filter(deletion_status="archived").count()

        low_stock_products = (
            all_products.filter(deletion_status__in=["active", "pending_deletion"], stock__lt=LOW_STOCK_THRESHOLD)
            .order_by("stock")
            .values("id", "name", "slug", "stock")[:20]
        )

        top_rated = (
            all_products.filter(deletion_status="active", review_count__gt=0)
            .order_by("-rating")
            .values("id", "name", "slug", "rating", "review_count")[:5]
        )

        lowest_rated = (
            all_products.filter(deletion_status="active", review_count__gt=0)
            .order_by("rating")
            .values("id", "name", "slug", "rating", "review_count")[:5]
        )

        zero_review_products = (
            all_products.filter(deletion_status="active", review_count=0)
            .values("id", "name", "slug")[:20]
        )

        category_distribution = list(
            all_products.filter(deletion_status="active")
            .values("category__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        recent_stock_adjustments = list(
            StockAdjustment.objects.select_related("product", "adjusted_by")
            .order_by("-timestamp")[:10]
            .values("product__name", "previous_stock", "new_stock", "adjusted_by__username", "timestamp")
        )

        return Response({
            "catalog_summary": {
                "active": total_active,
                "pending_deletion": total_pending_deletion,
                "archived": total_archived,
            },
            "low_stock_products": list(low_stock_products),
            "top_rated_products": list(top_rated),
            "lowest_rated_products": list(lowest_rated),
            "zero_review_products": list(zero_review_products),
            "category_distribution": category_distribution,
            "recent_stock_adjustments": recent_stock_adjustments,
        })
```

> Field names `rating`, `review_count`, and the exact shape of `StockAdjustment` (its field names — `previous_stock`/`new_stock`/`adjusted_by`/`timestamp` are best guesses based on the README's description of "Stock Audit Trails") must be confirmed against the real model before this code will run. Open `backend/api/models.py` and adjust field names in this view to match exactly.

**File**: `backend/api/urls.py`

```python
from .views import ManagerInsightsView

urlpatterns = [
    # ...existing...
    path("manager/insights/", ManagerInsightsView.as_view(), name="manager-insights"),
]
```

### 23.3 — Backend: Field-allowlist test (the structural leak-prevention test)

**File**: `backend/api/test_manager_insights.py` (new file)

```python
from django.test import TestCase
from rest_framework.test import APIClient
from api.models import User, Product, Category

# Any key appearing in the response that even loosely suggests financial/order data
# must trigger a hard test failure — this test exists specifically to catch future
# accidental field additions, not just today's correctly-scoped implementation.
FORBIDDEN_KEY_SUBSTRINGS = ["revenue", "order", "payment", "total_sales", "price_paid", "transaction"]


class ManagerInsightsLeakPreventionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="mgr", password="x", role="manager")
        self.customer = User.objects.create_user(username="cust", password="x", role="customer")
        category = Category.objects.create(name="Skincare", slug="skincare")
        Product.objects.create(name="P1", slug="p1", price=10, category=category, stock=2, description="d")

    def _flatten_keys(self, obj, keys=None):
        if keys is None:
            keys = set()
        if isinstance(obj, dict):
            for k, v in obj.items():
                keys.add(k.lower())
                self._flatten_keys(v, keys)
        elif isinstance(obj, list):
            for item in obj:
                self._flatten_keys(item, keys)
        return keys

    def test_response_contains_no_financial_fields(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/manager/insights/")
        self.assertEqual(response.status_code, 200)
        all_keys = self._flatten_keys(response.data)
        for forbidden in FORBIDDEN_KEY_SUBSTRINGS:
            matching = [k for k in all_keys if forbidden in k]
            self.assertEqual(
                matching, [],
                f"Forbidden financial-adjacent key(s) found in Manager insights response: {matching}",
            )

    def test_customer_forbidden(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/manager/insights/")
        self.assertEqual(response.status_code, 403)

    def test_low_stock_product_appears(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/manager/insights/")
        names = [p["name"] for p in response.data["low_stock_products"]]
        self.assertIn("P1", names)
```

Run: `python backend/manage.py test api.test_manager_insights`

### 23.4 — Frontend: API client

**File**: `frontend/src/lib/api/manager.ts` (new file)

```typescript
import { apiClient } from "@/lib/api/client";

export interface ManagerInsights {
  catalog_summary: { active: number; pending_deletion: number; archived: number };
  low_stock_products: { id: number; name: string; slug: string; stock: number }[];
  top_rated_products: { id: number; name: string; slug: string; rating: number; review_count: number }[];
  lowest_rated_products: { id: number; name: string; slug: string; rating: number; review_count: number }[];
  zero_review_products: { id: number; name: string; slug: string }[];
  category_distribution: { category__name: string; count: number }[];
  recent_stock_adjustments: {
    product__name: string;
    previous_stock: number;
    new_stock: number;
    adjusted_by__username: string;
    timestamp: string;
  }[];
}

export async function fetchManagerInsights(): Promise<ManagerInsights> {
  const response = await apiClient.get("/api/manager/insights/");
  return response.data;
}
```

### 23.5 — Frontend: Dashboard page

**File**: `frontend/src/app/manager/dashboard/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchManagerInsights, ManagerInsights } from "@/lib/api/manager";

export default function ManagerDashboardPage() {
  const [insights, setInsights] = useState<ManagerInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerInsights()
      .then(setInsights)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading dashboard…</div>;
  if (!insights) return <div className="p-6">Could not load insights.</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Manager Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <p className="text-sm text-neutral-500">Active Products</p>
          <p className="text-3xl font-semibold">{insights.catalog_summary.active}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-neutral-500">Pending Deletion</p>
          <p className="text-3xl font-semibold">{insights.catalog_summary.pending_deletion}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-neutral-500">Archived</p>
          <p className="text-3xl font-semibold">{insights.catalog_summary.archived}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">⚠️ Needs Attention</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Low Stock</h3>
            <ul className="space-y-1">
              {insights.low_stock_products.map((p) => (
                <li key={p.id} className="flex justify-between text-sm border-b py-1">
                  <Link href={`/manager/products/${p.id}/edit`} className="underline">{p.name}</Link>
                  <span className="text-red-600">{p.stock} left</span>
                </li>
              ))}
              {insights.low_stock_products.length === 0 && (
                <p className="text-sm text-neutral-400">All products well-stocked.</p>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-600 mb-2">No Reviews Yet</h3>
            <ul className="space-y-1">
              {insights.zero_review_products.map((p) => (
                <li key={p.id} className="text-sm border-b py-1">
                  <Link href={`/manager/products/${p.id}/edit`} className="underline">{p.name}</Link>
                </li>
              ))}
              {insights.zero_review_products.length === 0 && (
                <p className="text-sm text-neutral-400">All products have at least one review.</p>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Rating Highlights</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Top Rated</h3>
            {insights.top_rated_products.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b py-1">
                <span>{p.name}</span>
                <span>⭐ {p.rating.toFixed(1)} ({p.review_count})</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-600 mb-2">Lowest Rated</h3>
            {insights.lowest_rated_products.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b py-1">
                <span>{p.name}</span>
                <span>⭐ {p.rating.toFixed(1)} ({p.review_count})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Catalog Composition</h2>
        <div className="space-y-1">
          {insights.category_distribution.map((c) => (
            <div key={c.category__name} className="flex justify-between text-sm border-b py-1">
              <span>{c.category__name}</span>
              <span>{c.count} products</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

> Bar/pie charts for `category_distribution` and rating highlights should use Recharts (already an available library in this environment / likely already a dependency given the existing Admin analytics dashboard) instead of the plain list rendering above, once the agent confirms Recharts is already imported elsewhere in the project (check `frontend/src/app/admin/` analytics page for the existing chart pattern and mirror it exactly for visual consistency).

### 23.6 — Phase 23 Acceptance Checklist

- [ ] `ManagerInsightsView` queryset never touches Order/Payment models — confirmed by the allowlist test in 23.3.
- [ ] Response includes catalog summary, low-stock list, rating highlights, zero-review list, category distribution, recent stock adjustments.
- [ ] Customer forbidden (403); Manager and Admin both succeed.
- [ ] Frontend dashboard renders all sections against the real endpoint, with working links into the product edit page.

---

## PHASE 24 — Frontend Role-Based Routing, Navigation & Guards (Integration Phase)

**Depends on**: Phases 17–23 all complete. This phase is the seam that ties everything together and is also explicitly extended/reused by Phase 25's dashboard shell — read Phase 25 before finalizing this phase's guard implementation, since Phase 25 will consume it directly.

### 24.1 — Frontend: Centralized role guard

**File**: `frontend/src/lib/auth/withRoleGuard.tsx` (new file — this supersedes every inline guard written ad-hoc in Phases 18/20; go back and replace those with this centralized version once it exists)

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserRole } from "@/lib/types";

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const hydrated = useAuthStore((s) => s.hydrated); // confirm this flag exists on the store; if not, add one set to true once initial auth state has been restored from storage/token, to avoid redirecting before we actually know the role

  useEffect(() => {
    if (!hydrated) return; // wait until we actually know the role before deciding to redirect
    if (role === null || !allowedRoles.includes(role)) {
      router.replace("/");
    }
  }, [role, hydrated, allowedRoles, router]);
}

// HOC variant for wrapping page components directly:
export function withRoleGuard<P extends object>(allowedRoles: UserRole[]) {
  return function (Component: React.ComponentType<P>) {
    return function GuardedComponent(props: P) {
      useRoleGuard(allowedRoles);
      return <Component {...props} />;
    };
  };
}
```

> If `useAuthStore` doesn't currently have a `hydrated` boolean, add one: set to `false` initially, flipped to `true` once the store's initialization effect (the one that reads a stored refresh token / decodes the JWT on app mount) completes — this prevents a flash-redirect to `/` for a Manager whose role hasn't loaded yet on a hard page refresh.

### 24.2 — Frontend: Apply guard via Next.js layout files

**File**: `frontend/src/app/admin/layout.tsx`

```tsx
"use client";
import { useRoleGuard } from "@/lib/auth/withRoleGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(["admin"]);
  return <>{children}</>;
  // Phase 25 replaces this fragment with <DashboardShell role="admin">{children}</DashboardShell>
}
```

**File**: `frontend/src/app/manager/layout.tsx`

```tsx
"use client";
import { useRoleGuard } from "@/lib/auth/withRoleGuard";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(["manager", "admin"]);
  return <>{children}</>;
  // Phase 25 replaces this fragment with <DashboardShell role={role}>{children}</DashboardShell>
}
```

Remove/replace any inline ad-hoc guards written during Phases 18/20 (the `useAdminGuard`/`ManagerLayout` snippets marked `TODO(Phase 24)` in those phases) with imports of this centralized hook instead, so there is exactly one source of truth for route gating.

### 24.3 — Frontend: Unauthorized redirect UX (toast instead of silent/blank)

**File**: `frontend/src/lib/auth/withRoleGuard.tsx` — extend the redirect to carry a reason, consumed by whatever toast system the project already uses (check for `sonner`, `react-hot-toast`, or a custom `useToast` hook — search `components/` for existing toast usage before introducing a new library):

```tsx
import { toast } from "sonner"; // adjust import to actual existing toast library

useEffect(() => {
  if (!hydrated) return;
  if (role === null || !allowedRoles.includes(role)) {
    toast.error("You don't have access to that page.");
    router.replace("/");
  }
}, [role, hydrated, allowedRoles, router]);
```

### 24.4 — Frontend: Navbar role-aware links

**File**: `frontend/src/components/layout/Navbar.tsx` (existing file per the documented directory structure) — find the account dropdown/menu section and extend it:

```tsx
// Inside the existing account dropdown menu JSX, alongside existing links (Profile, Orders, Logout):
{(role === "manager" || role === "admin") && (
  <Link href="/manager/dashboard" className="block px-4 py-2 text-sm hover:bg-neutral-100">
    Manager Dashboard
  </Link>
)}
{role === "admin" && (
  <Link href="/admin/dashboard" className="block px-4 py-2 text-sm hover:bg-neutral-100">
    Admin Panel
  </Link>
)}
```

Add a small role badge next to the username, also inside the existing account menu header:

```tsx
{role && role !== "customer" && (
  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-neutral-200 capitalize">{role}</span>
)}
```

> Confirm `role` is already available in this component's scope (likely via the same `useAuthStore` hook used elsewhere) — if `Navbar.tsx` doesn't currently subscribe to the auth store at all, add `const role = useAuthStore((s) => s.role);` near its other store subscriptions.

### 24.5 — Frontend: E2E tests covering all three roles

**File**: `frontend/tests/role-routing.spec.ts` (new file)

```typescript
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("customer cannot reach /manager or /admin", async ({ page }) => {
  await loginAs(page, "customer");
  await page.goto("/manager/dashboard");
  await expect(page).toHaveURL("/");
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL("/");
});

test("manager can reach /manager but not /admin", async ({ page }) => {
  await loginAs(page, "manager");
  await page.goto("/manager/dashboard");
  await expect(page).toHaveURL("/manager/dashboard");
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL("/");
});

test("admin can reach both /manager and /admin", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/manager/dashboard");
  await expect(page).toHaveURL("/manager/dashboard");
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL("/admin/dashboard");
});

test("navbar shows correct role-specific links", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/");
  await page.click('[data-testid="account-menu"]'); // adjust selector to actual existing Navbar test id
  await expect(page.locator("text=Manager Dashboard")).toBeVisible();
  await expect(page.locator("text=Admin Panel")).toBeVisible();
});
```

> If `loginAs(page, role)` doesn't already exist as a test helper, it must be created here: it should perform the actual OTP login flow against a seeded test user of the given role (reuse whatever the existing Admin-analytics E2E verification helper does, per the README's documented "programmatic admin login via OTP" — generalize it to accept a role parameter rather than writing a new one from scratch).

### 24.6 — Phase 24 Acceptance Checklist

- [ ] One centralized `useRoleGuard`/`withRoleGuard` — all Phase 18/20 inline guards removed and replaced with it.
- [ ] Guard waits for store hydration before redirecting (no flash-redirect on refresh).
- [ ] Unauthorized access shows a toast and redirects to `/`, never a blank/error page.
- [ ] Navbar conditionally shows Manager Dashboard / Admin Panel links and a role badge.
- [ ] E2E suite confirms all three roles' access boundaries and navbar content.
- [ ] Full backend + frontend test suites green.

---

## 📋 Master Summary Table

| Phase | Focus | Key New Files | Depends On |
|---|---|---|---|
| 17 | Role field, permissions, JWT claims | `permissions.py`, migration | — |
| 18 | Admin: promote/demote users to Manager | `RoleChangeLog` model, `/admin/users` page | 17 |
| 19 | Manager product CRUD backend + soft-delete | `deletion_status` field, `ManagementProductListView` | 17 |
| 20 | Manager product form UI | `ProductForm.tsx`, image upload wiring | 17, 19 |
| 21 | AI-generated product descriptions | `GenerateProductDescriptionView` | 20 |
| 22 | Bulk CSV/spreadsheet product upload | `BulkProductUploadView` | 19, 20 |
| 23 | Manager insights dashboard | `ManagerInsightsView` (no Order/Payment access) | 17, 19 |
| 24 | Role-based routing, nav, guards | `withRoleGuard.tsx` | 17–23 |

## Final Notes for the Implementing Agent

- Preserve all existing Admin capabilities throughout — Admin is always a strict superset of Manager, never a separate narrower path.
- Run `python backend/manage.py test api` after every single phase. A red suite blocks progression to the next phase.
- Do not implement Phase 25 (post-login redirect + dashboard shell) as part of this document — it is a separate companion tasksheet that explicitly depends on this one and should be read on its own.

from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_role(user):
    """Safely retrieve the application role for a user.

    Returns 'customer' as a safe default if the profile doesn't exist yet
    (e.g. during tests where UserProfile wasn't created).
    """
    try:
        return user.userprofile.role
    except Exception:
        return "customer"


class IsAdminRole(BasePermission):
    """Allow access only to users with role='admin'."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_role(request.user) == "admin"
        )


class IsManagerOrAdminRole(BasePermission):
    """Allow access to users with role='manager' or role='admin'."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_role(request.user) in ("manager", "admin")
        )


class IsAdminRoleForDestroy(BasePermission):
    """
    Allow manager and admin for safe methods, POST, PUT, PATCH.
    Restrict DELETE to admin only.

    Used on ProductViewSet so Managers can create/edit products but
    cannot hard-delete them — Manager-initiated deletes are soft (pending_deletion).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            # Unauthenticated users may only use safe methods
            return request.method in SAFE_METHODS

        role = get_role(request.user)

        if request.method in SAFE_METHODS:
            return True

        if request.method == "DELETE":
            # Both manager and admin can call DELETE on the viewset;
            # the viewset's destroy() overrides the *behaviour* based on role.
            # We allow the request through here so the view can apply the
            # soft-delete vs hard-delete logic itself.
            return role in ("manager", "admin")

        # POST / PUT / PATCH — manager or admin
        return role in ("manager", "admin")

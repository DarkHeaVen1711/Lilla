# LILLA — Post-Login Role Routing & Dedicated Dashboard Shells
## EXHAUSTIVE Implementation Tasksheet — Phase 25

**This is the detailed companion to the higher-level Phase 25 tasksheet produced earlier in this conversation.** It is a direct continuation of the exhaustive Phase 17–24 document — **Phase 17 is a hard dependency** (the `role` field, JWT claims, and auth store fields it establishes are used throughout this document verbatim). Phases 18 and 23 supply the *content* of the Admin and Manager dashboards respectively; if those phases aren't done yet when this one is implemented, this document specifies exact placeholder pages so the shell/routing work can still be built and tested end-to-end without blocking on them.

### How to use this document

Same conventions as the Phase 17–24 document: confirm exact existing file/field/component names against the real repo before editing, code blocks are implementation-ready but assume certain existing conventions that must be verified, and Shadcn/ui primitives should replace raw HTML wherever available.

---

## Problem Being Fixed

Today, regardless of role, login lands every user on the customer storefront (`/`). There is no redirect logic tied to role, and Manager has no dedicated landing page at all. This phase fixes:

1. **Customer** → still lands on `/` (unchanged).
2. **Manager** → lands on `/manager/dashboard`, inside a new sidebar dashboard shell.
3. **Admin** → lands on `/admin/dashboard`, inside the same shell (with a fuller nav set).

Both Manager and Admin retain full ability to browse the storefront on demand — they are never locked out — but their **default landing point** after login (and after a fresh page load while already authenticated) is their dashboard.

---

## PART A — Backend: Confirm Login Response Carries Role

### A.1 — Verify the OTP-verify endpoint response shape

**File**: `backend/api/views.py` — locate the view backing `POST /api/auth/verify-otp/`.

This phase requires **no new backend code** if Phase 17.4 (JWT claim injection) was implemented correctly — `role` should already be embedded in the access token's payload. This section is a verification gate, not new work.

**Verification procedure** (run this manually, document the result in the PR/commit message):

```bash
cd backend
python manage.py shell
```

```python
from api.models import User
from api.serializers import get_tokens_for_user  # adjust import to actual Phase 17.4 location
from rest_framework_simplejwt.tokens import AccessToken

user = User.objects.create_user(username="verify_test", password="x", role="manager")
tokens = get_tokens_for_user(user)
decoded = AccessToken(tokens["access"])
print(decoded.payload)
# Must include: {'role': 'manager', ...other standard JWT claims...}
```

If `role` is missing from `decoded.payload`, **stop and fix Phase 17.4 before continuing** — every part of this document assumes the frontend can decode `role` directly from the access token without an extra API round-trip.

### A.2 — Confirm `verify-otp` response body (belt-and-suspenders)

Some frontend implementations prefer reading `role` directly from the JSON response body rather than decoding the JWT, especially for the very first redirect decision right after login (decoding a token the instant it arrives is fine, but it's worth confirming the response body also exposes it redundantly, since it's cheap insurance against any JWT-decode timing bug).

**File**: `backend/api/views.py` — find the `verify-otp` view's response construction:

```python
# Wherever this view currently returns:
# return Response({"access": tokens["access"], "refresh": tokens["refresh"]})
#
# Change to:
return Response({
    "access": tokens["access"],
    "refresh": tokens["refresh"],
    "role": user.role,  # ADD THIS — redundant with the JWT claim, but removes any decode-timing race on first login
    "user": {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
    },
})
```

> If the existing response already includes a nested `user` object (likely, since the frontend needs basic profile info immediately after login), just confirm `role` is one of its fields — don't create a duplicate `user` key structure if one already exists with a different shape. Match the existing shape and only add the missing `role` field to it.

### A.3 — Test

**File**: `backend/api/test_roles.py` (extend from Phase 17's file)

```python
class VerifyOTPRoleInResponseTest(TestCase):
    def test_verify_otp_response_includes_role(self):
        # Adapt to however the existing OTP test suite triggers a full request->verify flow
        # (likely api/test_integration.py has the canonical pattern — mirror it here).
        from api.models import User
        user = User.objects.create_user(username="otptest", password="x", role="admin", email="otp@example.com")
        # ... reuse existing OTP-request/verify test helper to actually call the endpoint ...
        # Assert response.data["role"] == "admin" and/or response.data["user"]["role"] == "admin"
        pass  # implement using the project's actual existing OTP test fixture/helper, do not hand-roll OTP generation logic here
```

> This test is intentionally left as a stub with instructions rather than fabricated OTP logic — the real OTP flow (cache-based 6-digit codes per the README) has specific existing test helpers in `api/test_integration.py` that must be reused rather than reinvented. Open that file, find the helper that completes a full request→verify cycle, and call it here with a `role="admin"` (or `manager`) seeded user, then assert on the response shape from A.2.

---

## PART B — Frontend: Centralized Post-Login Redirect Logic

### B.1 — Auth store: add `hydrated` flag and role-derivation on every token-set path

**File**: `frontend/src/store/useAuthStore.ts` (or wherever the Zustand auth slice lives — confirmed location from Phase 17.9)

```typescript
import { create } from "zustand";
import { jwtDecode } from "jwt-decode"; // confirm actual existing import — may already be used by the silent-refresh feature
import type { User, UserRole } from "@/lib/types";

interface DecodedAccessToken {
  user_id: number;
  exp: number;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isManagerOrAdmin: boolean;
  hydrated: boolean; // NEW — true once initial session restore (or determination there is none) has completed

  setTokens: (access: string, refresh: string, userPayload?: Partial<User>) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>; // NEW — called once on app mount
}

function deriveRoleFlags(role: UserRole | null) {
  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isManagerOrAdmin: role === "manager" || role === "admin",
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  isAdmin: false,
  isManager: false,
  isManagerOrAdmin: false,
  hydrated: false,

  setTokens: (access, refresh, userPayload) => {
    const decoded = jwtDecode<DecodedAccessToken>(access);
    set({
      accessToken: access,
      refreshToken: refresh,
      user: userPayload ? ({ ...get().user, ...userPayload } as User) : get().user,
      ...deriveRoleFlags(decoded.role),
    });
  },

  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      ...deriveRoleFlags(null),
    });
  },

  hydrate: async () => {
    // This must run exactly once on app mount. Confirm against the EXISTING session-restore
    // logic (the silent token refresh feature already documented in the README implies this
    // already exists somewhere — likely an effect in a top-level AuthProvider, or logic inside
    // this store itself triggered from app/layout.tsx). DO NOT write a second, parallel restore
    // mechanism — find the existing one and add the `hydrated: true` flip at its end, plus the
    // same `deriveRoleFlags` call this function shows, so role/hydrated end up correctly set
    // through whatever path already exists for restoring a session from a stored refresh token.
    const storedRefreshToken = get().refreshToken; // or wherever it's actually persisted — confirm storage mechanism
    if (!storedRefreshToken) {
      set({ hydrated: true });
      return;
    }
    try {
      // ...call the existing token-refresh endpoint/logic here, reusing whatever function
      // already performs this for the silent-refresh feature...
      // On success: call get().setTokens(newAccess, newRefresh) as above.
    } catch {
      get().clearAuth();
    } finally {
      set({ hydrated: true });
    }
  },
}));
```

**Critical wiring instruction**: this store almost certainly already has logic that restores a session on app load (per the README's "Client-Side Silent Token Refresh" feature, which "seamlessly schedules access-token rotation... on protected routes via server-side middleware and custom API proxy client fetch wrappers"). **Do not write a brand-new restore mechanism that duplicates or races against the existing one.** Instead:

1. Find the existing mount-time session-restore code (likely in `frontend/src/components/providers/AuthProvider.tsx` or similar, given the README's documented `providers/` directory).
2. Add `role` derivation (via `deriveRoleFlags`, matching the pattern above) to whatever point that existing code currently sets `user`/`accessToken`.
3. Add the `hydrated` boolean to the store, flipped to `true` at the end of that existing restore flow (success OR failure/no-session) — not as a separate competing flow.

### B.2 — Login success handler: redirect by role

**File**: locate the component/hook that currently handles a successful `verify-otp` response — likely inside `frontend/src/components/auth/AuthModal.tsx` (documented in the README as the accessibility-hardened login modal) or a `useLogin`/`useAuth` hook it calls into.

```tsx
// Inside the existing verify-otp success handler, wherever tokens are currently
// passed to the auth store (e.g. after a successful axios call to /api/auth/verify-otp/):

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

// ...inside the component/hook, after receiving a successful verify-otp response:
const router = useRouter();
const setTokens = useAuthStore((s) => s.setTokens);

function handleVerifyOtpSuccess(response: {
  access: string;
  refresh: string;
  role: "customer" | "manager" | "admin";
  user: { id: number; username: string; email: string; role: string };
}) {
  setTokens(response.access, response.refresh, response.user);

  // Close the auth modal here if this is inside AuthModal — preserve whatever
  // existing close/dismiss logic already runs on successful login.

  if (response.role === "manager") {
    router.push("/manager/dashboard");
  } else if (response.role === "admin") {
    router.push("/admin/dashboard");
  }
  // customer: no redirect — let the existing post-login behavior stand (closes
  // modal, stays on current page, or whatever today's customer flow already does).
}
```

> **Important nuance**: if a Customer is logging in *mid-checkout* or from some other specific page (e.g. they opened the AuthModal from the cart sidebar to complete a purchase), the existing flow almost certainly already handles "stay where you are" or "resume the cached action" — per the README's documented "Guest Interceptor (Frozen Intents)" feature. **Do not change Customer post-login behavior at all.** This phase's redirect logic is additive — it only fires for `manager`/`admin`, leaving every existing Customer login code path completely untouched.

### B.3 — Mount-time redirect for already-authenticated sessions

**File**: `frontend/src/components/providers/AuthProvider.tsx` (or wherever `hydrate()` from B.1 is actually called — likely inside this provider's mount effect, or the root `frontend/src/app/layout.tsx` if there's no separate provider component)

```tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const DASHBOARD_PATHS_BY_ROLE: Record<string, string> = {
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedOnLoad = useRef(false);

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (hasRedirectedOnLoad.current) return; // ONLY ever fire this once per full page load — see note below
    hasRedirectedOnLoad.current = true;

    const targetPath = role ? DASHBOARD_PATHS_BY_ROLE[role] : undefined;
    // Only redirect if the Manager/Admin is sitting on the bare storefront homepage
    // on a fresh load — NOT if they've deliberately navigated anywhere else (including
    // deeper into the storefront, e.g. /shop or /products/some-slug, which they're
    // explicitly allowed to browse per the product decision). This is intentionally
    // narrow: only "/" triggers the redirect, so a hard refresh while already on
    // /manager/products, for instance, does NOT bounce them back to the dashboard root.
    if (targetPath && pathname === "/") {
      router.replace(targetPath);
    }
  }, [hydrated, role, pathname, router]);

  return <>{children}</>;
}
```

**Why `hasRedirectedOnLoad` is a `ref` and not a dependency-driven effect**: this must fire **at most once** per full page load/mount — if it were re-evaluated every time `pathname` changes (which it naturally would if `pathname` is a dependency without the ref guard), a Manager clicking "Shop" from their dashboard, landing on `/shop`, then later navigating back to `/` to browse the homepage like a customer would get yanked back to `/manager/dashboard` every single time they land on `/` — which directly violates the "they can browse like a customer" requirement. The ref ensures this is a one-shot check tied to the initial hydration of a fresh page load, not a persistent guard.

**Wiring point — confirm `AuthProvider` (or equivalent) is actually mounted**: search `frontend/src/app/layout.tsx` for whatever currently wraps the app in providers (Zustand persistence, Stripe Elements provider, Sentry, etc. are all documented as existing). If an `AuthProvider` component doesn't exist yet as a distinct component, this logic can live directly inside whichever existing top-level provider already calls the session-restore logic from B.1 — don't create a second provider wrapper if an equivalent one already exists; extend it instead.

### B.4 — "Back to Store" link inside the dashboard shell

Specified in Part C.3 below (the sidebar nav itself) — listed here only as a cross-reference so it's clear this is the *discoverable* path back into the storefront, complementing B.3's one-shot redirect rather than fighting it.

---

## PART C — Frontend: Dashboard Shell Layout (Sidebar)

### C.1 — Shell component

**File**: `frontend/src/components/dashboard/DashboardShell.tsx` (new directory `components/dashboard/`)

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserRole } from "@/lib/types";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS_BY_ROLE: Record<"manager" | "admin", NavLink[]> = {
  manager: [
    { label: "Dashboard", href: "/manager/dashboard" },
    { label: "Products", href: "/manager/products" },
    { label: "Bulk Upload", href: "/manager/products/bulk-upload" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Products", href: "/manager/products" },
    { label: "Bulk Upload", href: "/manager/products/bulk-upload" },
    { label: "Users", href: "/admin/users" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Stock Adjustments", href: "/admin/stock-adjustments" },
  ],
};

interface DashboardShellProps {
  role: "manager" | "admin";
  children: React.ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [collapsed, setCollapsed] = useState(false);

  const links = NAV_LINKS_BY_ROLE[role];

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={`bg-neutral-900 text-neutral-100 flex flex-col transition-all ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          {!collapsed && <span className="font-semibold text-lg">LILLA</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-neutral-400 hover:text-white text-sm"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-neutral-700 capitalize">
              {role}
            </span>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded text-sm transition-colors ${
                  isActive ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {collapsed ? link.label.charAt(0) : link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t border-neutral-800 space-y-1">
          <Link
            href="/"
            className="block px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-800"
          >
            {collapsed ? "🏠" : "← View Storefront"}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-800"
          >
            {collapsed ? "⎋" : "Log Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

> Mobile responsiveness (off-canvas drawer below a breakpoint) is intentionally left as a follow-up detail rather than fully specified inline here — mirror whatever responsive drawer pattern the existing cart sidebar (`components/layout/` per the documented structure) already uses for its slide-in behavior, since the README explicitly documents an "interactive sliding cart sidebar" already solving this exact mobile-drawer problem elsewhere in the app. Reuse that mechanism (likely a shared `Sheet`/`Drawer` Shadcn component or a custom slide transition with Framer Motion) rather than building a third one.

### C.2 — Wire the shell into both layouts

**File**: `frontend/src/app/admin/layout.tsx` — replace the Phase 24 placeholder fragment:

```tsx
"use client";
import { useRoleGuard } from "@/lib/auth/withRoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(["admin"]);
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
```

**File**: `frontend/src/app/manager/layout.tsx`

```tsx
"use client";
import { useRoleGuard } from "@/lib/auth/withRoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/store/useAuthStore";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(["manager", "admin"]);
  const role = useAuthStore((s) => s.role);

  // Admin browsing into /manager/* (explicitly allowed — Admin gets full access to
  // Manager's simpler tools too) should still see the Admin nav set, not the Manager one,
  // so they don't lose access to Users/Orders/Stock while inside a /manager/ route.
  const shellRole = role === "admin" ? "admin" : "manager";

  return <DashboardShell role={shellRole}>{children}</DashboardShell>;
}
```

### C.3 — "Back to Store" / discoverability

Already included directly in `DashboardShell.tsx` above (the `← View Storefront` link at the bottom of the sidebar) — this is the explicit, always-visible path back into the storefront that complements Part B.3's one-shot mount redirect. No additional file needed.

### C.4 — Visual distinction

The shell above uses a dark neutral (`bg-neutral-900`/`text-neutral-100`) sidebar against a light `bg-neutral-50` content area — deliberately distinct from the storefront's documented "rose-gold" premium aesthetic, signaling "operations mode" at a glance. Typography should remain `Darker Grotesque` (confirm the font is applied globally via the root layout/Tailwind config rather than only on storefront-specific pages, so it carries over here without extra work) — this shell is a layout change, not a rebrand, so no new font or color palette should be introduced beyond this sidebar treatment.

### C.5 — Placeholder dashboard pages (only if Phases 18/23 aren't done yet)

**File**: `frontend/src/app/admin/dashboard/page.tsx`

```tsx
export default function AdminDashboardPage() {
  // TODO(Phase 18 / existing admin analytics): replace this placeholder with the
  // real analytics dashboard content once confirmed present, or build it out per
  // Phase 18's user-management page plus whatever existing /admin analytics view
  // the README documents as already built. If the existing /admin page already
  // has this content, MOVE that content here rather than duplicating routes —
  // confirm whether /admin (old) and /admin/dashboard (new) would conflict and
  // consolidate into a single canonical admin dashboard route.
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-neutral-500 mt-2">Dashboard content pending — see Phase 18.</p>
    </div>
  );
}
```

**File**: `frontend/src/app/manager/dashboard/page.tsx`

If Phase 23 has already been implemented, this file already exists with real content (see Phase 23's exhaustive spec) — **do not overwrite it with a placeholder.** Only create the placeholder version below if this file does not exist yet:

```tsx
export default function ManagerDashboardPage() {
  // TODO(Phase 23): replace with the real ManagerInsightsView-backed dashboard.
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
      <p className="text-neutral-500 mt-2">Insights dashboard pending — see Phase 23.</p>
    </div>
  );
}
```

> **Route collision check**: the existing repo already documents a `/admin` page (analytics dashboard, per the README's directory structure: `app/admin/`). Introducing `/admin/dashboard` as a *new* route alongside the *existing* `/admin` route risks confusing duplication — two different "admin home" URLs. **Resolve this explicitly**: either (a) move the existing `/admin` page's content into `/admin/dashboard` and make `/admin` itself redirect to `/admin/dashboard` (cleanest, keeps a stable shell-wrapped canonical dashboard route), or (b) treat the existing `/admin` route as continuing to be the canonical dashboard path and adjust every redirect target in Part B of this document from `/admin/dashboard` to `/admin` instead. **Pick option (a)** unless there's a specific reason not to (e.g. existing bookmarks/links depending on the bare `/admin` path mattering enough to keep as the primary route) — note the decision made in the PR description so it's traceable.

---

## PART D — Tests

### D.1 — Backend

No new backend tests beyond Part A.3 (role-in-response verification) — this phase is almost entirely frontend routing/layout.

### D.2 — Frontend E2E

**File**: `frontend/tests/post-login-routing.spec.ts` (new file; if Phase 24's `role-routing.spec.ts` already exists, consider merging these into that file instead of creating a near-duplicate — check before creating)

```typescript
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("customer login lands on storefront homepage", async ({ page }) => {
  await loginAs(page, "customer");
  await expect(page).toHaveURL("/");
});

test("manager login redirects to manager dashboard", async ({ page }) => {
  await loginAs(page, "manager");
  await expect(page).toHaveURL("/manager/dashboard");
  await expect(page.locator("text=Manager")).toBeVisible(); // role badge in sidebar
});

test("admin login redirects to admin dashboard", async ({ page }) => {
  await loginAs(page, "admin");
  await expect(page).toHaveURL("/admin/dashboard");
});

test("manager dashboard shows manager-only nav links", async ({ page }) => {
  await loginAs(page, "manager");
  await expect(page.locator("text=Products")).toBeVisible();
  await expect(page.locator("text=Bulk Upload")).toBeVisible();
  await expect(page.locator("text=Users")).not.toBeVisible();
});

test("admin dashboard shows full nav link set", async ({ page }) => {
  await loginAs(page, "admin");
  await expect(page.locator("text=Users")).toBeVisible();
  await expect(page.locator("text=Orders")).toBeVisible();
  await expect(page.locator("text=Stock Adjustments")).toBeVisible();
});

test("manager can click 'View Storefront' and browse without being bounced back", async ({ page }) => {
  await loginAs(page, "manager");
  await page.click("text=View Storefront");
  await expect(page).toHaveURL("/");
  // Browse further into the storefront — should NOT redirect back to dashboard
  await page.click('a[href="/shop"]'); // adjust selector to actual existing Navbar shop link
  await expect(page).toHaveURL("/shop");
  // Navigate back to "/" explicitly — should STILL not bounce, since the one-shot
  // redirect already fired earlier in this same page-load session
  await page.goto("/");
  await expect(page).toHaveURL("/");
});

test("manager with existing session hard-refreshing on / gets redirected to dashboard", async ({ page }) => {
  await loginAs(page, "manager");
  // loginAs already redirects to /manager/dashboard; navigate to "/" deliberately first
  // to simulate "already had a session, then loaded the bare homepage fresh"
  await page.goto("/");
  await page.reload(); // simulates a genuinely fresh page load, resetting the one-shot ref guard
  await expect(page).toHaveURL("/manager/dashboard");
});

test("admin browsing into /manager/products sees admin nav set, not manager's", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/manager/products");
  await expect(page.locator("text=Users")).toBeVisible(); // admin-only link still present
});
```

> The last test in the list above (`hard-refreshing on / gets redirected`) depends on the one-shot ref guard resetting on an actual full page reload (`page.reload()` triggers a real remount, resetting the `useRef`) versus a client-side navigation (`page.goto()` inside an already-running SPA session does NOT remount React state) — this distinction is the entire point of Part B.3's design and is worth a careful read if this test doesn't behave as expected; it is testing exactly the nuance described there.

---

## Master Acceptance Checklist

- [ ] Verified (not assumed) that the access token and/or `verify-otp` response body carries `role`.
- [ ] Auth store has a `hydrated` flag, correctly flipped at the end of the **existing** session-restore flow (not a new parallel one).
- [ ] Login success handler redirects Manager → `/manager/dashboard`, Admin → `/admin/dashboard`, Customer → unchanged behavior.
- [ ] Mount-time one-shot redirect correctly sends an already-authenticated Manager/Admin sitting on `/` to their dashboard — exactly once per fresh load, never repeatedly during normal in-app browsing.
- [ ] `DashboardShell` renders a sidebar with role-correct nav links, role badge, "View Storefront" link, and logout.
- [ ] Admin browsing into `/manager/*` routes sees the Admin nav set (superset), not the Manager-only set.
- [ ] Route collision between the existing `/admin` page and the new `/admin/dashboard` route has been explicitly resolved (consolidated, not left as two competing "admin home" URLs).
- [ ] Manager/Admin can freely click through to the storefront and browse without being redirected back — verified by E2E test.
- [ ] Customer experience completely unchanged — verified by E2E test.
- [ ] Full backend + frontend test suites green.

## Final Notes for the Implementing Agent

- This phase is layout/routing only. Do not build out new dashboard *content* — that belongs to Phase 18 (Admin) and Phase 23 (Manager). If those are already done, wire the shell around the real pages; if not, use the placeholders in C.5 and leave clear `TODO` markers.
- Check whether Phase 24's `withRoleGuard` already exists before writing any guard logic here — this document assumes it does (it's imported directly in C.2) and does not redefine it. If Phase 24 hasn't landed yet, implement Phase 24 first, or at minimum lift its `useRoleGuard` hook verbatim before proceeding.
- Confirm the real location of the login-success handler and the session-restore/hydration logic before editing — this document describes intent based on the documented OTP flow and silent-refresh feature, not a verified file path.

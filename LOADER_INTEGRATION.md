# LILLA — Loader Component Integration Guide

This document specifies how to install the new canonical `Loader` component and replace every existing/planned loading indicator in the codebase with it. Two files are provided alongside this guide:

- `Loader.tsx` → place at `frontend/src/components/ui/Loader.tsx`
- `loader.css` → append its contents to `frontend/src/app/globals.css` (confirm exact path/filename for the project's global stylesheet first — standard Next.js App Router convention, but verify)

## 1. Install the component

```bash
# From repo root
cp Loader.tsx frontend/src/components/ui/Loader.tsx
cat loader.css >> frontend/src/app/globals.css
```

If the project's `components/ui/` directory is reserved exclusively for Shadcn-generated components (confirm by checking whether everything in there has a Shadcn copyright header / matches the Shadcn CLI output pattern), place it at `frontend/src/components/common/Loader.tsx` instead (the README documents a `components/common/` directory for shared utility components) — pick whichever directory the project's existing convention favors and use one location consistently. Do not duplicate it into both.

## 2. Component API

```tsx
import { Loader } from "@/components/ui/Loader"; // adjust import path per step 1

<Loader />                          // default: md (32px), inherits current text color
<Loader size="sm" />                // 20px
<Loader size="xs" className="text-white" />   // 14px, white bars — for use on dark/filled buttons
<Loader size="lg" className="text-rose-600" /> // 48px, brand-accent color
<Loader pixelSize={28} label="Uploading products" /> // custom size + custom screen-reader label
```

- `size`: `"xs" | "sm" | "md" | "lg" | "xl"` → 14 / 20 / 32 / 48 / 64px.
- `className`: pass a Tailwind text-color utility to recolor the bars (they use `bg-current`, so color is inherited from the nearest text-color context). Leave unset to inherit whatever color is already in scope.
- `label`: screen-reader-only text via `role="status"` + `.sr-only` — defaults to `"Loading"`, override with something specific where it adds value (e.g. `"Uploading products"`, `"Generating description"`).
- Automatically swaps to a static, non-animated ring when the user's OS has `prefers-reduced-motion: reduce` set — this is mandatory given LILLA's already-documented "Reduced Motion Support" feature; do not bypass this behavior when reusing the component.

## 3. Replace every existing loading state

Search the codebase for the following patterns and replace each with `<Loader />` at an appropriate size. This list is exhaustive for what's documented in the README and in the tasksheets already produced in this conversation — if the agent finds additional ad-hoc spinners not listed here while searching, replace those too; the goal is zero competing spinner implementations left in the codebase.

### 3.1 — `loading.tsx` route-level skeletons

**Files**: every `loading.tsx` under `frontend/src/app/` (PDP, catalog/shop search paths, per the README's documented "App Router Resilience & Loading Skeletons" feature).

These are full-page/section skeletons, not spinners — **do not replace the skeleton screens themselves** (skeleton screens are a deliberately better UX than a spinner for full-page loads, and the README treats this as an intentional feature). Only replace any spinner that might additionally appear *inside* those skeleton components if one currently exists (e.g. a small spinner shown while a nested async component resolves within an otherwise-skeleton page). If no such inner spinner exists, no change needed here — confirm by opening each `loading.tsx` file before editing.

### 3.2 — Cart sidebar / checkout loading states

**Files**: `frontend/src/components/checkout/` (Stripe Elements checkout form), `frontend/src/components/layout/` (cart sidebar).

Search for any "Processing…" or spinner element shown during:
- Stripe `PaymentIntent` creation/confirmation
- Add-to-cart network calls
- Coupon validation (`/api/coupons/validate/`)

Replace pattern:

```tsx
// BEFORE (example — adapt to whatever the actual existing markup is)
{isProcessing && <span className="spinner" />}
{isProcessing && "Processing..."}

// AFTER
{isProcessing && <Loader size="xs" className="text-white" />}
```

For the Stripe checkout submit button specifically, follow the same inline pattern as Section 4 below (button + Loader side-by-side, button text stays visible or swaps to "Processing…" depending on existing convention — preserve whatever the current button copy convention is, only swap the visual indicator).

### 3.3 — Auth modal (OTP request/verify)

**File**: `frontend/src/components/auth/AuthModal.tsx`

Replace any loading indicator shown while:
- Requesting an OTP (`POST /api/auth/request-otp/`)
- Verifying an OTP (`POST /api/auth/verify-otp/`)

```tsx
<button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2">
  {isSubmitting ? <Loader size="xs" className="text-white" /> : "Verify Code"}
</button>
```

### 3.4 — Account dashboard (Profile / Addresses / Orders tabs)

**File**: `frontend/src/app/account/` and its sub-routes.

Replace any "Loading…" text shown while fetching profile data, saved addresses, or order history:

```tsx
// BEFORE
{loading && <p>Loading...</p>}

// AFTER
{loading && (
  <div className="flex justify-center py-12">
    <Loader size="md" />
  </div>
)}
```

### 3.5 — Routine builder quiz

**File**: `frontend/src/app/routine-builder/`

Replace any loading state shown while computing/fetching the recommended product bundle after quiz completion, using the same centered-`md`-size pattern as 3.4.

### 3.6 — Admin analytics dashboard

**File**: `frontend/src/app/admin/` (existing analytics page)

Replace any loading indicator shown while `/api/admin/analytics/` resolves:

```tsx
if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader size="lg" />
    </div>
  );
}
```

### 3.7 — Currency switcher

**File**: wherever the multi-currency `Price` component (`components/shared/`) handles the brief loading window while `/api/currency-rates/` resolves on first load (likely only relevant pre-cache, given the 24-hour caching behavior) — if there's a loading flicker here, use `size="xs"` inline next to the price.

## 4. Replace loading states across the Phase 17–25 tasksheets

If the multi-role/manager-dashboard work from the earlier tasksheets in this conversation is implemented after this Loader component exists, every "Loading…" text placeholder specified in those documents should be written using `Loader` from the start rather than plain text. Specifically:

**`/admin/users` page** (Phase 18, tasksheet section 18.7):

```tsx
// Replace:
{loading ? <p>Loading…</p> : ( ...table... )}

// With:
{loading ? (
  <div className="flex justify-center py-12"><Loader size="md" /></div>
) : ( ...table... )}
```

**`/manager/products` list, new/edit forms** (Phase 20, tasksheet sections 20.6):

```tsx
// Loading state in ManagerProductsPage:
{loading ? (
  <div className="flex justify-center py-12"><Loader size="md" /></div>
) : ( ...table... )}

// EditProductPage's "Loading…" div:
if (loading) return (
  <div className="flex justify-center py-12"><Loader size="md" /></div>
);

// ProductForm submit button:
<button type="submit" disabled={submitting} className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 flex items-center justify-center gap-2">
  {submitting ? <Loader size="xs" className="text-white" /> : isEditMode ? "Save Changes" : "Create Product"}
</button>
```

**AI description generation button** (Phase 21, tasksheet section 21.6):

```tsx
<button type="button" onClick={handleGenerateDescription} disabled={generating} className="text-sm text-purple-600 disabled:opacity-50 flex items-center gap-1.5">
  {generating ? (
    <>
      <Loader size="xs" />
      Generating…
    </>
  ) : description ? (
    "✨ Regenerate with AI"
  ) : (
    "✨ Generate with AI"
  )}
</button>
```

**Bulk upload page** (Phase 22, tasksheet section 22.5):

```tsx
<button onClick={handleUpload} disabled={!file || uploading} className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 flex items-center justify-center gap-2">
  {uploading ? <Loader size="xs" className="text-white" /> : "Upload"}
</button>
```

**Manager insights dashboard** (Phase 23, tasksheet section 23.5):

```tsx
if (loading) return (
  <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
);
```

If those phases have already been implemented with plain "Loading…" text by the time this Loader component is added, go back and apply the same replacements retroactively — there should be zero remaining instances of bare "Loading…" text anywhere in the codebase once this integration is complete.

## 5. Verification checklist

- [ ] `Loader.tsx` installed at the chosen single location; no duplicate copies elsewhere.
- [ ] `loader.css` keyframes appended to the global stylesheet; verified the spinner animates correctly in a real browser (not just visually inspected as code).
- [ ] Searched the full codebase for: `Loading...`, `Loading…`, `<span className="spinner"`, any literal `.spinner` CSS class, and any other ad-hoc loading indicator — every match replaced with `<Loader />` at an appropriate size, or confirmed as an intentional skeleton screen (3.1) that should NOT be replaced.
- [ ] Confirmed `prefers-reduced-motion` fallback actually renders the static ring (toggle the OS/browser setting and verify) rather than just trusting the code.
- [ ] Confirmed bar color correctly inherits/overrides via `className` in at least one dark-button context (e.g. the checkout submit button) and one default/inherited context (e.g. a page-level loading state).
- [ ] No remaining references to `styled-components` introduced anywhere as a side effect of this work — the whole point of the conversion was to avoid adding that dependency.

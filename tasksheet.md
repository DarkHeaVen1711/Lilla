# LILLA — Code Polish & Suggested Features Tasksheet

This tasksheet lists identified redundancies in the Lilla codebase and details proposed tasks for subsequent phases of features development.

---

## 🔍 Redundancy and Duplicate Code Analysis

### 1. Duplicated Order Submission Payload Construction
- **Files**:
  - [CreditCardForm.tsx](file:///e:/Coding/Lilla/frontend/src/components/checkout/CreditCardForm.tsx#L66-L80)
  - [page.tsx (PaymentPage)](file:///e:/Coding/Lilla/frontend/src/app/checkout/payment/page.tsx#L38-L52)
- **Problem**: Both files compile the same `orderPayload` (mapping name, address coordinates, total price, and cart items to string decimals) and duplicate the post-submission actions (saving `lilla-last-order` to localStorage with resolved cart images, clearing cart state, clearing checkout fields, and routing to success). This makes the order submission logic brittle and hard to maintain if API requirements change.

### 2. Client-Side Substring Array Filtering for Categories
- **Files**:
  - [makeup/page.tsx](file:///e:/Coding/Lilla/frontend/src/app/makeup/page.tsx#L8-L15)
  - [skin/page.tsx](file:///e:/Coding/Lilla/frontend/src/app/skin/page.tsx#L8-L14)
- **Problem**: Both pages fetch *all* products on the server side via `getProducts()` and filter down categories on the client using javascript string comparisons against a hardcoded list of keywords (e.g. "color", "lip", "blush" for makeup). This duplicates filtering capabilities since `getProducts` and the Django backend already support server-side category filters (`?category=slug`).

### 3. Duplicate Layout Configuration Declarations
- **Files**:
  - [views.py (HomepageDataView)](file:///e:/Coding/Lilla/backend/api/views.py#L90-L212)
  - [homepageData.ts (LOCAL_HOME_PAGE_DATA)](file:///e:/Coding/Lilla/frontend/src/lib/homepageData.ts#L108-L261)
- **Problem**: Navigation links, promotional slide configurations, trust badges, and footer columns are declared statically twice — once on the backend in Django view code and once as a local fallback object on the Next.js frontend. This leads to double-maintenance overhead and inconsistencies.

---

## 🛠️ Proposed Refactoring Tasks (Cleanups & Unification)

### Task Ref 1: Unify Checkout Payload & Order Submission
- **Goal**: Abstract order submission payload construction and success hooks.
- **Tasks**:
  - Create a custom hook or Zustand action `placeOrder(method, payload)` to unify request formatting, local storage serialization, and routing.
  - Swap duplicate code blocks in `CreditCardForm.tsx` and `PaymentPage` to invoke the unified submission helper.

### Task Ref 2: API-Driven Category Routing
- **Goal**: Clean up client-side category filtering.
- **Tasks**:
  - Update `makeup/page.tsx` and `skin/page.tsx` server components to call `getProducts({ categorySlug: "makeup" })` and `getProducts({ categorySlug: "skin" })` respectively.
  - Remove redundant manual Javascript substring filters.

### Task Ref 3: Unify Homepage Layout Configurations
- **Goal**: Eliminate double declarations of static layout arrays.
- **Tasks**:
  - Refactor frontend `getHomePageData` to strictly use the Django API response layout arrays as the source of truth, leaving the frontend fallback object strictly for connection timeouts.

---

## 🌟 Proposed New Feature Phases

### Phase 1: Dynamic Coupon Management System
- **Goal**: Move away from hardcoded coupon validation logic (like `TRYBEAUTY`).
- **Tasks**:
  - **[Backend]**: Create a `Coupon` database model (`code` (unique), `discount_percentage`, `is_active`, `expires_at`). Register it in the Django Admin.
  - **[Backend]**: Create `/api/coupons/validate/` endpoint validating code presence, activity flags, and expiration dates.
  - **[Frontend]**: Refactor Zustand store `applyCoupon` action in `useStore.ts` to call `/api/coupons/validate/` and calculate totals dynamically based on the verified percentage.

### Phase 2: Product Review and Rating System
- **Goal**: Allow customers to submit reviews on Product Detail Pages (PDP).
- **Tasks**:
  - **[Backend]**: Define a `Review` database model with fields: `product` (ForeignKey), `user` (ForeignKey), `rating` (Integer 1-5), `comment` (TextField), and `created_at`.
  - **[Backend]**: Write post-save/post-delete database triggers to auto-update corresponding `Product.rating` and `Product.reviews` (count) aggregates whenever a review changes.
  - **[Backend]**: Create REST endpoints `/api/products/<slug>/reviews/` supporting creation and listing.
  - **[Frontend]**: Render star distributions and reviews list under product details in `ProductDetailPDP.tsx`. Add a gated submission form (users must be logged in to leave reviews).

### Phase 3: Faceted Catalog Filtering & Sorting
- **Goal**: Enhance product search and discoverability.
- **Tasks**:
  - **[Backend]**: Update `ProductViewSet.get_queryset` to support sorting queries (`?sort=price_asc`, `?sort=price_desc`, `?sort=rating`, `?sort=newest`).
  - **[Backend]**: Support multi-select filter logic matching multiple category slugs and multiple concerns simultaneously.
  - **[Frontend]**: Implement a sliding filter sidebar on the `/shop` catalog page displaying concerns, key ingredients list, and price sort selectors.

### Phase 4: Automated Order Confirmation Invoices
- **Goal**: Send actual purchase invoices to customer mailboxes.
- **Tasks**:
  - **[Backend]**: Configure SMTP email settings in Django `settings.py`.
  - **[Backend]**: Hook a database signal to `Order` updates: when status transitions from `Pending` to `Paid`, trigger an asynchronous task compiling an HTML invoice format with order line items and dispatching it to the customer's email.

### Phase 5: Admin Metrics Visualizer (Analytics Panel)
- **Goal**: Build visual metrics indicators inside the operational admin console.
- **Tasks**:
  - **[Backend]**: Add administrative REST endpoints `/api/admin/analytics/` returning gross revenue sums, average order values (AOV), daily order logs, and top-selling product statistics.
  - **[Frontend]**: Render interactive charts (using `recharts` which is already in `package.json` dependencies) on the admin panel Overview page tab, updating dynamically on load.

---

## 🖥️ Operational Admin Dashboard Enhancements (Phase 6)

### Task 6.1: Advanced Product Attributes Catalog Editor
- **Goal**: Expand the basic product editor to control all parameters including categories, skincare/makeup attributes, promotions, and specifications.
- **Tasks**:
  - **[Frontend]**: Upgrade the "Add Product" and "Edit Product" modal panels to support:
    - **Category Association**: Dropdown selector fetching available backend Category slugs.
    - **Text Content**: Full description textbox field and ingredients textarea.
    - **Skincare Specs**: Dynamic inputs lists for `skin_concerns`, `key_ingredients`, `skin_types`, and `application_steps`.
    - **Makeup Specs**: Form input fields for `finish`, `applicator`, and `shades` color hex lists.
    - **Interactive Image Coordinates Picker**: Canvas component allowing coordinates clicking/selection to assign badges on product images (saving to `features_json`).
    - **Promotions**: Toggle fields for `is_deal_of_the_day` accompanied by an expiration datetime-picker.

### Task 6.2: Order Fulfillment Control & Remote Refunds Panel
- **Goal**: Allow administrators to update customer order statuses and perform instant credit card refunds.
- **Tasks**:
  - **[Backend]**: Add a view action in `OrderViewSet` supporting PATCH transitions for status updates (`Pending` -> `Paid` / `Shipped` / `Delivered` / `Failed`).
  - **[Frontend]**: Render a status select control inside expanded order detail panels on the Orders tab.
  - **[Frontend]**: Add a "Refund Order" button for `Paid` orders that hits the backend `/api/orders/<id>/refund/` staff endpoint to trigger secure Stripe refunds, returning confirmation toasts.

### Task 6.3: Stock Adjustments & Inventory History Logs
- **Goal**: Allow staff to view logged stock audit histories on the admin panel.
- **Tasks**:
  - **[Backend]**: Add REST list endpoint for `StockAdjustment` records restricted to staff members.
  - **[Frontend]**: Add a new sub-tab or table section under the Dashboard tab listing inventory changes, displaying the old vs new stock levels, adjusting user/staff identifier, edit date, and adjustment reason.

### Task 6.4: Account Management & User Role Controls
- **Goal**: Manage customer accounts and staff clearances directly.
- **Tasks**:
  - **[Backend]**: Add REST actions to the users view allowing administrators to toggle `is_staff` privileges and modify active statuses.
  - **[Frontend]**: Add action toggles ("Toggle Admin Role" / "Block Account") on the Users table rows in the Users dashboard tab.

### Task 6.5: Dashboard Skeletons & Interactive Notifications
- **Goal**: Polish visual loading sequences and system notification feedback.
- **Tasks**:
  - **[Frontend]**: Replace browser alert popups (`alert()`) with elegant, non-blocking toast notifications using the integrated `sonner` package.
  - **[Frontend]**: Render skeleton layouts (`w-full animate-pulse bg-gray-100`) while dashboard tables and statistics counters fetch data.

### Task 6.6: Unified Global Loader Component
- **Goal**: Abstract the styled-components spinner into a global `<Loader />` component and use it system-wide for loading state consistency.
- **Component Code**:
  ```tsx
  import React from 'react';
  import styled from 'styled-components';

  const Loader = () => {
    return (
      <StyledWrapper>
        <div className="spinner">
          <div />   
          <div />    
          <div />    
          <div />    
          <div />    
          <div />    
          <div />    
          <div />    
          <div />    
          <div />    
        </div>
      </StyledWrapper>
    );
  }

  const StyledWrapper = styled.div`
    .spinner {
      position: absolute;
      width: 9px;
      height: 9px;
    }

    .spinner div {
      position: absolute;
      width: 50%;
      height: 150%;
      background: #000000;
      transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1%));
      animation: spinner-fzua35 1s calc(var(--delay) * 1s) infinite ease;
    }

    .spinner div:nth-child(1) {
      --delay: 0.1;
      --rotation: 36;
      --translation: 150;
    }

    .spinner div:nth-child(2) {
      --delay: 0.2;
      --rotation: 72;
      --translation: 150;
    }

    .spinner div:nth-child(3) {
      --delay: 0.3;
      --rotation: 108;
      --translation: 150;
    }

    .spinner div:nth-child(4) {
      --delay: 0.4;
      --rotation: 144;
      --translation: 150;
    }

    .spinner div:nth-child(5) {
      --delay: 0.5;
      --rotation: 180;
      --translation: 150;
    }

    .spinner div:nth-child(6) {
      --delay: 0.6;
      --rotation: 216;
      --translation: 150;
    }

    .spinner div:nth-child(7) {
      --delay: 0.7;
      --rotation: 252;
      --translation: 150;
    }

    .spinner div:nth-child(8) {
      --delay: 0.8;
      --rotation: 288;
      --translation: 150;
    }

    .spinner div:nth-child(9) {
      --delay: 0.9;
      --rotation: 324;
      --translation: 150;
    }

    .spinner div:nth-child(10) {
      --delay: 1;
      --rotation: 360;
      --translation: 150;
    }

    @keyframes spinner-fzua35 {
      0%, 10%, 20%, 30%, 50%, 60%, 70%, 80%, 90%, 100% {
        transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1%));
      }

      50% {
        transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1.5%));
      }
    }
  `;

  export default Loader;
  ```
- **Tasks**:
  - Export this component from `@/components/common/Loader.tsx`.
  - Replace current loading text placeholders in dashboard and products list with the unified loader.

---

## 🗄️ Hybrid Offline/Online Database Sync System (Phase 7)

### Phase 7: Hybrid Database System (Supabase & Local SQLite fallback)
- **Goal**: Implement a fault-tolerant database architecture that seamlessly handles network drops and merges offline updates when connection is restored.
- **Tasks**:
  - **Connection Monitoring**: Implement local health checks and event listeners to continuously monitor network/Supabase connectivity status.
  - **Dynamic Routing**:
    - **Online Mode**: Direct all database queries (write/read) to the cloud Supabase primary cluster.
    - **Offline Mode**: Redirect all write/read transactions to the local SQLite database. Flag these records as `unsynced`.
  - **Synchronization Engine**:
    - Build a sync service triggered immediately when the connection returns online.
    - Fetch all `unsynced` local SQLite rows, resolve conflicts (e.g., timestamps / last-write-wins), update the remote Supabase DB, and mark local records as `synced`.



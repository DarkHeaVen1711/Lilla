# LILLA - Premium Headless E-commerce Storefront

LILLA is a high-performance, modern headless e-commerce storefront engineered for premium cosmetic, skincare, and beauty brands. The platform is designed with a detached architecture: a highly interactive Next.js storefront and a robust, secure Django REST Framework backend API.

---

## 🌟 Comprehensive Feature Set

### 1. Storefront & Visual Experience
- **Premium UI/UX Design**: Elegant, minimalist aesthetic featuring custom typography, smooth gradients, and micro-animations built with **Framer Motion**.
- **Responsive Navigation**: Amazon-style mobile navigation layout, interactive sliding cart sidebar, and horizontally scrollable badges.
- **Optimized Typography**: Powered by Google Fonts (`Darker Grotesque`) utilizing `display: swap` configurations to maximize Cumulative Layout Shift (CLS) scores.

### 2. State-of-the-Art Client State Machine
- **Zustand Persistence & Cart Unification**: Unified cart operations across the PDP catalog, promotional deals, and home sections under a single persisted Zustand store, completely eliminating legacy context states and badge desync.
- **Client-Side Silent Token Refresh**: Seamlessly schedules access-token rotation using refresh tokens on protected routes via server-side middleware and custom API proxy client fetch wrappers.
- **Guest Interceptor (Frozen Intents)**: When guest users perform actions (like adding items to favorites or checkout), the store intercepts the intent, prompts for authentication, and automatically resumes/flushes the cached action on successful login.
- **Promotional Calculations**: Auto-calculates subtotals, shipping costs, and a 20% cart discount upon applying coupon code `TRYBEAUTY`.

### 3. Advanced Backend Security & API Defenses
- **Secure OTP Login (Email & SMS)**: Dual-factor authentication using cryptographically secure 6-digit OTP codes stored in cache, with integrations for Django email servers and Twilio SMS.
- **Rate-Limiting Throttles**: Custom Django Rest Framework throttle blocks restrict OTP requests to 3 attempts/min and verification to 5 attempts/min per IP/username to prevent brute force attacks.
- **Transactional Stock Defenses**: Checkout operations employ Django's `@transaction.atomic` combined with row-level database locking (`select_for_update`) to prevent concurrent checkout race conditions.

### 4. PCI-Compliant Payment Integration & Order Integrity
- **Stripe Elements Iframe**: Renders Stripe's secure `<CardElement>` iframe, completely isolating credit card data from Zustand state and local database memory.
- **Server-Side Price Validation**: Recomputes order totals using actual Product prices from the database before generating `PaymentIntents` to prevent price injection attacks.
- **Asynchronous Webhook Engine**: Validates secure signatures using `stripe.Webhook.construct_event`, updating corresponding order status to `"Paid"` upon success.
- **Transactional Stock Compensations**: On payment failure or cancellation, hooks into atomic stock locks to restore inventory (`product.stock += item.quantity`) and sets order status to `"Failed"`.
- **Administrative Refunds**: Staff-only endpoints (`IsAdminUser`) hook directly to Stripe's refund APIs, setting order status to `"Refunded"`.

### 5. Dynamic Performance & Revalidation
- **On-Demand Cache Revalidation**: Asynchronous Django post-save/post-delete signals send tags to the Next.js revalidation endpoint (`/api/revalidate`), enabling Incremental Static Regeneration (ISR) whenever products or combo packages change.
- **Eager Loading Database Audit**: All database list queries explicitly chain `.select_related()` and `.prefetch_related()` to eliminate nested N+1 query hits.
- **App Router Resilience & Loading Skeletons**: Integrated instant skeleton screens (`loading.tsx`) and error recovery boundaries (`error.tsx`) for PDP and catalog search paths to improve fault tolerance.
- **Global Payment Element Error Boundary**: Wrapped the Stripe Elements rendering context in a custom boundary to gracefully handle external JS script load failures.

### 6. Production Observability & Monitoring
- **Sentry Observability Filters**: Edge-safe Sentry telemetry integrations scrub sensitive fields (OTP keys, passwords, JWT access tokens, and `Authorization` headers) before sending telemetry frames.
- **Structured JSON Logging**: Outputs machine-readable JSON log format via a custom Django `JSONFormatter`, categorizing security audits (`lilla.security`) and transaction events (`lilla.transaction`).

### 7. Administrative Tools & Audit Logs
- **Role-Gated Dashboard**: Admin-restricted control panel at `/admin` for product catalog management, order oversight, and user logs monitoring.
- **Stock Audit Trails**: Logs manual inventory changes to the `StockAdjustment` database history whenever staff edits stock levels.
- **Admin Analytics**: Aggregated revenue, order counts, and top-product reports via a dedicated `/api/admin/analytics/` endpoint, restricted to staff users.

### 8. Account Persistence & Session Syncing
- **Guest Favorites Sync**: Merges client-side local storage wishlists with the backend database upon customer login.
- **Saved Address Selector**: Checkout billing form retrieves previous addresses in a selector dropdown, with a "Save address" checkbox for new ones.
- **Customer Order History**: Interactive purchase list at `/account/orders` showing order codes, dates, color-coded statuses, items, and pricing.

### 9. Accessibility & Motion Guidelines
- **Reduced Motion Support**: Detects system preferences (`prefers-reduced-motion: reduce`) and automatically disables or minimizes Framer Motion transitions/animations to prevent vestibular triggers.
- **Keyboard-Focus and Dialog Semantics**: Fully accessibility-hardened `AuthModal` overlay implementing focus traps, auto-focus return, Escape-key dismissals, and appropriate ARIA attributes.

### 10. Automated Order Confirmation Invoices
- **Status-Triggered Delivery**: Automatically hooks to Order model status transitions. Dispatches order confirmation invoices when status changes to `"Paid"` via database save or Stripe webhooks.
- **Asynchronous Mailer Engine**: Sends multi-alternative emails (HTML template + plain-text fallback) inside background daemon threads to maximize response speed and ensure zero HTTP thread blocking.
- **Advanced Deduplication Defense**: Overrides Django's `Order.save()` to track in-memory original status, ensuring that duplicate or repeated saves on the same in-memory instance do not trigger multiple duplicate invoice emails.
- **Valid Email Gating**: Intercepts and filters checkouts, skipping delivery for phone-only checkouts that do not have a valid email address containing an `@` character.
- **Responsive Rose-Gold HTML Template**: Incorporates an inline-styled aesthetic layout mirroring LILLA's minimalist premium experience, displaying line items, discounts, delivery fees, and grand totals.

### 11. Real-time Multi-Currency Switcher
- **Dynamic Price Component**: Encapsulates currency symbols and active conversion rates locally cached, rendering prices in USD, EUR, GBP, or INR instantly.
- **Exchange Rates Caching Views**: Backend caches conversion rates from `https://open.er-api.com/v6/latest/USD` for 24 hours, falling back to reliable hardcoded rates.
- **Validation Security**: Django validation converts USD database catalog prices using conversion rates to match checkout currencies.

### 12. SEO Rich Snippets & Sharing Previews
- **Dynamic Metadata**: Custom `generateMetadata` implementation pulls title, description, and preview image values for OpenGraph and Twitter cards.
- **JSON-LD Structured Data**: Injects Product schemas (Schema.org/Product) for rich indexing and search result snippets.
- **Sitemap & Robots**: Auto-generated `sitemap.ts` and `robots.ts` for search engine crawlers.

### 13. Customer Saved Address Book & Profile Center
- **Unified Account Dashboard**: Settings dashboard `/account` with tabs for Profile, Saved Addresses, and Orders.
- **Address CRUD Modals**: Interactive React forms to add, edit, or delete shipping and billing details.
- **Profile Editors**: Customer contact updates with username synchronization to prevent conflicts.

### 14. Product Reviews & Ratings System
- **Authenticated Review Submission**: Logged-in customers can submit star ratings (1–5) and written comments on individual product pages.
- **Review Images**: Customers can attach up to multiple image URLs to their review, displayed in the PDP review section.
- **Duplicate Review Prevention**: Enforces one review per user per product at both the serializer and database constraint levels.
- **Automatic Rating Aggregation**: Django post-save/post-delete signals on the `Review` model automatically recompute and persist the product's aggregate rating and total review count.
- **Helpful Votes**: Authenticated users can toggle a "helpful" vote on any review. The toggle endpoint (`/api/reviews/<id>/helpful/`) adds or removes the vote and returns the updated count.
- **Rating Boundary Validation**: Serializer-level validation rejects ratings outside the 1–5 integer range.

### 15. Advanced Catalog Filtering
- **Backend-Driven Filtering**: `ProductViewSet` supports `?category=slug`, `?concern=slug`, and `?search=query` query parameters, offloading all filtering logic to the database.
- **Optimized Collection Pages**: Shop collection pages query only relevant category or concern slugs directly from the backend, eliminating client-side JavaScript filter blocks.

### 16. Skincare Routine Builder
- **Interactive Multi-Step Quiz**: A dedicated `/routine-builder` page guides users through a step-by-step questionnaire covering skin type, concerns, and goals.
- **Curated Product Recommendations**: Based on quiz answers, the page surfaces a tailored bundle of skincare and makeup products with potential bundle savings highlighted.
- **One-Click Bundle Add-to-Cart**: A "Build My Routine" button adds the entire recommended set to the cart in a single action.

---

## 💻 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) | App Router architecture, ISR page rendering |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Global client-side store with persistence |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive, utility-first visual style |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Micro-animations and page transitions |
| **Backend** | [Django](https://djangoproject.com/) | High-level Python Web framework |
| **REST API** | [Django REST Framework](https://django-rest-framework.org/) | API endpoints, serializers, and custom throttling |
| **Auth** | [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/) | JWT access/refresh token authentication |
| **Payments** | [Stripe](https://stripe.com/) | PCI-compliant payment intents and webhooks |
| **Database** | SQLite / PostgreSQL | Local dev SQLite database, postgres support ready |
| **Caching** | [Redis](https://redis.io/) / LocMem | Redis integration via `django-redis` cache backend |
| **SMS** | [Twilio](https://twilio.com/) | OTP delivery via SMS |
| **Telemetry** | [Sentry SDK](https://sentry.io/) | Full-stack telemetry error tracking |

---

## 📂 Project Directory Structure

```text
Lilla/
│
├── run.bat                          # Batch script to launch dev servers
├── README.md                        # Documentation
│
├── backend/                         # Django REST API Backend
│   ├── manage.py                    # Django administration CLI
│   ├── requirements.txt             # Python dependencies
│   ├── lilla_backend/               # App configuration & settings
│   └── api/                         # Primary API Application
│       ├── migrations/              # Database schema migrations
│       ├── models.py                # Database schemas (Product, Combo, Order, Review)
│       ├── views.py                 # Endpoint logic (OTP, Catalog, Orders, Currency, Reviews)
│       ├── views_payments.py        # Stripe payment intent & webhook views
│       ├── serializers.py           # Serializers & currency/concurrency checkouts
│       ├── urls.py                  # URL routing for all API endpoints
│       ├── admin.py                 # Django admin panel configuration
│       ├── signals.py               # Async ISR revalidation & review rating hooks
│       ├── emails.py                # Order invoice email engine
│       ├── throttling.py            # Custom DRF throttle rate limiters
│       ├── logging_formatters.py    # Structured JSON log formatters
│       ├── routers.py               # Custom DRF router configuration
│       ├── services/                # Background services
│       │   ├── connection_monitor.py  # DB connection health monitoring
│       │   └── sync_engine.py         # Data synchronization utilities
│       ├── test_integration.py      # Concurrency, OTP & multicurrency lifecycle tests
│       ├── test_admin.py            # Admin permissions & stock adjustment log tests
│       ├── test_account.py          # Favorites sync & address default toggle tests
│       ├── test_invoices.py         # Order transition paid signal & outbox tests
│       ├── test_reviews.py          # Review CRUD, aggregation & helpful vote tests
│       ├── test_analytics.py        # Admin analytics endpoint permission tests
│       ├── test_catalog_filters.py  # Catalog search & filter query tests
│       └── tests.py                 # General API endpoint tests
│
└── frontend/                        # Next.js Storefront App
    ├── package.json                 # Node dependencies
    ├── next.config.mjs              # Next.js configuration
    ├── vitest.config.ts             # Vitest unit test configuration
    ├── playwright.config.ts         # Playwright E2E test configuration
    ├── sentry.*.config.ts           # Sentry configurations (Client, Server, Edge)
    └── src/
        ├── app/                     # Page views
        │   ├── page.tsx             # Homepage
        │   ├── products/            # Product detail pages (PDP)
        │   ├── shop/                # Collection/category browsing pages
        │   ├── skin/                # Skincare category hub
        │   ├── makeup/              # Makeup category hub
        │   ├── cart/                # Cart page
        │   ├── checkout/            # Stripe checkout flow
        │   ├── favorites/           # Saved favorites page
        │   ├── account/             # Account dashboard (Profile, Addresses, Orders)
        │   ├── routine-builder/     # Interactive skincare quiz & routine builder
        │   ├── login/               # Authentication page
        │   ├── admin/               # Admin dashboard & analytics
        │   └── api/                 # Next.js API routes (revalidation, currency proxy)
        ├── components/              # React components
        │   ├── auth/                # AuthModal with focus trap & ARIA semantics
        │   ├── checkout/            # Stripe Elements checkout form
        │   ├── home/                # Homepage sections (hero, deals, featured)
        │   ├── layout/              # Navbar, footer, cart sidebar
        │   ├── product/             # ProductCard, ProductDetailPDP, ProductActions
        │   ├── shop/                # Collection grid and filter UI
        │   ├── shared/              # Shared utility components (Price, skeletons)
        │   ├── common/              # Common UI primitives
        │   ├── providers/           # React context providers
        │   └── ui/                  # Shadcn/ui base components
        ├── hooks/                   # Custom React hooks
        ├── lib/                     # API adapters, utilities, and type definitions
        └── store/                   # Zustand state configuration & slices
```

---

## ⚙️ Environment Configuration

### Django Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend` folder (see `backend/.env.example` for a full template):
```bash
DJANGO_SECRET_KEY="your-secret-key"
DJANGO_DEBUG="True"
ALLOWED_HOSTS="*"
CORS_ALLOWED_ORIGINS="http://localhost:3000"
REDIS_URL="redis://127.0.0.1:6379/1"
NEXTJS_REVALIDATE_URL="http://localhost:3000/api/revalidate"
REVALIDATION_SECRET="default_revalidation_secret"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Next.js Environment Variables (`frontend/.env.local`)
Create a `.env.local` file inside the `frontend` folder (see `frontend/.env.example` for a full template):
```bash
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
REVALIDATION_SECRET="default_revalidation_secret"
NEXT_PUBLIC_SENTRY_DSN=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 🚀 Installation & Local Setup

### Quick Start (Windows)
Run both servers simultaneously using the provided batch script:
```bash
run.bat
```

### Step 1: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Perform database migrations:
   ```bash
   python manage.py migrate
   ```
5. **Seed the Database**: Populate categories, products (with dynamic skincare specs), and combo bundles:
   ```bash
   python manage.py seed_db
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

### Step 2: Storefront Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The storefront will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## 🧪 Running Validation Tests

### 1. Backend Integration & Unit Tests
To execute the entire backend testing suite (concurrency, stock locks, OTP lifecycle, invoice transitions, review aggregation, analytics, and catalog filter tests):
```bash
python backend/manage.py test api
```

To run a specific test module:
```bash
# Reviews system tests
python backend/manage.py test api.test_reviews

# Catalog filter tests
python backend/manage.py test api.test_catalog_filters

# Analytics permission tests
python backend/manage.py test api.test_analytics

# Admin & stock audit tests
python backend/manage.py test api.test_admin

# Account & address tests
python backend/manage.py test api.test_account

# Order invoice tests
python backend/manage.py test api.test_invoices
```

### 2. Frontend Unit Tests (Vitest)
To execute the frontend unit test suite for the persisted state machine and checkout discount actions:
```bash
cd frontend
npm run test:unit
```

### 3. End-to-End Tests (Playwright)
To run end-to-end user checkout flows against a running Next.js instance:
```bash
cd frontend
npm run test:e2e
```

### 4. Admin Analytics Verification
To test the analytics reporting endpoints:
- **Backend Tests**: Run `python backend/manage.py test api.test_analytics` to verify permission configurations and aggregation logic.
- **E2E verification**: Executes programmatic admin login via OTP and fetches `/api/admin/analytics/` endpoint.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products/` | List all products (supports `?search=`, `?category=`, `?concern=`) | Public |
| `GET` | `/api/products/<slug>/` | Product detail | Public |
| `GET/POST` | `/api/products/<slug>/reviews/` | List or create product reviews | GET: Public, POST: Auth |
| `POST` | `/api/reviews/<id>/helpful/` | Toggle helpful vote on a review | Auth |
| `GET` | `/api/categories/` | List all categories | Public |
| `GET` | `/api/homepage/` | Aggregated homepage data | Public |
| `GET` | `/api/catalog/categories-products/` | Categories with nested products | Public |
| `GET` | `/api/catalog/active-combos/` | Active combo bundles | Public |
| `GET` | `/api/catalog/deal-of-the-day/` | Daily featured deal | Public |
| `GET` | `/api/currency-rates/` | Cached USD conversion rates | Public |
| `POST` | `/api/auth/request-otp/` | Request OTP via email or phone | Public |
| `POST` | `/api/auth/verify-otp/` | Verify OTP and receive JWT tokens | Public |
| `POST` | `/api/auth/token/refresh/` | Refresh JWT access token | Public |
| `GET/PATCH` | `/api/auth/profile/` | Retrieve or update user profile | Auth |
| `GET/POST/DELETE` | `/api/favorites/` | Manage favorited products | Auth |
| `GET/POST/PUT/DELETE` | `/api/addresses/` | Manage saved addresses | Auth |
| `POST` | `/api/orders/` | Create a new order | Auth |
| `GET` | `/api/orders/<id>/` | Order detail | Auth |
| `POST` | `/api/payments/create-intent/` | Create Stripe PaymentIntent | Auth |
| `POST` | `/api/payments/webhook/` | Stripe webhook handler | Stripe Signature |
| `POST` | `/api/coupons/validate/` | Validate a coupon code | Auth |
| `GET` | `/api/admin/analytics/` | Revenue & order analytics | Admin |
| `GET` | `/api/admin/users/` | List all users | Admin |
| `GET` | `/api/admin/stock-adjustments/` | Stock adjustment audit log | Admin |

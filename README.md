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

---

## 💻 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) | App Router architecture, ISR page rendering |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Global client-side store with persistence |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive, utility-first visual style |
| **Backend** | [Django](https://djangoproject.com/) | High-level Python Web framework |
| **REST API** | [Django REST Framework](https://django-rest-framework.org/) | API endpoints, serializers, and custom throttling |
| **Database** | SQLite / PostgreSQL | Local dev SQLite database, postgres support ready |
| **Caching** | [Redis](https://redis.io/) / LocMem | Redis integration via `django-redis` cache backend |
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
│       ├── models.py                # Database schemas (Product, Combo, Order)
│       ├── views.py                 # Endpoint logic (OTP, Catalog, Orders)
│       ├── serializers.py           # Serializers & concurrency lock checkouts
│       ├── throttling.py            # Custom DRF throttle rate limiters
│       ├── logging_formatters.py    # Structured JSON log formatters
│       ├── test_integration.py      # Concurrency & OTP lifecycle test suites
│       ├── test_admin.py            # Administrative permissions & stock adjustment logs tests
│       ├── test_account.py          # Favorites sync & address default toggle tests
│       ├── test_invoices.py         # Order transition paid signal & synchronous outbox tests
│       └── signals.py               # Asynchronous Next.js ISR revalidation hooks
│
└── frontend/                        # Next.js Storefront App
    ├── package.json                 # Node dependencies
    ├── next.config.mjs              # Next.js configuration
    ├── sentry.*.config.ts           # Sentry configurations (Client, Server, Edge)
    └── src/
        ├── app/                     # Page views (e.g., /admin, /account/orders) & API Proxies
        ├── components/              # React components (Cart, Auth, ProductCard)
        └── store/                   # Zustand state configuration
```

---

## ⚙️ Environment Configuration

### Django Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend` folder:
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
Create a `.env.local` file inside the `frontend` folder:
```bash
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
REVALIDATION_SECRET="default_revalidation_secret"
NEXT_PUBLIC_SENTRY_DSN=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 🚀 Installation & Local Setup

### Step 1: Backend Setup
1. Open a terminal and navigate to the backend directory:
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
1. Open a new terminal and navigate to the frontend directory:
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

---

## 🧪 Running Validation Tests

### 1. Backend Integration & Unit Tests
To execute the entire backend testing suite (including concurrency, stock locks, OTP lifecycle, and invoice paid-transition tests) using the isolated cache wrapper:
```bash
python backend/manage.py test api
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

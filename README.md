# LILLA - Headless Premium Skincare E-commerce Storefront

LILLA is a high-performance, modern headless e-commerce platform engineered for premium cosmetic, skincare, and beauty brands. The architecture is split into a Next.js frontend storefront and a Django REST Framework backend API, providing a scalable and secure foundation for online retail.

---

## Architecture & System Overview

- **Headless Next.js Storefront**: Responsive, mobile-first design with smooth layout animations (Framer Motion) and optimized images/fonts.
- **Django REST Framework (DRF) Backend**: Powers inventory management, transactional checkouts with row-level locks, dynamic OTP authentication, and cache-backed API services.

---

## Technical Stack

### Storefront (Frontend)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Animation**: Framer Motion
- **Iconography**: Lucide React
- **Observability**: Next.js Sentry config with telemetry filters

### API Services (Backend)
- **Framework**: Django & Django REST Framework (DRF)
- **Database**: SQLite (Local Dev) / PostgreSQL (Production ready via `dj-database-url`)
- **Cache**: Redis via `django-redis`
- **Authentication**: Redis-backed cryptographically secure OTP & JWT (`djangorestframework-simplejwt`)
- **Observability**: Django Sentry SDK with privacy scrubs

---

## Production Hardening & Telemetry (Phase 6)

The platform is equipped with production-grade reliability features:

1. **Django Rate Limiting (Throttle Blocks)**:
   - Configured custom throttle rates using DRF's `SimpleRateThrottle` for auth endpoints.
   - Throttles requests to `/api/auth/request-otp/` (3 requests/min per IP/identity) and `/api/auth/verify-otp/` (5 attempts/min) to defend against brute force.
   - Responds with HTTP 429 and accurate `Retry-After` headers.

2. **Database Query Eager Loading Audit**:
   - Explicitly chains `.select_related()` and `.prefetch_related()` inside catalog and bundle retrieval views to avoid N+1 queries.
   - Chained eager loading on transactional operations (such as Orders to Users and OrderItems).

3. **Frontend CLS & Asset Optimization**:
   - Maximized Cumulative Layout Shift (CLS) scores by configuring Google Font loading (`Darker Grotesque`) with `display: swap` in the root layout.
   - Optimized `next/image` components inside Product Cards with responsive `sizes` definitions, preloading priority flags, and blurred placeholder animations.

4. **Observability & Privacy Telemetry (Sentry)**:
   - Installed Sentry SDK integrations on both frontend and backend.
   - Implemented edge-safe privacy filters on both Django and Next.js layers to scrub raw OTP values, JWT secrets, and `Authorization`/`Cookie` headers from error telemetry logs.

5. **Structured JSON Logging Engine**:
   - Configured Django logging to output machine-readable logs in JSON format via a custom `JSONFormatter`.
   - Dedicated loggers track security anomalies (`lilla.security`) like OTP failures and transactional checkout events (`lilla.transaction`) like row-lock completions.

6. **Critical Path Integration Test Suite**:
   - Formulated a comprehensive testing framework asserting the complete OTP lifecycle, cache token clearance, JWT responses, and atomic checkout stock checks under high concurrency (e.g. database rollback when stock is depleted).
   - Configured tests to run on isolated mock-caches (`LocMemCache`) for headless test execution.

---

## Local Development & Setup

A bootstrap script `run.bat` is available in the root to quickly launch both services.

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment template and configure settings:
   ```bash
   cp .env.example .env.local
   ```
4. Start the frontend server:
   ```bash
   npm run dev
   ```

### Running Backend Tests
Ensure your backend virtual environment is active, then run:
```bash
python backend/manage.py test api
```

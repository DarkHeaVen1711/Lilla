# LILLA — Code Polish & Suggested Features Tasksheet

This tasksheet lists identified redundancies in the Lilla codebase and details proposed tasks for subsequent phases of feature development.

---

## 🔍 Redundancy and Duplicate Code Analysis

### 1. Client-Side Catalog Filtering on Server Component
- **Files**:
  - [ShopCollectionPage (shop/[...slug]/page.tsx)](file:///e:/Coding/Lilla/frontend/src/app/shop/[...slug]/page.tsx#L13-L29)
- **Problem**: The collection page fetches all products on the server side via `getProducts()` and manually filters categories and concerns in Javascript. The Django backend already supports `?category=slug` and `?concern=slug` query parameters, making this client-side filter redundant and inefficient.

### 2. Manual Navigation Link Mapping
- **Files**:
  - [navbar.tsx](file:///e:/Coding/Lilla/frontend/src/components/layout/navbar.tsx#L129-L191)
- **Problem**: Navigation links mapped in the mobile and desktop menus manually intercept "Skin" and "Makeup" strings to render specific hover/collapsible structures. This couples the layout schema directly to hardcoded categories in the frontend UI.

---

## 🛠️ Proposed Refactoring Tasks (Cleanups & Unification)

### Task Ref 4: API-Driven Collection Page Data Fetching
- **Goal**: Clean up server-side Javascript filtering in collection pages.
- **Tasks**:
  - Update `productAdapter.ts` to support fetching products by concern (e.g., `getProducts({ concernSlug })`).
  - Refactor `ShopCollectionPage` to query only relevant category or concern slug directly from the backend, removing the manual Javascript filter block.

---

## 🌟 Proposed New Feature Phases

### Phase 8: Live Autocomplete Search Suggestions
- **Goal**: Create an interactive search overlay in the navbar that suggests matching products as you type.
- **Tasks**:
  - **[Backend]**: Update `ProductViewSet` to support search queries (`?search=query`) matching names or descriptions.
  - **[Frontend]**: Upgrade the search button in the Navbar to trigger a full-screen or dropdown search overlay with a search input.
  - **[Frontend]**: Fetch products matching the query as the user types, and display search results showing the product name, price, and image with keyboard accessibility.

### Phase 9: Interactive Skincare Routine Builder (Quiz)
- **Goal**: Help users find the right combination of products using a step-by-step skincare quiz.
- **Tasks**:
  - **[Frontend]**: Build a stunning multi-step quiz page (`/routine-builder`) asking users about their skin type (dry, oily, combo, normal), skin concerns (acne, aging, pigmentation), and goals.
  - **[Frontend]**: Suggest a curated bundle of skincare/makeup products based on their answers, showing savings if bought together.
  - **[Frontend]**: Add a "Buy Routine" button to add the entire recommended bundle to the cart with one click.

### Phase 10: Dynamic Product Image Coordinate Hotspots
- **Goal**: Implement visual spec bubbles over product images on PDP pages using coordinates saved in the database.
- **Tasks**:
  - **[Frontend]**: Render an overlay on `ProductDetailPDP.tsx` product images. If `features` coordinate list exists in the product metadata (`features_json`), render clickable pins/hotspots on the image.
  - **[Frontend]**: When a hotspot is clicked or hovered, display an elegant popover containing the feature badge, title, and description.

### Phase 11: Real-time Multi-Currency Switcher
- **Goal**: Allow international customers to shop and check out in their preferred currency (USD, EUR, GBP, INR).
- **Tasks**:
  - **[Backend]**: Create a lightweight currency rate cache service or endpoint that retrieves current currency conversion rates.
  - **[Frontend]**: Add a currency selector dropdown in the announcement bar or footer.
  - **[Frontend]**: Dynamically format all prices throughout the app and ensure correct conversions are computed and sent during checkout.

### Phase 12: SEO Rich Snippets & Sharing Previews
- **Goal**: Boost SEO indexing and visual link sharing for PDP detail pages.
- **Tasks**:
  - **[Frontend]**: Add dynamic Metadata generation (`generateMetadata()`) to `products/[slug]/page.tsx` pulling title, description, and image URL for OpenGraph and Twitter cards.
  - **[Frontend]**: Inject structured JSON-LD (schema.org/Product) script in the PDP header, containing rating, reviews count, price, and availability to enable Google rich search snippets.

### Phase 13: Customer Saved Address Book & Profile Center
- **Goal**: Enable customers to manage their shipping details and profiles from a centralized account dashboard.
- **Tasks**:
  - **[Frontend]**: Build an Address Book tab in `/account` displaying all saved shipping/billing addresses from `/api/addresses/`.
  - **[Frontend]**: Render interactive modals allowing users to add, edit, or delete addresses and set a default address.
  - **[Frontend]**: Add a profile editor to let users update their contact names, emails, and phone numbers.

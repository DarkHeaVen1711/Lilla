import { test, expect } from "@playwright/test";

test("should verify catalogue renders and checkout redirects to login", async ({ page }) => {
  // Mock API requests
  await page.route("**/api/homepage/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ bestSellers: [], newLaunches: [], makeup: [], skin: [] }),
    });
  });

  // Check catalogue page rendering
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  const catalogHeading = page.locator("h1").first();
  await expect(catalogHeading).toBeVisible();

  // Verify cart page loads
  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  const cartHeading = page.locator("h1").first();
  await expect(cartHeading).toBeVisible();

  // Verify checkout server-side middleware redirects to login when unauthenticated
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.waitForURL("**/login**", { waitUntil: "domcontentloaded" });
  expect(page.url()).toContain("/login");
});

test("should verify product adds to cart and updates navbar badge", async ({ page }) => {
  const mockProduct = {
    id: "lilaa-glowy-cream",
    slug: "lilaa-glowy-cream",
    name: "Lilaa glowy cream (30ml)",
    description: "A lightweight cream for a luminous finish.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/magnific_change-the-logo-to-img1-d_2974524054%201-1E5ZDnAdm0KkWgWRhOTOwsLYIsPEGK.png",
    price: 18,
    originalPrice: 20,
    discount: "10% off",
    rating: 4.8,
    reviews: 108,
    category: "Skin",
    expiresOn: "2028-12-31"
  };

  // Mock homepage API
  await page.route("**/api/homepage/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bestSellers: [mockProduct],
        newLaunches: [],
        makeup: [],
        skin: []
      }),
    });
  });

  // Mock product detail API
  await page.route("**/api/products/lilaa-glowy-cream/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockProduct),
    });
  });

  // Pre-authenticate user via local storage to bypass auth gate
  await page.addInitScript(() => {
    try {
      const existing = localStorage.getItem("lilla-store");
      const parsed = existing ? JSON.parse(existing) : { state: {} };
      parsed.state = parsed.state || {};
      parsed.state.user = {
        token: "mock-token",
        identityString: "testuser@example.com",
        isGuest: false,
        isStaff: false,
        metadata: {},
      };
      localStorage.setItem("lilla-store", JSON.stringify(parsed));
    } catch (e) {
      // ignore
    }
  });

  // Go to homepage
  await page.goto("/");

  // Verify that the HeroProductCard add button is visible
  const heroAddButton = page.locator('button[aria-label="Add to cart"]');
  await expect(heroAddButton).toBeVisible();

  // Verify the cart badge shows 1
  const cartBadge = page.locator('a[aria-label="Cart"] span');

  // Click add to cart and verify badge updates, retrying to handle hydration delay
  await expect(async () => {
    await heroAddButton.click();
    await expect(cartBadge).toHaveText("1");
  }).toPass({ timeout: 5000 });

  // Navigate to Product Detail Page (PDP)
  await page.goto("/products/lilaa-glowy-cream");

  // Verify add button on PDP is visible
  const pdpAddButton = page.locator('button:has-text("Add to cart")').first();
  await expect(pdpAddButton).toBeVisible();

  // Increase quantity to 2
  const plusButton = page.locator('button[aria-label="Increase quantity"]');
  const quantityValue = page.locator('span.w-10.text-center.font-extrabold');
  
  // Retrying click to ensure React hydration has finished and input updates
  await expect(async () => {
    await plusButton.click();
    await expect(quantityValue).toHaveText("2");
  }).toPass({ timeout: 5000 });

  // Click add to cart on PDP
  await pdpAddButton.click();

  // Verify navbar cart badge updates to 3
  await expect(cartBadge).toHaveText("3");

  // Go to cart page
  await page.goto("/cart", { waitUntil: "domcontentloaded" });

  // Verify cart item is listed
  await expect(page.locator('h3:has-text("Lilaa glowy cream (30ml)")').first()).toBeVisible();
});

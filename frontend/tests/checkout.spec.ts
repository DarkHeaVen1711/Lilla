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
  await page.goto("/shop");
  const catalogHeading = page.locator("h1");
  await expect(catalogHeading).toBeVisible();

  // Verify cart page loads
  await page.goto("/cart");
  const cartHeading = page.locator("h1");
  await expect(cartHeading).toBeVisible();

  // Verify checkout server-side middleware redirects to login when unauthenticated
  await page.goto("/checkout");
  await page.waitForURL("**/login**");
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

  // Go to homepage
  await page.goto("/");

  // Verify that the HeroProductCard add button is visible
  const heroAddButton = page.locator('button[aria-label="Add to cart"]');
  await expect(heroAddButton).toBeVisible();

  // Click add to cart
  await heroAddButton.click();

  // Verify the cart badge shows 1
  const cartBadge = page.locator('a[aria-label="Cart"] span');
  await expect(cartBadge).toHaveText("1");

  // Navigate to Product Detail Page (PDP)
  await page.goto("/products/lilaa-glowy-cream");

  // Verify add button on PDP is visible
  const pdpAddButton = page.locator('button:has-text("Add to cart")').first();
  await expect(pdpAddButton).toBeVisible();

  // Increase quantity to 2
  const plusButton = page.locator('button:has(svg.lucide-plus)');
  await plusButton.click();

  // Click add to cart on PDP
  await pdpAddButton.click();

  // Verify navbar cart badge updates to 3
  await expect(cartBadge).toHaveText("3");

  // Go to cart page
  await page.goto("/cart");

  // Verify cart item is listed
  await expect(page.locator('p:has-text("Lilaa glowy cream (30ml)")').first()).toBeVisible();
});

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

// Rayyan Ismail. A0259275R
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // Rayyan Ismail. A0259275R
  test("should display all products with names and prices", async ({
    page,
  }) => {
    // All 6 seed products should be visible
    await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'The Law of Contract in Singapore' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();

    // Spot-check prices
    await expect(page.getByText("$1,499.99")).toBeVisible();
    await expect(page.getByText("$4.99")).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should display category filter checkboxes", async ({ page }) => {
    await expect(page.getByText("Filter By Category")).toBeVisible();

    await expect(page.getByRole("checkbox", { name: "Electronics" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Book" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Clothing" })).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should display price filter radio buttons", async ({ page }) => {
    await expect(page.getByText("Filter By Price")).toBeVisible();

    await expect(page.getByRole("radio", { name: "$0 to 19" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$20 to 39" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$40 to 59" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$60 to 79" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$80 to 99" })).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "$100 or more" })
    ).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter products by category", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Clothing" }).check();

    // Wait for filtered results
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();

    // Other products should not be visible
    await expect(page.getByRole('heading', { name: 'Laptop' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smartphone' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Textbook' })).not.toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter products by price range", async ({ page }) => {
    await page.getByRole("radio", { name: "$0 to 19" }).check();

    // NUS T-shirt ($4.99) and Novel ($14.99) are in range
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();

    // Laptop ($1,499.99) should not be visible
    await expect(page.getByRole('heading', { name: 'Laptop' })).not.toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should reset filters and show all products", async ({ page }) => {
    // Apply a category filter first
    await page.getByRole("checkbox", { name: "Clothing" }).check();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Laptop' })).not.toBeVisible();

    // Reset filters (triggers window.location.reload)
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "RESET FILTERS" }).click(),
    ]);

    // All products should be visible again
    await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should navigate to product details page on 'More Details' click", async ({
    page,
  }) => {
    // Find the Laptop card and click its More Details button
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "More Details" }).click();

    await page.waitForURL("**/product/laptop");
    await expect(page).toHaveURL(/\/product\/laptop/);
  });

  // Rayyan Ismail. A0259275R
  test("should show toast notification on 'ADD TO CART' click", async ({
    page,
  }) => {
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "ADD TO CART" }).click();

    await expect(page.getByText("Item Added to cart")).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter by multiple categories", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Electronics" }).check();
    await page.getByRole("checkbox", { name: "Clothing" }).check();

    // Electronics and Clothing products should be visible
    await expect(page.getByRole("heading", { name: "Laptop" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Smartphone" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "NUS T-shirt" })
    ).toBeVisible();

    // Book products should not be visible
    await expect(
      page.getByRole("heading", { name: "Textbook" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Novel" })
    ).not.toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter by category and then by price range", async ({
    page,
  }) => {
    // Filter by Book category
    await page.getByRole("checkbox", { name: "Book" }).check();
    await expect(page.getByRole("heading", { name: "Textbook" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Novel" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The Law of Contract in Singapore" })
    ).toBeVisible();

    // Further filter by price $40 to 59
    await page.getByRole("radio", { name: "$40 to 59" }).check();

    // Only The Law of Contract in Singapore ($54.99) should remain
    await expect(
      page.getByRole("heading", { name: "The Law of Contract in Singapore" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Textbook" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Novel" })
    ).not.toBeVisible();
  });
});

// Rayyan Ismail. A0259275R
import { test, expect } from "@playwright/test";

test.describe("Cart", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart in localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("cart"));
    await page.reload();
  });

  // Rayyan Ismail. A0259275R
  test("should update cart badge count when adding a product", async ({
    page,
  }) => {
    // Badge should initially show 0
    const cartBadge = page.locator(".ant-badge");
    await expect(cartBadge).toContainText("0");

    // Add first product
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(cartBadge).toContainText("1");

    // Add second product
    const novelCard = page.locator(".card", { hasText: "Novel" });
    await novelCard.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(cartBadge).toContainText("2");
  });

  // Rayyan Ismail. A0259275R
  test("should update cart badge count when removing a product", async ({
    page,
  }) => {
    const cartBadge = page.locator(".ant-badge");

    // Add two products
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "ADD TO CART" }).click();
    const novelCard = page.locator(".card", { hasText: "Novel" });
    await novelCard.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(cartBadge).toContainText("2");

    // Navigate to cart page
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("**/cart");

    // Remove one item
    await page
      .locator(".card", { hasText: "Laptop" })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(cartBadge).toContainText("1");
  });

  // Rayyan Ismail. A0259275R
  test("should display added products on the cart page", async ({ page }) => {
    // Add Laptop and NUS T-shirt to cart
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByText("Item Added to cart")).toBeVisible();

    const tshirtCard = page.locator(".card", { hasText: "NUS T-shirt" });
    await tshirtCard.getByRole("button", { name: "ADD TO CART" }).click();

    // Navigate to cart page
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("**/cart");

    // Verify both products are shown on cart page
    await expect(page.getByText("You Have 2 items in your cart")).toBeVisible();
    await expect(
      page.locator(".card", { hasText: "Laptop" })
    ).toBeVisible();
    await expect(
      page.locator(".card", { hasText: "NUS T-shirt" })
    ).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should display accurate total price on the cart page", async ({
    page,
  }) => {
    // Add Laptop ($1,499.99) and NUS T-shirt ($4.99) to cart
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByText("Item Added to cart")).toBeVisible();

    const tshirtCard = page.locator(".card", { hasText: "NUS T-shirt" });
    await tshirtCard.getByRole("button", { name: "ADD TO CART" }).click();

    // Navigate to cart page
    await page.getByRole("link", { name: "Cart" }).click();
    await page.waitForURL("**/cart");

    // Total should be $1,499.99 + $4.99 = $1,504.98
    await expect(page.getByText("$1,504.98")).toBeVisible();
  });
});

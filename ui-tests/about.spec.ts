import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/about");
});

test.describe("About page", () => {
    // Sebastian Tay, A0252864X
  test("renders successfully via direct route", async ({ page }) => {
    await expect(page).toHaveURL(/\/about$/);
    await expect(page).toHaveTitle("About us - Ecommerce app");
    await expect(page.getByAltText("about us")).toBeVisible();
    await expect(page.getByText("Add text")).toBeVisible();

  });
});

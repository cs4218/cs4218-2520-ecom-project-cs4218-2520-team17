import { expect, test } from "@playwright/test";

test.describe("Not Found page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
  });

  // Sebastian Tay, A0252864X
  test("renders text to inform users the page is not found", async ({ page }) => {
    await expect(page).toHaveURL(/\/this-route-does-not-exist$/);
    await expect(page).toHaveTitle("Page not found");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Oops ! Page Not Found" })).toBeVisible();
  });

  // Sebastian Tay, A0252864X
  test('"Go Back" link routes users to a valid page', async ({ page }) => {
    await page.getByRole("link", { name: "Go Back" }).click();
    await page.waitForURL("**/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle("ALL Products - Best offers ");
  });
});

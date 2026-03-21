import { expect, test } from "@playwright/test";

test.describe("Contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Contact" }).click();
    await page.waitForURL("**/contact");
  });

  // Sebastian Tay, A0252864X
  test("navigates from footer and renders expected contact content", async ({ page }) => {
    await expect(page).toHaveTitle("Contact us");
    await expect(page.getByRole("heading", { name: "CONTACT US" })).toBeVisible();
    await expect(page.getByAltText("contactus")).toBeVisible(); //Image

    await expect(page.locator("p").filter({ hasText: "www.help@ecommerceapp.com" })).toBeVisible();
    await expect(page.locator("p").filter({ hasText: "012-3456789" })).toBeVisible();
    await expect(page.locator("p").filter({ hasText: "1800-0000-0000" })).toBeVisible();
  });
});

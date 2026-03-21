import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await page.waitForURL("**/policy");
});

test.describe("Policy page", () => {
  // Sebastian Tay, A0252864X
  test("navigates from footer and renders expected policy content", async ({ page }) => {
    await expect(page).toHaveTitle("Privacy Policy");
    await expect(page.getByAltText("contactus")).toBeVisible();

    const policyParagraphs = page
      .locator("p")
      .filter({ hasText: "add privacy policy" });
    await expect(policyParagraphs).toHaveCount(1);
  });
});

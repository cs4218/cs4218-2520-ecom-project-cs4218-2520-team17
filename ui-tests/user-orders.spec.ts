import { expect, test } from "@playwright/test";
import { logInAsUser, logOutAsUser, openDashboard} from "./utils/user";

test.describe("User orders page", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsUser(page);
    await openDashboard(page);
    await page.getByRole("link", { name: "Orders" }).click();
  });

  test.afterEach(async ({ page }) => {
    await logOutAsUser(page);
    await page.close();
  });

  // Sebastian Tay, A0252864X
  test("displays user orders and product details", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();

    const firstOrder = page.locator("div.border.shadow").first();

    await expect(firstOrder.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(firstOrder.getByRole("cell", { name: "1", exact: true })).toBeVisible();
    await expect(
      firstOrder.getByRole("cell", {
        name: /Not Process|Processing|Shipped|Delivered|Cancelled/i,
      })
    ).toBeVisible();
    await expect(firstOrder.getByRole("cell", { name: "CS 4218 Test Account", exact: true })).toBeVisible();
    await expect(firstOrder.getByRole("cell", { name: "Failed", exact: true })).toBeVisible();
    await expect(firstOrder.getByRole("cell", { name: "3", exact: true })).toBeVisible();
    await expect(firstOrder.getByRole("cell", { name: /ago|seconds|minutes|hours|days/i })).toBeVisible();


    const orderItems = firstOrder.locator("div.row.mb-2.p-3.card.flex-row");
    await expect(orderItems).toHaveCount(3);

    await expect(orderItems.nth(0)).toContainText("NUS T-shirt");
    await expect(orderItems.nth(0)).toContainText("Plain NUS T-shirt for sale");
    await expect(orderItems.nth(0)).toContainText("Price : 4.99");

    await expect(orderItems.nth(1)).toContainText("Laptop");
    await expect(orderItems.nth(1)).toContainText("A powerful laptop");
    await expect(orderItems.nth(1)).toContainText("Price : 1499.99");

    await expect(orderItems.nth(2)).toContainText("Laptop");
    await expect(orderItems.nth(2)).toContainText("A powerful laptop");
    await expect(orderItems.nth(2)).toContainText("Price : 1499.99");

    for (let i = 0; i < 3; i++) {
      const itemImage = orderItems.nth(i).locator("img.card-img-top");
      await expect(itemImage).toBeVisible();

      const imageLoaded = await itemImage.evaluate((img) => {
        const image = img as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      });
      expect(imageLoaded).toBeTruthy();
    }

  });
});

import { expect, test } from "@playwright/test";
import { logInAsAdmin, logOutAsAdmin, openAdminDashboard } from "./utils/admin";

test.describe
  .serial("Admin order management", () => {
    test.beforeEach(async ({ page }) => {
      await logInAsAdmin(page);
      await openAdminDashboard(page);
      await page.getByRole("link", { name: "Orders" }).click();
      await expect(page.getByTestId("admin-orders-content-col")).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
      await logOutAsAdmin(page);
      await page.close();
    });

    // Li Jiakai, A0252287Y
    test("View Orders: verify order details are shown", async ({ page }) => {
      // All Orders heading
      await expect(
        page.getByTestId("admin-orders-content-col").getByRole("heading"),
      ).toContainText("All Orders");

      // Orders Table
      await expect(
        page
          .getByTestId("admin-orders-content-col")
          .locator("div")
          .filter({ hasText: "#" }),
      ).toBeVisible();

      // Order Details
      await expect(
        page.getByRole("cell", {
          name: "67a21938cf4efddf1e5358d1",
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByRole("cell", { name: "Not Process", exact: true }),
      ).toBeVisible();

      await expect(
        page.getByRole("cell", { name: "CS 4218 Test Account", exact: true }),
      ).toBeVisible();

      await expect(page.getByRole("cell", { name: " ago" })).toBeVisible();

      await expect(page.getByTestId("order-payment-status")).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "Failed", exact: true }),
      ).toBeVisible();

      await expect(page.getByTestId("order-product-count")).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "3", exact: true }),
      ).toBeVisible();

      // Order Items
      const orderItems = page.locator("div.row.mb-2.p-3.card.flex-row");
      await expect(orderItems).toHaveCount(3);

      await expect(orderItems.nth(0)).toContainText("NUS T-shirt");
      await expect(orderItems.nth(0)).toContainText("4.99");

      await expect(orderItems.nth(1)).toContainText("Laptop");
      await expect(orderItems.nth(1)).toContainText("1499.99");

      await expect(orderItems.nth(2)).toContainText("Laptop");
      await expect(orderItems.nth(2)).toContainText("1499.99");
    });

    // Li Jiakai, A0252287Y
    test("Update Order Status: verify update persistence", async ({ page }) => {
      // Update Not Process to Processing
      await page
        .getByTestId("admin-orders-content-col")
        .getByText("Not Process")
        .click();
      await page.getByTitle("Processing").locator("div").click();
      // Navigate away and back to Orders page to verify persistence
      await page.getByRole("link", { name: "Products" }).click();
      await page.getByRole("link", { name: "Orders" }).click();
      await expect(page.locator("tbody")).toContainText("Processing");
    });
  });

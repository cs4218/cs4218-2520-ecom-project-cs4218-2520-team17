import { expect, test } from "@playwright/test";
import { logInAsAdmin, logOutAsAdmin, openAdminDashboard } from "./utils/admin";

const VALID_ORDER_STATUSES = [
  "Not Process",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

const validStatusRegex = new RegExp(`^(${VALID_ORDER_STATUSES.join("|")})$`);

test.describe("Admin order management", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsAdmin(page);
    await openAdminDashboard(page);
    await page.getByRole("link", { name: "Orders" }).click();
    // Early fail if fetch orders fails
    await expect(page.getByText("Failed to fetch orders")).not.toBeVisible();
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

    // Specify an known order
    const specificOrder = page
      .getByTestId("admin-orders-content-col")
      .locator("div.border.shadow")
      .filter({ hasText: "67a21938cf4efddf1e5358d1" });

    // Orders Table
    await expect(specificOrder).toBeVisible();

    // Order Details
    await expect(
      specificOrder.getByRole("cell", {
        name: "67a21938cf4efddf1e5358d1",
        exact: true,
      }),
    ).toBeVisible();

    // Allow any valid status
    await expect(
      specificOrder.getByRole("cell", {
        name: validStatusRegex,
      }),
    ).toBeVisible();

    await expect(
      specificOrder.getByRole("cell", {
        name: "CS 4218 Test Account",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      specificOrder.getByRole("cell", { name: " ago" }),
    ).toBeVisible();

    await expect(
      specificOrder.getByTestId("order-payment-status"),
    ).toBeVisible();
    await expect(
      specificOrder.getByRole("cell", { name: "Failed", exact: true }),
    ).toBeVisible();

    await expect(
      specificOrder.getByTestId("order-product-count"),
    ).toBeVisible();
    await expect(
      specificOrder.getByRole("cell", { name: "3", exact: true }),
    ).toBeVisible();

    // Order Items in the known specific order
    const orderItems = specificOrder.locator("div.row.mb-2.p-3.card.flex-row");
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
    // Order summary and items for a specific order
    const specificOrder = page
      .getByTestId("admin-orders-content-col")
      .locator("div.border.shadow")
      .filter({ hasText: "67a21938cf4efddf1e5358d1" });

    const orderStatusCell = specificOrder.getByText(validStatusRegex);

    await expect(orderStatusCell).toBeVisible();
    const currentStatus = await orderStatusCell.textContent();

    // Ensure current status is valid before attempting update
    const validStatusSet = new Set(VALID_ORDER_STATUSES);
    expect(currentStatus).not.toBeNull();
    expect(
      validStatusSet.has(
        currentStatus as (typeof VALID_ORDER_STATUSES)[number],
      ),
    ).toBeTruthy();

    // Get a different status to update to
    validStatusSet.delete(
      currentStatus as (typeof VALID_ORDER_STATUSES)[number],
    );
    // biome-ignore lint/style/noNonNullAssertion: guaranteed to have at least one other status
    const newStatus = validStatusSet.values().next().value!;

    // Update status to new value
    await orderStatusCell.click();
    await page.getByTitle(newStatus).locator("div").click();
    await expect(specificOrder.locator("tbody")).toContainText(newStatus);

    // Verify persistence after reload
    await page.reload();
    await expect(specificOrder.locator("tbody")).toContainText(newStatus);
  });
});

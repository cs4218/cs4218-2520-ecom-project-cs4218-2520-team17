import { expect, test } from "@playwright/test";
import { logInAsAdmin, logOutAsAdmin, openAdminDashboard } from "./utils/admin";

test.describe("Admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsAdmin(page);
    await openAdminDashboard(page);
  });

  test.afterEach(async ({ page }) => {
    await logOutAsAdmin(page);
    await page.close();
  });

  // Li Jiakai, A0252287Y
  test("Admin Details Display: verify admin panel and admin details are shown", async ({
    page,
  }) => {
    // Verify admin Panel
    await expect(
      page.getByRole("heading", { name: "Admin Panel" }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-menu-list")).toBeVisible();

    // Verify admin details - name, email, contact
    await expect(page.getByTestId("admin-dashboard-name")).toBeVisible();
    await expect(page.getByTestId("admin-dashboard-name")).toContainText(
      "Admin Name : Test",
    );

    await expect(page.getByTestId("admin-dashboard-email")).toBeVisible();
    await expect(page.getByTestId("admin-dashboard-email")).toContainText(
      "Admin Email : test@admin.com",
    );

    await expect(page.getByTestId("admin-dashboard-phone")).toBeVisible();
    await expect(page.getByTestId("admin-dashboard-phone")).toContainText(
      "Admin Contact : test@admin.com",
    );
  });

  // Li Jiakai, A0252287Y
  test("Admin Panel Display: verify sidebar displays all expected options", async ({
    page,
  }) => {
    const menuItems = [
      "Create Category",
      "Create Product",
      "Products",
      "Orders",
      "Users",
    ];

    for (const menuItem of menuItems) {
      const link = page.getByRole("link", { name: menuItem });
      await expect(link).toBeVisible();
    }
  });

  // Li Jiakai, A0252287Y
  test("Admin Panel Navigation: verify navigation between different sections", async ({
    page,
  }) => {
    // By default we are on the dashboard, verify heading
    await expect(page.getByTestId("admin-dashboard-name")).toContainText(
      "Admin Name : Test",
    );
    await expect(page.getByTestId("admin-dashboard-email")).toContainText(
      "Admin Email : test@admin.com",
    );
    await expect(page.getByTestId("admin-dashboard-phone")).toContainText(
      "Admin Contact : test@admin.com",
    );

    // User name button dropdown in the header should be visible
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();

    // Admin Panel sidebar should be visible
    await expect(
      page.getByRole("heading", { name: "Admin Panel" }),
    ).toBeVisible();

    // Navigate to Create Category
    await page.getByRole("link", { name: "Create Category" }).click();
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible();
    await expect(page.getByTestId("category-form")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();

    // Navigate to Create Product
    await page.getByRole("link", { name: "Create Product" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Product" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Product" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();

    // Navigate to Products
    await page.getByRole("link", { name: "Products" }).click();
    await expect(
      page.getByRole("heading", { name: "All Products List" }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-products-main-col")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();

    // Navigate to Orders
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(
      page.getByRole("heading", { name: "All Orders" }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-orders-content-col")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();

    // Navigate to Users
    await page.getByRole("link", { name: "Users" }).click();
    await expect(
      page.getByRole("heading", { name: "All Users" }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-users-main")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();

    // Reload page and verify we are still on the Users section (state persistence)
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "All Users" }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-users-main")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test" })).toBeVisible();
  });
});

import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { logInAsAdmin, logOutAsAdmin, openAdminDashboard } from "./utils/admin";

const TEST_IMAGE_DIR = path.join(__dirname, "..", "test", "img");
const TEST_IMAGE_BLUE = path.join(TEST_IMAGE_DIR, "blue.jpg");
const TEST_IMAGE_GREEN = path.join(TEST_IMAGE_DIR, "green.jpg");

function generateUniqueProductName(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

test.describe("Admin product management", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsAdmin(page);
    await openAdminDashboard(page);
  });

  test.afterEach(async ({ page }) => {
    await logOutAsAdmin(page);
    await page.close();
  });

  test("Product Creation: create product with image and verify success", async ({
    page,
  }) => {
    const productName = generateUniqueProductName("NewProduct");

    // Navigate to product creation
    await page.getByRole("link", { name: "Create Product" }).click();

    // Select Category
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Electronics").click();

    // Upload Image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_BLUE);

    // Verify image preview
    await expect(
      page.getByRole("img", { name: /product_photo/i }),
    ).toBeVisible();

    // Fill product details
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill(`Description for ${productName}`);
    await page.getByPlaceholder(/price/i).fill("999");
    await page.getByPlaceholder(/quantity/i).fill("15");
    await page.getByTestId("shipping-select").click();
    await page.getByText("Yes", { exact: true }).click();

    // Submit form
    await page.getByRole("button", { name: "Create Product" }).click();

    // Verify success and redirection to product listing
    await expect(page.getByText("Product Created Successfully")).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(productName, "i") }).first(),
    ).toBeVisible();
  });

  test("Product Creation: create product without image and verify success", async ({
    page,
  }) => {
    const productName = generateUniqueProductName("NewProductNoImage");

    // Navigate to product creation
    await page.getByRole("link", { name: "Create Product" }).click();

    // Select Category
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Book").click();

    // Fill product details
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill(`Description for ${productName}`);
    await page.getByPlaceholder(/price/i).fill("12.34");
    await page.getByPlaceholder(/quantity/i).fill("1");
    await page.getByTestId("shipping-select").click();
    await page.getByText("No", { exact: true }).click();

    // Submit form
    await page.getByRole("button", { name: "Create Product" }).click();

    // Verify success and redirection to product listing
    await expect(page.getByText("Product Created Successfully")).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(productName, "i") }).first(),
    ).toBeVisible();
  });

  test("Product Creation: create product shows error if required fields are empty", async ({
    page,
  }) => {
    const productName = generateUniqueProductName("NewProduct");

    // Navigate to product creation
    await page.getByRole("link", { name: "Create Product" }).click();

    const submitButton = page.getByRole("button", { name: "Create Product" });

    // Try submit when all fields are empty
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toBeVisible();

    // Fill category and submit
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Clothing").click();
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(2);

    // Fill name and submit
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(3);

    // Fill description and submit
    await page
      .getByRole("textbox", { name: /description/i })
      .fill(`Description for ${productName}`);
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(4);

    // Fill price and submit
    await page.getByPlaceholder(/price/i).fill("12.34");
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(5);

    // Fill quantity and submit
    await page.getByPlaceholder(/quantity/i).fill("1");
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(6);

    // Select shipping and submit
    await page.getByTestId("shipping-select").click();
    await page.getByText("No", { exact: true }).click();
    await submitButton.click();

    // Verify success after all fields are filled
    await expect(page.getByText("Product Created Successfully")).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(productName, "i") }).first(),
    ).toBeVisible();
  });

  test("Product Update: check pre-filled product details and verify edit success", async ({
    page,
  }) => {
    const productName = generateUniqueProductName("UpdateProduct");
    const updatedName = `${productName}-Edited`;

    // Create a product first
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Book").click();
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE_BLUE);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill("Test Description");
    await page.getByPlaceholder(/price/i).fill("50");
    await page.getByPlaceholder(/quantity/i).fill("10");
    await page.locator(".ant-select-selector").nth(1).click();
    await page.getByText("No", { exact: true }).click();
    await page.getByRole("button", { name: "Create Product" }).click();

    // Navigate to edit screen
    const productLink = page
      .getByRole("link", { name: new RegExp(productName, "i") })
      .first();
    await expect(productLink).toBeVisible();
    await productLink.click();

    // Wait for product to be loaded
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      productName,
    );

    // Verify inputs are pre-filled correctly
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      productName,
    );
    await expect(
      page.getByRole("textbox", { name: /description/i }),
    ).toHaveValue("Test Description");
    await expect(
      page.getByRole("img", { name: /product_photo/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/price/i)).toHaveValue("50");
    await expect(page.getByPlaceholder(/quantity/i)).toHaveValue("10");
    await expect(
      page.getByTestId("shipping-select").getByText("No"),
    ).toBeVisible();

    // Update Product
    await page.getByRole("textbox", { name: /name/i }).fill(updatedName);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill("Updated Description");
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE_GREEN);
    await page.getByPlaceholder(/price/i).fill("75");
    await page.getByPlaceholder(/quantity/i).fill("5");
    await page.getByTestId("shipping-select").click();
    await page.getByText("Yes", { exact: true }).click();

    // Verify image preview
    await expect(
      page.getByRole("img", { name: /product_photo/i }),
    ).toBeVisible();

    // Submit update
    await page.getByRole("button", { name: "Update Product" }).click();

    // Verify changes in product list
    await expect(page.getByText("Product Updated Successfully")).toBeVisible();
    await page.reload();
    await page.getByRole("link", { name: "Products" }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(updatedName, "i") }).first(),
    ).toBeVisible();
  });

  test("Product Update: update product shows error if required fields are empty", async ({
    page,
  }) => {
    const productName = generateUniqueProductName("EmptyFieldUpdate");
    const updatedName = `${productName}-Edited`;

    // Create a product first
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Book").click();
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill("Test Description");
    await page.getByPlaceholder(/price/i).fill("50");
    await page.getByPlaceholder(/quantity/i).fill("10");
    await page.locator(".ant-select-selector").nth(1).click();
    await page.getByText("No", { exact: true }).click();
    await page.getByRole("button", { name: "Create Product" }).click();

    // Navigate to edit screen
    const productLink = page
      .getByRole("link", { name: new RegExp(productName, "i") })
      .first();
    await expect(productLink).toBeVisible();
    await productLink.click();

    // Wait for product to be loaded
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      productName,
    );

    const submitButton = page.getByRole("button", { name: "Update Product" });

    // Set name to empty and submit
    await page.getByRole("textbox", { name: /name/i }).fill("");
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toBeVisible();
    await page.getByRole("textbox", { name: /name/i }).fill(updatedName);

    // Set description to empty and submit
    await page.getByRole("textbox", { name: /description/i }).fill("");
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(2);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill("Updated Description");

    // Set price to empty and submit
    await page.getByPlaceholder(/price/i).fill("");
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(3);
    await page.getByPlaceholder(/price/i).fill("1000");

    // Set quantity to empty and submit
    await page.getByPlaceholder(/quantity/i).fill("");
    await submitButton.click();
    await expect(page.getByText("Something went wrong")).toHaveCount(4);
    await page.getByPlaceholder(/quantity/i).fill("100");

    // Set shipping to empty and submit
    await page.getByTestId("shipping-select").click();
    await page.getByText("Yes", { exact: true }).click();
    await submitButton.click();

    // Verify success after all fields are filled
    await expect(page.getByText("Product Updated Successfully")).toBeVisible();
    await page.reload();
    await page.getByRole("link", { name: "Products" }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(updatedName, "i") }).first(),
    ).toBeVisible();
  });

  test("Product Deletion: cancel deletion dialog", async ({ page }) => {
    const productName = generateUniqueProductName("DeleteCancel");

    // Setup: Create a product
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Clothing").click();
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill("To be canceled");
    await page.getByPlaceholder(/price/i).fill("10");
    await page.getByPlaceholder(/quantity/i).fill("1");
    await page.getByTestId("shipping-select").click();
    await page.getByText("Yes", { exact: true }).click();
    await page.getByRole("button", { name: "Create Product" }).click();

    // Click on the product to enter details/edit screen
    await page
      .getByRole("link", { name: new RegExp(productName, "i") })
      .first()
      .click();

    // Wait for product to be loaded
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      productName,
    );

    // Handle dialog: Cancel
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBeTruthy();
      dialog.dismiss().catch(() => {});
    });

    await page.getByRole("button", { name: "Delete Product" }).click();

    // Verify still on product details screen
    await expect(
      page.getByRole("heading", { name: "Update Product" }),
    ).toBeVisible();

    // Check product still exists in the list
    await page.getByRole("link", { name: "Products" }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(productName, "i") }).first(),
    ).toBeVisible();
  });

  test("Product Deletion: accept deletion dialog and verify removal", async ({
    page,
  }) => {
    const productName = generateUniqueProductName("DeleteAccept");

    // Setup: Create a product
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.locator(".ant-select-selector").first().click();
    await page.getByTitle("Clothing").click();
    await page.getByRole("textbox", { name: /name/i }).fill(productName);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill("To be deleted");
    await page.getByPlaceholder(/price/i).fill("20");
    await page.getByPlaceholder(/quantity/i).fill("5");
    await page.getByTestId("shipping-select").click();
    await page.getByText("Yes", { exact: true }).click();
    await page.getByRole("button", { name: "Create Product" }).click();

    // Click on the product
    await page
      .getByRole("link", { name: new RegExp(productName, "i") })
      .first()
      .click();

    // Wait for product to be loaded
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      productName,
    );

    // Handle dialog: Accept
    page.once("dialog", (dialog) => {
      dialog.accept().catch(() => {});
    });

    await page.getByRole("button", { name: "Delete Product" }).click();

    // Check for success message
    await expect(page.getByText("Product Deleted Successfully")).toBeVisible();

    // Verify product is removed from the list
    await page.getByRole("link", { name: "Products" }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(productName, "i") }),
    ).toHaveCount(0);
  });
});

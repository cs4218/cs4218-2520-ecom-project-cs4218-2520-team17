import { expect, test } from "@playwright/test";
import { logInAsAdmin, logOutAsAdmin, openAdminDashboard } from "./utils/admin";
import { deleteCategory } from "./utils/categories";

// Helper to generate unique category names
function generateUniqueCategoryName(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

test.describe
  .serial("Admin category management", () => {
    test.beforeEach(async ({ page }) => {
      await logInAsAdmin(page);
      await openAdminDashboard(page);
      await page.getByRole("link", { name: "Create Category" }).click();
    });

    test.afterEach(async ({ page }) => {
      await logOutAsAdmin(page);
      await page.close();
    });

    // Li Jiakai, A0252287Y
    test("Category List Display: verify default categories are shown", async ({
      page,
    }) => {
      // Verify heading
      await expect(
        page.getByRole("heading", { name: "Manage Category" }),
      ).toBeVisible();

      // Verify default categories exist (Electronics, Book, Clothing)
      await expect(
        page.getByRole("cell", { name: "Electronics" }),
      ).toBeVisible();
      await expect(page.getByRole("cell", { name: "Book" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Clothing" })).toBeVisible();

      // Verify at least 3 sets of Edit/Delete buttons exist (for the default categories)
      const editDeleteCells = page.getByRole("cell", { name: "Edit Delete" });
      for (let i = 0; i < 3; i++) {
        await expect(
          editDeleteCells.nth(i).getByRole("button", { name: "Edit" }),
        ).toBeVisible();
        await expect(
          editDeleteCells.nth(i).getByRole("button", { name: "Delete" }),
        ).toBeVisible();
      }
    });

    // Li Jiakai, A0252287Y
    test("Category Creation: create new category and verify it appears in list", async ({
      page,
    }) => {
      const newCategoryName = generateUniqueCategoryName("TestCategory");

      // Fill in category name
      await page
        .getByRole("textbox", { name: "Enter new category" })
        .fill(newCategoryName);

      // Submit
      await page.getByRole("button", { name: "Submit" }).click();

      // Verify success message
      await expect(
        page.getByText(`Category ${newCategoryName} created`),
      ).toBeVisible();

      // Verify new category appears in list
      await expect(page.locator("tbody")).toContainText(newCategoryName);

      // Cleanup: Delete the created category
      await deleteCategory(page, newCategoryName);
    });

    // Li Jiakai, A0252287Y
    test("Category Creation Validation: empty submission shows error", async ({
      page,
    }) => {
      const categoryInput = page.getByRole("textbox", {
        name: "Enter new category",
      });

      // Empty submission
      await categoryInput.click();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(
        page.getByText("Something went wrong in input"),
      ).toBeVisible();
    });

    // Li Jiakai, A0252287Y
    test("Category Creation Validation: duplicate category submission shows error", async ({
      page,
    }) => {
      const categoryInput = page.getByRole("textbox", {
        name: "Enter new category",
      });

      // Electronics is guaranteed to exist
      await categoryInput.fill("Electronics");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(
        page.getByText("Something went wrong in input"),
      ).toBeVisible();
    });

    // Li Jiakai, A0252287Y
    test("Category Creation with Special Characters: verify handling of valid special characters", async ({
      page,
    }) => {
      const categoryWithSpecialChars =
        generateUniqueCategoryName("Category:123#-Tech");

      await page
        .getByRole("textbox", { name: "Enter new category" })
        .fill(categoryWithSpecialChars);
      await page.getByRole("button", { name: "Submit" }).click();

      // Verify success
      await expect(
        page.getByText(`Category ${categoryWithSpecialChars} created`),
      ).toBeVisible();

      // Verify in list
      await expect(page.locator("tbody")).toContainText(
        categoryWithSpecialChars,
      );

      // Cleanup: Delete the created category
      await deleteCategory(page, categoryWithSpecialChars);
    });

    // Li Jiakai, A0252287Y
    test("Category Update: edit category and verify persistence", async ({
      page,
    }) => {
      // First create a category to edit
      const originalName = generateUniqueCategoryName("EditTest");
      const updatedName = generateUniqueCategoryName("EditTestUpdated");

      await page.getByRole("link", { name: "Create Category" }).click();
      await page
        .getByRole("textbox", { name: "Enter new category" })
        .fill(originalName);
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page.getByText(`Category ${originalName} created`),
      ).toBeVisible();
      await expect(page.locator("tbody")).toContainText(originalName);

      // Find and click Edit button for the category
      const categoryRow = page
        .getByTestId("category-row")
        .filter({ hasText: originalName });
      await expect(categoryRow).toBeVisible();

      const editButton = categoryRow.getByRole("button", { name: "Edit" });
      await expect(editButton).toBeVisible();

      await editButton.click();

      // Update the category name in modal
      const dialogInput = page
        .getByRole("dialog")
        .getByRole("textbox", { name: "Enter new category" });
      await expect(dialogInput).toBeVisible();
      await dialogInput.fill(updatedName);

      // Submit update
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Submit" })
        .click();

      // Verify update success message
      await expect(
        page.getByText(`Category ${updatedName} is updated`),
      ).toBeVisible();

      // Verify updated name appears in list
      await expect(page.locator("tbody")).toContainText(updatedName);

      // Reload page and verify persistence
      await page.reload();
      await expect(page.locator("tbody")).toContainText(updatedName);

      // Cleanup: Delete the updated category
      await deleteCategory(page, updatedName);
    });

    // Li Jiakai, A0252287Y
    test("Category Deletion: delete category and verify removal from list", async ({
      page,
    }) => {
      // Create a category to delete
      const categoryToDelete = generateUniqueCategoryName("DeleteMe");

      await page.getByRole("link", { name: "Create Category" }).click();
      await page
        .getByRole("textbox", { name: "Enter new category" })
        .fill(categoryToDelete);
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page.getByText(`Category ${categoryToDelete} created`),
      ).toBeVisible();
      await expect(page.locator("tbody")).toContainText(categoryToDelete);

      // Find and click Delete button for our specific category
      await deleteCategory(page, categoryToDelete);

      // Verify category is removed from list
      await expect(page.locator("tbody")).not.toContainText(categoryToDelete);

      // Reload and verify persistence of deletion
      await page.reload();
      await expect(page.locator("tbody")).not.toContainText(categoryToDelete);
    });

    // Li Jiakai, A0252287Y
    test("Category Update: editing to duplicate category", async ({ page }) => {
      // Verify Clothing category exists
      await expect(page.getByRole("cell", { name: "Clothing" })).toBeVisible();

      const tempCategoryName = generateUniqueCategoryName("TempCategory");

      await page.getByRole("link", { name: "Create Category" }).click();
      await page
        .getByRole("textbox", { name: "Enter new category" })
        .fill(tempCategoryName);
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page.getByText(`Category ${tempCategoryName} created`),
      ).toBeVisible();
      await expect(page.locator("tbody")).toContainText(tempCategoryName);

      // Find and click Edit button for the category
      const categoryRow = page
        .getByTestId("category-row")
        .filter({ hasText: tempCategoryName });
      await expect(categoryRow).toBeVisible();

      const editButton = categoryRow.getByRole("button", { name: "Edit" });
      await expect(editButton).toBeVisible();

      await editButton.click();

      // Update the category name in modal
      const dialogInput = page
        .getByRole("dialog")
        .getByRole("textbox", { name: "Enter new category" });
      await expect(dialogInput).toBeVisible();
      await dialogInput.fill("Clothing");

      // Submit update
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Submit" })
        .click();

      // Verify error message about duplicate category
      await expect(page.getByText("Something went wrong")).toBeVisible();
      await expect(
        page.getByText(`Category Clothing is updated`),
      ).not.toBeVisible();

      // Force close the modal
      await page.reload();

      // Cleanup: Delete the temp category
      await deleteCategory(page, tempCategoryName);
    });
  });

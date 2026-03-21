import { expect, type Page } from "@playwright/test";

/**
 * Deletes a category with the given name from the admin categories list.
 * Ensure that the current page is the admin categories list page before calling this function.
 * @param page - page object
 * @param categoryName - name of the category to delete
 */
export async function deleteCategory(page: Page, categoryName: string) {
  const categoryRow = page
    .getByTestId("category-row")
    .filter({ hasText: categoryName });
  await expect(categoryRow).toBeVisible();

  const deleteButton = categoryRow.getByRole("button", { name: "Delete" });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  // Verify deletion success message
  await expect(page.getByText(`Category is deleted`)).toBeVisible();
}

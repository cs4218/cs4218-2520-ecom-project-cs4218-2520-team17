import { expect, type Page } from "@playwright/test";

/**
 * Deletes a product with the given name from the admin products list.
 * Ensure that the current page is the admin products list page before calling this function.
 * @param page - page object
 * @param productName - name of the product to delete
 */
export async function deleteProduct(page: Page, productName: string) {
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
}

import { test, expect, Page } from '@playwright/test';


test.describe.serial('CategoryProduct Functionality', () => {
  let categoryPath: string;

  test.beforeEach(async ({ page }) => {
    // Arrange
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('CategoryProduct Display: all category page loads successfully', async ({ page }) => {
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'All Categories' }).click();

    // Assert
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByRole('link', { name: 'Electronics' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Book' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clothing' })).toBeVisible();
  });

  test('CategoryProduct Navigation: Navigation from navbar to specific product category', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();
    await expect(page.getByRole('heading', { name: 'Category - Electronics' })).toBeVisible()
  });

  test('CategoryProduct Navigation: all category direction to product page', async ({ page }) => {
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'All Categories' }).click();
    await page.getByRole('main').getByRole('link', { name: 'Electronics' }).click();

    await expect(page.getByRole('heading', { name: 'Category - Electronics' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'More Details' }).first()).toBeEnabled()

  });

  test('CategoryProduct Navigation: navigating from specific category to product detail', async ({ page }) => {
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'All Categories' }).click();
    await page.getByRole('main').getByRole('link', { name: 'Electronics' }).click();

    await page.getByRole('button', { name: 'More Details' }).first().click()

    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
  });


  test('CategoryProduct Display: result count is visible', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    await expect(page.getByText(/\d+\s+result found/i)).toBeVisible();
  });

  test('CategoryProduct Display: product cards are rendered when category has products', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    const cards = page.locator('.card');

    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('CategoryProduct Display: each product card shows image, name, description, and price', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    const firstCard = page.locator('.card').first();

    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('.card-title').first()).toBeVisible();
    await expect(firstCard.locator('.card-text').first()).toBeVisible();
    await expect(firstCard.getByText(/\$/)).toBeVisible();
  });

  test('CategoryProduct Navigation: More Details button is visible for product card', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    const moreDetailsButton = page.getByRole('button', { name: 'More Details' }).first();

    await expect(moreDetailsButton).toBeVisible();
    await expect(moreDetailsButton).toBeEnabled();
  });

  test('CategoryProduct Navigation: user can click More Details from category page', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    const moreDetailsButton = page.getByRole('button', { name: 'More Details' }).first();

    await moreDetailsButton.click();

    await expect(page).toHaveURL(/\/product\//);
  });

  test('CategoryProduct Navigation: More Details redirects to product details page', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    const firstProductName = await page.locator('.card-title').first().textContent();

    await page.getByRole('button', { name: 'More Details' }).first().click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();

    if (firstProductName) {
      await expect(
        page.getByRole('heading', { name: `Name : ${firstProductName}` })
      ).toBeVisible();
    }
  });

  test('CategoryProduct Navigation: browser back from product details returns to category page', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    categoryPath = new URL(page.url()).pathname;

    await page.getByRole('button', { name: 'More Details' }).first().click();
    await expect(page).toHaveURL(/\/product\//);

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`${categoryPath}$`));
    await expect(page.getByText(/Category - /i)).toBeVisible();
  });

  test('CategoryProduct Refresh: refreshing category page does not crash the app', async ({ page }) => {
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();

    await page.reload();

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Category - /i)).toBeVisible();
  });

  test('CategoryProduct Direct Access: direct access to category route behaves correctly', async ({ page }) => {
    categoryPath = '/category/electronics';

    await page.goto(categoryPath);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Category - /i)).toBeVisible();
    await expect(page.locator('.card').first()).toBeVisible();
  });
});
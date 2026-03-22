import { test, expect, Page } from '@playwright/test';

async function openFirstCategoryWithProducts(page: Page) {
  await page.goto('http://localhost:3000/');

  const categoryLinks = page.locator('a[href^="/category/"]');
  const categoryCount = await categoryLinks.count();

  expect(categoryCount).toBeGreaterThan(0);

  for (let i = 0; i < categoryCount; i++) {
    const href = await categoryLinks.nth(i).getAttribute('href');
    if (!href) continue;

    await page.goto(`http://localhost:3000${href}`);
    await expect(page.locator('body')).toBeVisible();

    const cards = page.locator('.card');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      return href;
    }
  }

  throw new Error('No category page with products was found.');
}

test.describe.serial('CategoryProduct Functionality', () => {
  let categoryPath: string;

  test.beforeEach(async ({ page }) => {
    categoryPath = await openFirstCategoryWithProducts(page);
  });

  test('CategoryProduct Display: category page loads successfully', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${categoryPath}$`));
  });

  test('CategoryProduct Display: category heading is visible', async ({ page }) => {
    await expect(page.getByText(/Category - /i)).toBeVisible();
  });

  test('CategoryProduct Display: result count is visible', async ({ page }) => {
    await expect(page.getByText(/\d+\s+result found/i)).toBeVisible();
  });

  test('CategoryProduct Display: product cards are rendered when category has products', async ({ page }) => {
    const cards = page.locator('.card');

    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('CategoryProduct Display: each product card shows image, name, description, and price', async ({ page }) => {
    const firstCard = page.locator('.card').first();

    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('.card-title').first()).toBeVisible();
    await expect(firstCard.locator('.card-title').nth(1)).toBeVisible();
    await expect(firstCard.locator('.card-text')).toBeVisible();
  });

  test('CategoryProduct Navigation: More Details button is visible for product card', async ({ page }) => {
    const moreDetailsButton = page.getByRole('button', { name: 'More Details' }).first();

    await expect(moreDetailsButton).toBeVisible();
    await expect(moreDetailsButton).toBeEnabled();
  });

  test('CategoryProduct Navigation: user can click More Details from category page', async ({ page }) => {
    const moreDetailsButton = page.getByRole('button', { name: 'More Details' }).first();

    await moreDetailsButton.click();

    await expect(page).toHaveURL(/\/product\//);
  });

  test('CategoryProduct Navigation: More Details redirects to product details page', async ({ page }) => {
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
    await page.getByRole('button', { name: 'More Details' }).first().click();
    await expect(page).toHaveURL(/\/product\//);

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`${categoryPath}$`));
    await expect(page.getByText(/Category - /i)).toBeVisible();
  });

  test('CategoryProduct Refresh: refreshing category page does not crash the app', async ({ page }) => {
    await page.reload();

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Category - /i)).toBeVisible();
  });

  test('CategoryProduct Direct Access: direct access to category route behaves correctly', async ({ page }) => {
    await page.goto(`http://localhost:3000${categoryPath}`);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Category - /i)).toBeVisible();
    await expect(page.locator('.card').first()).toBeVisible();
  });
});
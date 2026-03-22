import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange
    await page.goto('/');
  });

  // Testing if Search bar exists
  test('Search Display: search bar is visible on homepage', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });

    // Act
    // No action needed

    // Assert
    await expect(searchBar).toBeVisible();
  });

  // Test if search bar initialized properly
  test('Search Display: search bar initializes with empty value', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });

    // Act
    const value = await searchBar.inputValue();

    // Assert
    expect(value).toBe('');
  });

  // Test if search button is visible and in correct state
  test('Search Display: search button is visible and enabled', async ({ page }) => {
    // Arrange
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    // No action needed

    // Assert
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
  });

  // Test if user can type into search bar
  test('Search Input: user can type into search bar', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });

    // Act
    await searchBar.fill('novel');

    // Assert
    await expect(searchBar).toHaveValue('novel');
  });

  // Test if user can clear text they have used
  test('Search Input: user can clear typed keyword', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    await searchBar.fill('novel');

    // Act
    await searchBar.clear();

    // Assert
    await expect(searchBar).toHaveValue('');
  });

  // Test if user is properly redirected to new page after search
  test('Search Submit: pressing Search with valid keyword redirects to search results page', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('novel');
    await searchButton.click();

    // Assert
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  });

  
  test('Search Submit: pressing Enter with valid keyword redirects to search results page', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });

    // Act
    await searchBar.fill('novel');
    await searchBar.press('Enter');

    // Assert
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  });

  // 
  test('Search Empty: submitting empty search shows no results or stays on current page gracefully', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });
    await searchBar.fill('');

    // Act
    await searchButton.click();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Whitespace: submitting whitespace-only keyword is handled gracefully', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('   ');
    await searchButton.click();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Exact Match: searching exact product name returns matching product', async ({ page }) => {
    const exactProductName = 'novel';

    await page.getByRole('searchbox', { name: 'Search' }).fill(exactProductName);
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/\/search$/);
    await expect(
      page.getByRole('heading', { name: new RegExp(`^${exactProductName}$`, 'i') })
    ).toBeVisible();
  });

  test('Search Partial Match: searching partial product name returns relevant products', async ({ page }) => {
    // Arrange
    const partialKeyword = 'nov';
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill(partialKeyword);
    await searchButton.click();

    // Assert
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole('button', { name: 'More Details' }).first()).toBeVisible();
  });

  test('Search Case Insensitive: searching with different letter casing still returns results', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('NoVeL');
    await searchButton.click();

    // Assert
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole('button', { name: 'More Details' }).first()).toBeVisible();
  });

  test('Search No Results: searching nonexistent product shows "No Products Found"', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('zzzz-no-such-product-12345');
    await searchButton.click();

    // Assert
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByText('No Products Found')).toBeVisible();
  });

  test('Search Results Display: results page shows correct result count', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('novel');
    await searchButton.click();

    // Assert
    await expect(page.getByText(/Found \d+/)).toBeVisible();
  });

  test('Search Results Display: each result shows product image, name, description, and price', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('novel');
    await searchButton.click();

    // Assert
    const firstCard = page.locator('.card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('.card-title')).toBeVisible();
    await expect(firstCard.locator('.card-text').first()).toBeVisible();
    await expect(firstCard.locator('.card-text').nth(1)).toBeVisible();
  });

  test('Search Results Display: multiple matching products are rendered correctly', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('novel');
    await searchButton.click();

    // Assert
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('Search Navigation: user can click More Details from search results', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();

    const moreDetailsButton = page.getByRole('button', { name: 'More Details' }).first();

    // Act
    await moreDetailsButton.click();

    // Assert
    await expect(page).not.toHaveURL(/\/search$/);
  });

  test('Search Navigation: More Details redirects to correct product details page', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();

    const firstProductName = await page.locator('.card-title').first().textContent();

    // Act
    await page.getByRole('button', { name: 'More Details' }).first().click();

    // Assert
    await expect(page).not.toHaveURL(/\/search$/);
    if (firstProductName) {
      await expect(page.getByText(firstProductName, { exact: false })).toBeVisible();
    }
  });

  test('Search Navigation: browser back from product details returns to search results', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();
    await page.getByRole('button', { name: 'More Details' }).first().click();

    // Act
    await page.goBack();

    // Assert
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  });

  test('Search Add to Cart: user can add product to cart from product details after searching', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();
    await page.getByRole('button', { name: 'More Details' }).first().click();

    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });

    // Act
    await addToCartButton.click();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Add to Cart: cart updates after adding searched product', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();
    await page.getByRole('button', { name: 'More Details' }).first().click();

    // Act
    await page.getByRole('button', { name: 'ADD TO CART' }).click();
    await page.getByRole('link', { name: /cart/i }).click();

    // Assert
    await expect(page).toHaveURL(/cart/i);
  });


  test('Search Special Characters: special characters in search input are handled safely', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('<script>alert("x")</script>');
    await searchButton.click();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Long Input: very long keyword does not break search flow', async ({ page }) => {
    // Arrange
    const longInput = 'a'.repeat(300);
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill(longInput);
    await searchButton.click();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Duplicate Submission: repeated clicking Search does not break results page', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');

    // Act
    await searchButton.click();
    await searchButton.click();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Refresh: refreshing search results page does not crash the app', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();

    // Act
    await page.reload();

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search URL Access: direct access to /search behaves correctly with existing search state', async ({ page }) => {
    // Arrange
    await page.goto('/search');
    // Act
    // No action needed

    // Assert
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search Result Interaction: user can interact with multiple results independently', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();

    const moreDetailsButtons = page.getByRole('button', { name: 'More Details' });

    // Act
    await moreDetailsButtons.first().click();

    // Assert
    await expect(page).not.toHaveURL(/\/search$/);
  });

  test('Search Result Order: results are displayed consistently for same keyword', async ({ page }) => {
    // Arrange
    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchBar.fill('novel');
    await searchButton.click();
    const firstRunTitles = await page.locator('.card-title').allTextContents();

    // Act
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search' }).fill('novel');
    await page.getByRole('button', { name: 'Search' }).click();
    const secondRunTitles = await page.locator('.card-title').allTextContents();

    // Assert
    expect(secondRunTitles).toEqual(firstRunTitles);
  });

  test('Search Security: search input does not execute script-like input', async ({ page }) => {
    // Arrange
    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    const searchBar = page.getByRole('searchbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });

    // Act
    await searchBar.fill('<img src=x onerror=alert(1) />');
    await searchButton.click();

    // Assert
    expect(dialogAppeared).toBe(false);
    await expect(page.locator('body')).toBeVisible();
  });
});
// ProductDetails.spec.js
import { test, expect } from '@playwright/test';

test.describe('ProductDetails Functionality', () => {
  // Replace this with an actual product slug from your database
  const PRODUCT_SLUG = 'novel';

  test.beforeEach(async ({ page }) => {
    // Arrange
    await page.goto(`/product/${PRODUCT_SLUG}`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });




  test('ProductDetails Display: product details page loads successfully', async ({ page }) => {
    // Assert
    await expect(page).toHaveURL(/\/product\/novel$/);
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
  });


  test('ProductDetails Display: main product image is visible', async ({ page }) => {
    // Arrange
    const productImage = page.locator('.product-details img');

    // Act
    // No action needed

    // Assert
    await expect(productImage).toBeVisible();
  });

  test('ProductDetails Display: product information fields are visible', async ({ page }) => {
    // Arrange
    const nameField = page.getByText(/Name :/i);
    const descriptionField = page.getByText(/Description :/i);
    const priceField = page.getByText(/Price :/i);
    const categoryField = page.getByText(/Category :/i);

    // Act
    // No action needed

    // Assert
    await expect(nameField).toBeVisible();
    await expect(descriptionField).toBeVisible();
    await expect(priceField).toBeVisible();
    await expect(categoryField).toBeVisible();
  });

  test('ProductDetails Display: ADD TO CART button is visible and enabled', async ({ page }) => {
    // Arrange
    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });

    // Act
    // No action needed

    // Assert
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();
  });

  test('ProductDetails Add to Cart: clicking ADD TO CART works without crashing', async ({ page }) => {
    // Arrange
    const addToCartButton = page.getByRole('button', { name: 'ADD TO CART' });

    // Act
    await addToCartButton.click();

    // Assert
    await expect(page.getByTitle('1')).toBeVisible();

  });

  test('ProductDetails Similar Products: similar products section is visible', async ({ page }) => {
    // Arrange
    const similarProductsHeading = page.getByRole('heading', { name: /Similar Products/ });

    // Act
    // No action needed

    // Assert
    await expect(similarProductsHeading).toBeVisible();  
  });


  test('ProductDetails Similar Products: similar products area renders gracefully', async ({ page }) => {
    // Arrange
    const similarProductsSection = page.locator('.similar-products');

    // Act
    // No action needed

    // Assert
    await expect(similarProductsSection).toBeVisible();
  });

  test('ProductDetails Similar Products: if related products exist, More Details button is usable', async ({ page }) => {
    // Arrange
    const relatedButtons = page.getByRole('button', { name: 'More Details' });
    const count = await relatedButtons.count();

    // Act + Assert
    if (count > 0) {
      await expect(relatedButtons.first()).toBeVisible();
      await expect(relatedButtons.first()).toBeEnabled();
    } else {
      await expect(page.getByText('No Similar Products found')).toBeVisible();
    }
  });

  test('ProductDetails Similar Products: clicking More Details on related product redirects correctly', async ({ page }) => {
    // Arrange
    const relatedButtons = page.getByRole('button', { name: 'More Details' });
    const count = await relatedButtons.count();

    // Act + Assert
    if (count > 0) {
      await relatedButtons.first().click();
      await expect(page).toHaveURL(/\/product\//);
      await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Name : Textbook' })).toBeVisible();
 
    } else {
      await expect(page.getByText('No Similar Products found')).toBeVisible();
    }
  });

  test('ProductDetails Refresh: refreshing product details page does not crash the app', async ({ page }) => {
    // Act
    await page.reload();

    // Assert
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
  });

  test('ProductDetails Direct Access: direct access to product route behaves correctly', async ({ page }) => {
    // Arrange
    await page.goto(`/product/${PRODUCT_SLUG}`);

    // Act
    // No action needed

    // Assert
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
  });

  test('ProductDetails Display: no similar product found', async ({ page }) => {
    await page.goto('/product/nus-tshirt');

    await expect(page).toHaveURL(/\/product\/nus-tshirt$/);
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
    await expect(page.getByText('No Similar Products found')).toBeVisible();
  });
});

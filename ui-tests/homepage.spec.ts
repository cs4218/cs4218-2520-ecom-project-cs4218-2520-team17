// Rayyan Ismail. A0259275R
// Sebastian Tay, A0252864X
import { test, expect } from "@playwright/test";
import { logInAsUser, logOutAsUser } from "./utils/user";

test.describe.configure({ mode: "serial" });

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // Rayyan Ismail. A0259275R
  test("should display all products with names and prices", async ({
    page,
  }) => {
    // All 6 seed products should be visible
    await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'The Law of Contract in Singapore' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();

    // Spot-check prices
    await expect(page.getByText("$1,499.99")).toBeVisible();
    await expect(page.getByText("$4.99")).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should display category filter checkboxes", async ({ page }) => {
    await expect(page.getByText("Filter By Category")).toBeVisible();

    await expect(page.getByRole("checkbox", { name: "Electronics" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Book" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Clothing" })).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should display price filter radio buttons", async ({ page }) => {
    await expect(page.getByText("Filter By Price")).toBeVisible();

    await expect(page.getByRole("radio", { name: "$0 to 19" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$20 to 39" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$40 to 59" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$60 to 79" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "$80 to 99" })).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "$100 or more" })
    ).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter products by category", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Clothing" }).check();

    // Wait for filtered results
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();

    // Other products should not be visible
    await expect(page.getByRole('heading', { name: 'Laptop' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smartphone' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Textbook' })).not.toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter products by price range", async ({ page }) => {
    await page.getByRole("radio", { name: "$0 to 19" }).check();

    // NUS T-shirt ($4.99) and Novel ($14.99) are in range
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();

    // Laptop ($1,499.99) should not be visible
    await expect(page.getByRole('heading', { name: 'Laptop' })).not.toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should reset filters and show all products", async ({ page }) => {
    // Apply a category filter first
    await page.getByRole("checkbox", { name: "Clothing" }).check();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Laptop' })).not.toBeVisible();

    // Reset filters (triggers window.location.reload)
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "RESET FILTERS" }).click(),
    ]);

    // All products should be visible again
    await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should navigate to product details page on 'More Details' click", async ({
    page,
  }) => {
    // Find the Laptop card and click its More Details button
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "More Details" }).click();

    await page.waitForURL("**/product/laptop");
    await expect(page).toHaveURL(/\/product\/laptop/);
  });

  // Rayyan Ismail. A0259275R
  test("should show toast notification on 'ADD TO CART' click", async ({
    page,
  }) => {
    const laptopCard = page.locator(".card", { hasText: "Laptop" });
    await laptopCard.getByRole("button", { name: "ADD TO CART" }).click();

    await expect(page.getByText("Item Added to cart")).toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter by multiple categories", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Electronics" }).check();
    await page.getByRole("checkbox", { name: "Clothing" }).check();

    // Electronics and Clothing products should be visible
    await expect(page.getByRole("heading", { name: "Laptop" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Smartphone" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "NUS T-shirt" })
    ).toBeVisible();

    // Book products should not be visible
    await expect(
      page.getByRole("heading", { name: "Textbook" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Novel" })
    ).not.toBeVisible();
  });

  // Rayyan Ismail. A0259275R
  test("should filter by category and then by price range", async ({
    page,
  }) => {
    // Filter by Book category
    await page.getByRole("checkbox", { name: "Book" }).check();
    await expect(page.getByRole("heading", { name: "Textbook" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Novel" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The Law of Contract in Singapore" })
    ).toBeVisible();

    // Further filter by price $40 to 59
    await page.getByRole("radio", { name: "$40 to 59" }).check();

    // Only The Law of Contract in Singapore ($54.99) should remain
    await expect(
      page.getByRole("heading", { name: "The Law of Contract in Singapore" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Textbook" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Novel" })
    ).not.toBeVisible();
  });
});

test.describe("Components testing on Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Header", () =>{
    // Sebastian Tay. A0252864X
    test("should render Header with brand and primary navigation links if logged out", async ({
      page,
    }) => {
      await expect(page.locator(".navbar")).toBeVisible();
      await expect(page.getByRole("link", { name: "Virtual Vault" })).toBeVisible();

      await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
      await expect(page.getByRole("link", { name: "Categories" })).toHaveAttribute("href", "/categories");
      await expect(page.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
      await expect(page.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
      await expect(page.getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/cart");
    });

    // Sebastian Tay. A0252864X
    test("should redirect correctly when header links are clicked", async ({ page }) => {
      await page.getByRole("link", { name: "Register" }).click();
      await expect(page).toHaveURL(/\/register$/);

      await page.goto("/");
      await page.getByRole("link", { name: "Login" }).click();
      await expect(page).toHaveURL(/\/login$/);

      await page.goto("/");
      await page.getByRole("link", { name: "Cart" }).click();
      await expect(page).toHaveURL(/\/cart$/);

      await page.goto("/");
      await page.getByRole('link', { name: 'Categories' }).click();
      await page.getByRole('link', { name: 'All Categories' }).click();
      await expect(page).toHaveURL(/\/categories$/);
      await expect(page).toHaveTitle("All Categories");
    });

    // Sebastian Tay. A0252864X
    test("should show different header views for unauthenticated and authenticated users", async ({
      page,
    }) => {
      //Unauthenticated view
      await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

      await logInAsUser(page);
      // Authenticated view
      await expect(page.getByRole("button", { name: "CS 4218 Test Account" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Register" })).not.toBeVisible();
      await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
      await expect(page.locator(".ant-badge")).toContainText("0");
    });

    // Sebastian Tay. A0252864X
    test("should execute handleLogout by clearing auth and redirecting to login", async ({
      page,
    }) => {
      await logInAsUser(page);

      await logOutAsUser(page);

      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

      const storedAuth = await page.evaluate(() => localStorage.getItem("auth"));
      expect(storedAuth).toBeNull();
    });

    // Sebastian Tay. A0252864X
    test("should render all categories from API in header dropdown", async ({ page }) => {
      const categoryResponse = await page.request.get("/api/v1/category/get-category");
      const categoryBody = await categoryResponse.json();
      const categoryNames = (categoryBody?.category ?? []).map((c:{ name: string, slug: string }) => c.slug);

      await page.getByRole("link", { name: "Categories" }).click();
      await expect(page.getByRole("link", { name: "All Categories" })).toBeVisible();

      for (const categoryName of categoryNames) {
        await expect(page.getByRole("link", { name: categoryName })).toBeVisible();
      }
    });

    // Sebastian Tay. A0252864X
    test("should filter products through SearchInput based on user input", async ({ page }) => {
      await page.getByRole("searchbox", { name: "Search" }).fill("Laptop");
      await page.getByRole("button", { name: "Search" }).click();

      await expect(page).toHaveURL(/\/search$/);
      await expect(page.getByRole("heading", { name: "Search Results" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Laptop" })).toBeVisible();
    });
  });

  test.describe("Footer", () => {
    // Sebastian Tay. A0252864X
    test("should render Footer with copyright text and footer links", async ({
      page,
    }) => {
      const footer = page.locator(".footer");

      await expect(footer).toBeVisible();
      await expect(footer.getByText("All Rights Reserved")).toBeVisible();

      await expect(footer.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
      await expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
      await expect(footer.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/policy");
    });

    // Sebastian Tay. A0252864X
    test("should navigate to About page via footer link", async ({ page }) => {
      const footer = page.locator(".footer");

      await footer.getByRole("link", { name: "About" }).click();
      await expect(page).toHaveURL(/\/about$/);
    });

    // Sebastian Tay. A0252864X
    test("should navigate to Contact page via footer link", async ({ page }) => {
      const footer = page.locator(".footer");

      await footer.getByRole("link", { name: "Contact" }).click();
      await expect(page).toHaveURL(/\/contact$/);
    });

    // Sebastian Tay. A0252864X
    test("should navigate to Policy page via footer link", async ({ page }) => {
      const footer = page.locator(".footer");

      await footer.getByRole("link", { name: "Privacy Policy" }).click();
      await expect(page).toHaveURL(/\/policy$/);
    });
  });
});
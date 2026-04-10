// Load test for e-commerce project
// Simulates 100 concurrent users with two realistic flows:
// 1. Homepage → Product Detail (60%)
// 2. Search → Filter → Category (40%)

import { sleep } from "k6";
import { check } from "k6";
import { randomInt, buildSeededUserEmail, randomPick } from "../utils/common.js";
import { login } from "../utils/auth.js";
import { listCategories } from "../utils/categories.js";
import { listUserOrders } from "../utils/orders.js";
import {
  getProductCount,
  listProductsPage,
  getSingleProduct,
  getProductPhoto,
  getRelatedProducts,
  searchProducts,
  filterProducts,
  getProductsByCategory,
} from "../utils/products.js";

const BASE_URL = (__ENV.BASE_URL || "http://host.docker.internal:6060").replace(/\/$/, "");
const API_BASE = `${BASE_URL}/api/v1`;

const USER_PASSWORD = __ENV.LOAD_TEST_PASSWORD || "VolumeTest!123";
const SEEDED_USERS = Number(__ENV.LOAD_SEED_USERS || 500);
const SEEDED_PRODUCTS = Number(__ENV.LOAD_SEED_PRODUCTS || 1000);

// Thresholds: p95 and p99 response times under 3 seconds
export const options = {
  scenarios: {
    homepage_to_detail: {
      executor: "ramping-vus",
      stages: [
        { duration: "2m", target: 60 }, // ramp-up to 60 users (60% of 100)
        { duration: "10m", target: 60 }, // steady
        { duration: "2m", target: 0 }, // ramp-down
      ],
      exec: "homepageToDetail",
      tags: { flow: "homepage_detail" },
    },
    search_filter_category: {
      executor: "ramping-vus",
      stages: [
        { duration: "2m", target: 40 }, // ramp-up to 40 users (40% of 100)
        { duration: "10m", target: 40 }, // steady
        { duration: "2m", target: 0 }, // ramp-down
      ],
      exec: "searchFilterCategory",
      tags: { flow: "search_filter_category" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000", "p(99)<3000"],
  },
};

// Pre-calculated data for efficiency
let categories = [];
let productSlugs = [];
let categorySlugs = [];

export function setup() {
  // Load categories
  categories = listCategories(API_BASE);
  if (categories.length === 0) {
    console.error("No categories found, test may fail");
  }

  // Load some product slugs for testing
  const products = listProductsPage(API_BASE, 1);
  productSlugs = products.map(p => p.slug).filter(Boolean);

  // Load category slugs
  categorySlugs = categories.map(c => c.slug).filter(Boolean);

  console.log(`Loaded ${categories.length} categories, ${productSlugs.length} product slugs`);

  return { categories, productSlugs, categorySlugs };
}

export function homepageToDetail(data) {
  // Login as random seeded user
  const userIndex = randomInt(1, SEEDED_USERS);
  const email = buildSeededUserEmail(userIndex);
  const loginResult = login(API_BASE, email, USER_PASSWORD);

  if (!loginResult) {
    console.error(`Login failed for user ${email}`);
    return;
  }

  const token = loginResult.token;

  // Load categories
  listCategories(API_BASE, { flow: "homepage" });

  // Get product count
  getProductCount(API_BASE, { flow: "homepage" });

  // Browse a random page
  const page = randomInt(1, Math.ceil(SEEDED_PRODUCTS / 6)); // assuming 6 products per page
  const products = listProductsPage(API_BASE, page, { flow: "homepage" });

  if (products.length === 0) {
    console.log("No products on page, skipping detail view");
    return;
  }

  // Click into a random product detail
  const randomProduct = randomPick(products);
  const productDetail = getSingleProduct(API_BASE, randomProduct.slug, { flow: "detail" });

  if (!productDetail) {
    console.log("Failed to get product detail");
    return;
  }

  // Load product photo
  getProductPhoto(API_BASE, productDetail._id, { flow: "detail" });

  // View related products
  if (productDetail.category && productDetail.category._id) {
    getRelatedProducts(API_BASE, productDetail._id, productDetail.category._id, { flow: "detail" });
  }

  // Random sleep between 1-5 seconds
  sleep(randomInt(1, 5));
}

export function searchFilterCategory(data) {
  // Login as random seeded user
  const userIndex = randomInt(1, SEEDED_USERS);
  const email = buildSeededUserEmail(userIndex);
  const loginResult = login(API_BASE, email, USER_PASSWORD);

  if (!loginResult) {
    console.error(`Login failed for user ${email}`);
    return;
  }

  const token = loginResult.token;

  // Search by keyword
  const keywords = ["laptop", "phone", "shirt", "book", "watch"];
  const keyword = randomPick(keywords);
  const searchResults = searchProducts(API_BASE, keyword, { flow: "search" });

  // Filter by category and price
  const randomCategories = data.categories.slice(0, randomInt(1, 3)).map(c => c._id);
  const priceRange = [randomInt(0, 500), randomInt(500, 2000)]; // random price range
  const filteredProducts = filterProducts(API_BASE, randomCategories, priceRange, { flow: "filter" });

  // Browse products by category
  if (data.categorySlugs.length > 0) {
    const randomCategorySlug = randomPick(data.categorySlugs);
    getProductsByCategory(API_BASE, randomCategorySlug, { flow: "category" });
  }

  // Check order history
  listUserOrders(API_BASE, token, { flow: "orders" });

  // Random sleep between 2-8 seconds
  sleep(randomInt(2, 8));
}
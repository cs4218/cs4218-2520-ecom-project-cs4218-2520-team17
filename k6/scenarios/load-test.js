// Rayyan Ismail, A0259275R
// Load Test: 1000 products, 500 users, 100 concurrent VUs, 3s max response time
//
// Simulates two realistic user flows:
//   Flow 1 (60%): Homepage Browse → Product Detail (API-heavy, many sequential requests)
//   Flow 2 (40%): Search → Filter → Category Browse (DB-heavy, expensive queries)
//
// Prerequisites:
//   1. MongoDB running (e.g., npm run volume:mongo:up)
//   2. Seed data: npm run k6:load:seed
//   3. App server running on BASE_URL (default http://localhost:6060)
//
// Run: npm run k6:load:run
// Or seed + run: npm run k6:load:test

import { sleep } from "k6";
import {
  buildSeededAdminEmail,
  buildSeededUserEmail,
  randomInt,
  randomPick,
  toBooleanEnv,
} from "../utils/common.js";
import { login } from "../utils/auth.js";
import {
  filterProducts,
  getProductCount,
  getProductPhoto,
  getProductsByCategory,
  getRelatedProducts,
  getSingleProduct,
  listProductsPage,
  searchProducts,
} from "../utils/products.js";
import { listCategories } from "../utils/categories.js";
import { listUserOrders } from "../utils/orders.js";
import { scenarioErrors } from "../utils/metrics.js";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:6060").replace(/\/$/, "");
const API_BASE = `${BASE_URL}/api/v1`;

const VUS = Number(__ENV.LOAD_TEST_VUS || 100);
const RAMP_UP = __ENV.LOAD_TEST_RAMP_UP || "2m";
const STEADY_DURATION = __ENV.LOAD_TEST_STEADY || "10m";
const RAMP_DOWN = __ENV.LOAD_TEST_RAMP_DOWN || "2m";

const SEEDED_USERS = Number(__ENV.VOLUME_SEED_USERS || 500);
const USER_PASSWORD = __ENV.VOLUME_TEST_PASSWORD || "VolumeTest!123";
const ADMIN_EMAIL = __ENV.VOLUME_ADMIN_EMAIL || buildSeededAdminEmail(1);
const ADMIN_PASSWORD = __ENV.VOLUME_ADMIN_PASSWORD || USER_PASSWORD;

const SEARCH_KEYWORDS = ["Volume", "Product", "phone", "laptop", "shoe"];
const PRICE_RANGES = [
  [0, 19],
  [20, 39],
  [40, 59],
  [60, 79],
  [80, 99],
  [100, 9999],
];
const PER_PAGE = 6;

export const options = {
  scenarios: {
    load_test: {
      executor: "ramping-vus",
      exec: "loadTestIteration",
      startVUs: 0,
      gracefulRampDown: "30s",
      stages: [
        { duration: RAMP_UP, target: VUS },
        { duration: STEADY_DURATION, target: VUS },
        { duration: RAMP_DOWN, target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000", "p(99)<3000"],
    "http_req_duration{endpoint:read}": ["p(95)<3000", "p(99)<3000"],
    "http_req_duration{endpoint:write}": ["p(95)<3000", "p(99)<3000"],
    checks: ["rate>0.95"],
    scenario_errors: ["count<500"],
  },
};

let vuSession = null;

function loginSeededUserByVu() {
  const userIndex = ((__VU - 1) % SEEDED_USERS) + 1;
  const email = buildSeededUserEmail(userIndex);
  const auth = login(API_BASE, email, USER_PASSWORD, { scenario: "load-test" });

  if (!auth) {
    scenarioErrors.add(1, { scenario: "load-test", stage: "seeded-login" });
    return null;
  }

  return { email, token: auth.token };
}

// Flow 1: Homepage Browse → Product Detail (API-heavy)
// Simulates: user lands on homepage, browses products, clicks into one product,
// views its photo and related products. 6 sequential HTTP requests per iteration.
function browseProductFlow(setupData) {
  const tags = { scenario: "load-test", flow: "browse-product" };

  // Step 1: Load categories (navigation bar)
  listCategories(API_BASE, tags);

  // Step 2: Get product count (homepage)
  getProductCount(API_BASE, tags);

  // Step 3: Browse a random page of products
  const page = randomInt(1, setupData.maxPage);
  const products = listProductsPage(API_BASE, page, tags);

  if (!products || products.length === 0) {
    return;
  }

  // Step 4: Click into a product detail
  const product = randomPick(products);
  if (!product || !product.slug) {
    return;
  }

  const detail = getSingleProduct(API_BASE, product.slug, tags);
  if (!detail || !detail._id) {
    return;
  }

  // Step 5: Load the product photo
  getProductPhoto(API_BASE, detail._id, tags);

  // Step 6: View related products
  if (detail.category) {
    const categoryId =
      typeof detail.category === "object" ? detail.category._id : detail.category;
    getRelatedProducts(API_BASE, detail._id, categoryId, tags);
  }
}

// Flow 2: Search → Filter → Category Browse (DB-heavy)
// Simulates: user searches for a product, applies filters, browses a category,
// then checks their order history. Each step triggers expensive DB operations.
function searchFilterFlow(setupData) {
  const tags = { scenario: "load-test", flow: "search-filter" };

  // Step 1: Search products (regex scan on name + description, no index)
  const keyword = randomPick(SEARCH_KEYWORDS);
  searchProducts(API_BASE, keyword, tags);

  // Step 2: Filter products by category + price (no pagination, returns all matches)
  const categoryId = randomPick(setupData.categoryIds);
  const priceRange = randomPick(PRICE_RANGES);
  filterProducts(API_BASE, categoryId ? [categoryId] : [], priceRange, tags);

  // Step 3: Browse all products in a category (no pagination, potentially large)
  const categorySlug = randomPick(setupData.categorySlugs);
  if (categorySlug) {
    getProductsByCategory(API_BASE, categorySlug, tags);
  }

  // Step 4: Check order history (double populate: products + buyer)
  if (vuSession && vuSession.token) {
    listUserOrders(API_BASE, vuSession.token, tags);
  }
}

export function setup() {
  const adminAuth = login(API_BASE, ADMIN_EMAIL, ADMIN_PASSWORD, {
    scenario: "setup",
  });

  if (!adminAuth) {
    throw new Error(`Unable to login admin account ${ADMIN_EMAIL}`);
  }

  const categories = listCategories(API_BASE, { scenario: "setup" });
  const categoryIds = categories.map((c) => c._id).filter(Boolean);
  const categorySlugs = categories.map((c) => c.slug).filter(Boolean);

  const totalProducts = getProductCount(API_BASE, { scenario: "setup" });
  const maxPage = Math.max(1, Math.ceil(totalProducts / PER_PAGE));

  return { adminToken: adminAuth.token, categoryIds, categorySlugs, maxPage };
}

export function loadTestIteration(setupData) {
  if (!vuSession || !vuSession.token) {
    vuSession = loginSeededUserByVu();
    if (!vuSession) {
      sleep(1);
      return;
    }
  }

  if (Math.random() < 0.6) {
    browseProductFlow(setupData);
  } else {
    searchFilterFlow(setupData);
  }

  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    "k6/reports/load-test/load-test-summary.json": JSON.stringify(
      data,
      null,
      2
    ),
  };
}

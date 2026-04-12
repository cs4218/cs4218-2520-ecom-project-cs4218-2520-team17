// K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=k6/reports/spike-test/spike-report.html k6 run --summary-export=k6/reports/spike-test/spike-summary.json k6/scenarios/spike-test.js


import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const PRODUCT_COUNT_PATH = "/api/v1/product/product-count";
const PRODUCT_LIST_PATH = "/api/v1/product/product-list";
const PRODUCT_DETAIL_PATH = "/api/v1/product/get-product";
const SEARCH_PATH = "/api/v1/product/search";
const CATEGORY_PATH = "/api/v1/category/get-category";
const FILTER_PATH = "/api/v1/product/product-filters";
const LOGIN_PATH = "/api/v1/auth/login";

const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || "cs4218@test.com";
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || "cs4218@test.com";

const PER_PAGE = 6;
const THINK_TIME = 0.3;

const SEARCH_KEYWORDS = ["phone", "laptop", "book", "shirt", "watch"];
const PRICE_RANGES = [
  [0, 19],
  [20, 39],
  [40, 59],
  [60, 79],
  [80, 99],
  [100, 9999],
];

// --- Custom Metrics ---
const spikeHttpReqDuration = new Trend("spike_http_req_duration", true);
const spikeHttpReqFailed = new Rate("spike_http_req_failed");
const spikeIterations = new Counter("spike_iterations");
const spikeProductListDuration = new Trend("spike_product_list_duration", true);
const spikeProductDetailDuration = new Trend("spike_product_detail_duration", true);
const spikeSearchDuration = new Trend("spike_search_duration", true);
const spikeLoginDuration = new Trend("spike_login_duration", true);
const spikeFilterDuration = new Trend("spike_filter_duration", true);

// --- Spike Test Options ---
// A spike test rapidly escalates to an extreme load and then drops back down.
// The key characteristic is the sharp, sudden increase far beyond normal capacity.
export const options = {
  scenarios: {
    spike_browse: {
      executor: "ramping-vus",
      exec: "browseProducts",
      startVUs: 0,
      stages: [
        // Phase 1: Normal baseline load
        { duration: "30s", target: 5 },
        // Phase 2: SPIKE — sudden extreme surge
        { duration: "10s", target: 200 },
        // Phase 3: Hold at spike peak briefly
        { duration: "30s", target: 200 },
        // Phase 4: Spike drops off sharply
        { duration: "10s", target: 5 },
        // Phase 5: Recovery — back to normal load
        { duration: "1m", target: 5 },
        // Phase 6: Ramp down
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    spike_search: {
      executor: "ramping-vus",
      exec: "searchProducts",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "10s", target: 100 },
        { duration: "30s", target: 100 },
        { duration: "10s", target: 2 },
        { duration: "1m", target: 2 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    spike_login: {
      executor: "ramping-vus",
      exec: "loginFlow",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "10s", target: 80 },
        { duration: "30s", target: 80 },
        { duration: "10s", target: 2 },
        { duration: "1m", target: 2 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    // Global thresholds — more lenient during spikes since degradation is expected.
    // p(95)<7000 accounts for the product detail endpoint which is the known spike bottleneck.
    http_req_failed: ["rate<0.15"],
    http_req_duration: ["p(95)<7000"],
    checks: ["rate>0.85"],

    // Per-scenario thresholds.
    // Product detail is the slowest endpoint under spike — allow up to 7s at p(95).
    spike_product_list_duration: ["p(95)<5000", "p(99)<8000"],
    spike_product_detail_duration: ["p(95)<7000", "p(99)<10000"],
    spike_search_duration: ["p(95)<5000", "p(99)<8000"],
    spike_login_duration: ["p(95)<5000", "p(99)<8000"],
    spike_filter_duration: ["p(95)<5000", "p(99)<8000"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

// --- Helper Functions ---

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomItem(arr) {
  return arr[randomInt(arr.length)];
}

function safeJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

function trackRequest(res, durationTrend) {
  spikeHttpReqDuration.add(res.timings.duration);
  spikeHttpReqFailed.add(res.status >= 400);
  if (durationTrend) {
    durationTrend.add(res.timings.duration);
  }
}

// --- Setup ---

export function setup() {
  // Get total product count for realistic pagination
  const countRes = http.get(`${BASE_URL}${PRODUCT_COUNT_PATH}`, {
    tags: { endpoint: "product-count" },
  });

  let totalProducts = 0;
  try {
    totalProducts = Number(countRes.json("total")) || 0;
  } catch {
    totalProducts = 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / PER_PAGE));

  // Get categories for filter requests
  const catRes = http.get(`${BASE_URL}${CATEGORY_PATH}`, {
    tags: { endpoint: "get-category" },
  });

  let categories = [];
  try {
    categories = catRes.json("category") || [];
  } catch {
    categories = [];
  }

  return { totalPages, categories };
}

// --- Scenario: Browse Products (list + detail) ---

export function browseProducts(data) {
  spikeIterations.add(1);

  // Step 1: List products on a random page
  const page = randomInt(data.totalPages) + 1;
  const listRes = http.get(`${BASE_URL}${PRODUCT_LIST_PATH}/${page}`, {
    tags: { endpoint: "product-list" },
  });
  trackRequest(listRes, spikeProductListDuration);

  const listOk = check(listRes, {
    "product list: status 200": (r) => r.status === 200,
    "product list: has products": (r) => {
      try {
        const products = r.json("products");
        return Array.isArray(products) && products.length > 0;
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);

  // Step 2: Click into a product detail
  if (listOk) {
    let products;
    try {
      products = listRes.json("products");
    } catch {
      return;
    }

    if (Array.isArray(products) && products.length > 0) {
      const product = randomItem(products);
      if (product?.slug) {
        const detailRes = http.get(
          `${BASE_URL}${PRODUCT_DETAIL_PATH}/${product.slug}`,
          { tags: { endpoint: "product-detail" } }
        );
        trackRequest(detailRes, spikeProductDetailDuration);

        check(detailRes, {
          "product detail: status 200": (r) => r.status === 200,
          "product detail: has product": (r) => {
            try {
              return Boolean(r.json("product"));
            } catch {
              return false;
            }
          },
        });
      }
    }
  }

  // Step 3: Optionally apply a filter (30% of the time)
  if (Math.random() < 0.3 && data.categories.length > 0) {
    const cat = randomItem(data.categories);
    const priceRange = randomItem(PRICE_RANGES);
    const payload = {
      checked: cat?._id ? [cat._id] : [],
      radio: priceRange,
    };

    const filterRes = http.post(
      `${BASE_URL}${FILTER_PATH}`,
      JSON.stringify(payload),
      {
        headers: { "Content-Type": "application/json" },
        tags: { endpoint: "product-filters" },
      }
    );
    trackRequest(filterRes, spikeFilterDuration);

    check(filterRes, {
      "product filter: status 200": (r) => r.status === 200,
    });
  }

  sleep(THINK_TIME);
}

// --- Scenario: Search Products ---

export function searchProducts() {
  spikeIterations.add(1);

  const keyword = randomItem(SEARCH_KEYWORDS);
  const searchRes = http.get(
    `${BASE_URL}${SEARCH_PATH}/${encodeURIComponent(keyword)}`,
    { tags: { endpoint: "product-search" } }
  );
  trackRequest(searchRes, spikeSearchDuration);

  check(searchRes, {
    "search: status 200": (r) => r.status === 200,
  });

  sleep(THINK_TIME);
}

// --- Scenario: Login Flow ---

export function loginFlow() {
  spikeIterations.add(1);

  const loginRes = http.post(
    `${BASE_URL}${LOGIN_PATH}`,
    JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "login" },
    }
  );
  trackRequest(loginRes, spikeLoginDuration);

  check(loginRes, {
    "login: status 200": (r) => r.status === 200,
    "login: has token": (r) => {
      try {
        return Boolean(r.json("token"));
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);
}

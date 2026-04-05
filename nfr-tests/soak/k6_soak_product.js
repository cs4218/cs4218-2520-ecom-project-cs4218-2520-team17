import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Sebastian Tay, A0252864X

const BASE_URL = "http://localhost:6060";
const TARGET_VUS = 30;
// const WARM_UP = "10m";
// const SOAK_HOLD = "700m";
// const COOL_DOWN = "10m";
const WARM_UP = "1m";
const SOAK_HOLD = "2m";
const COOL_DOWN = "1m";
const THINK_TIME = 0.5;

const USER_EMAIL = "cs4218@test.com";
const USER_PASSWORD = "cs4218@test.com";
const ADMIN_EMAIL = "test@admin.com";
const ADMIN_PASSWORD = "test@admin.com";

const SEARCH_KEYWORDS = "phone,laptop,shoe,bag,watch,headphone,camera,tablet"
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const browseLatency = new Trend("product_browse_latency", true);
const searchLatency = new Trend("product_search_latency", true);
const filterLatency = new Trend("product_filter_latency", true);
const apiErrorRate = new Rate("product_api_error_rate");
const successRate = new Rate("product_success_rate");
const scenarioErrors = new Counter("product_scenario_errors");

function loginAndGetToken(email, password, label) {
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { endpoint: `auth_login_${label}` } },
  );

  const loginBody = safeJson(loginRes);
  const ok = check(loginRes, {
    [`${label} login: status is 200`]: (r) => r.status === 200,
    [`${label} login: token exists`]: () => Boolean(loginBody?.token),
  });

  if (!ok) {
    return "";
  }

  return loginBody.token;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function safeJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

function jsonHeaders(token = "") {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = token;
  }
  return headers;
}

function extractCategorySlug(product) {
  if (!product || !product.category) {
    return "";
  }
  if (typeof product.category === "object") {
    return product.category.slug || "";
  }
  return "";
}

function extractCategoryId(product) {
  if (!product || !product.category) {
    return "";
  }
  if (typeof product.category === "object") {
    return product.category._id || "";
  }
  return product.category;
}

const browseVus = Math.max(1, Math.floor(TARGET_VUS * 0.4));
const searchVus = Math.max(1, Math.floor(TARGET_VUS * 0.35));
const filterVus = Math.max(1, Math.floor(TARGET_VUS * 0.25));

export const options = {
  scenarios: {
    browse_products: {
      executor: "ramping-vus",
      exec: "browseProducts",
      startVUs: 0,
      stages: [
        { duration: WARM_UP, target: browseVus },
        { duration: SOAK_HOLD, target: browseVus },
        { duration: COOL_DOWN, target: 0 },
      ],
      gracefulRampDown: "1m",
    },
    search_products: {
      executor: "ramping-vus",
      exec: "searchProducts",
      startVUs: 0,
      stages: [
        { duration: WARM_UP, target: searchVus },
        { duration: SOAK_HOLD, target: searchVus },
        { duration: COOL_DOWN, target: 0 },
      ],
      gracefulRampDown: "1m",
    },
    filter_products: {
      executor: "ramping-vus",
      exec: "filterProducts",
      startVUs: 0,
      stages: [
        { duration: WARM_UP, target: filterVus },
        { duration: SOAK_HOLD, target: filterVus },
        { duration: COOL_DOWN, target: 0 },
      ],
      gracefulRampDown: "1m",
    },
  },
  thresholds: {
    checks: ["rate>0.95"],
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    "http_req_failed{endpoint:product_browse}": ["rate<0.01"],
    "http_req_duration{endpoint:product_browse}": ["p(95)<700", "p(99)<1200"],
    "http_req_failed{endpoint:product_search}": ["rate<0.05"],
    "http_req_duration{endpoint:product_search}": ["p(95)<800", "p(99)<1300"],
    "http_req_failed{endpoint:product_list}": ["rate<0.01"],
    "http_req_duration{endpoint:product_list}": ["p(95)<700", "p(99)<1200"],
    "http_req_failed{endpoint:product_filter}": ["rate<0.10"],
    "http_req_duration{endpoint:product_filter}": ["p(95)<1000", "p(99)<1800"],
    "http_req_failed{endpoint:product_count}": ["rate<0.01"],
    "http_req_duration{endpoint:product_count}": ["p(95)<500", "p(99)<900"],
    "http_req_failed{endpoint:product_photo}": ["rate<0.10"],
    "http_req_duration{endpoint:product_photo}": ["p(95)<1000", "p(99)<1800"],
    "http_req_failed{endpoint:product_category}": ["rate<0.10"],
    "http_req_duration{endpoint:product_category}": ["p(95)<1000", "p(99)<1800"],
    "http_req_failed{endpoint:related_product}": ["rate<0.10"],
    "http_req_duration{endpoint:related_product}": ["p(95)<1000", "p(99)<1800"],
    product_success_rate: ["rate>0.90"],
    product_scenario_errors: ["count<100"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

// Runs at start of script before any scenarios iteration
export function setup() {
  const userToken = loginAndGetToken(USER_EMAIL, USER_PASSWORD, "user");
  const adminToken = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD, "admin");

  return {
    userToken,
    adminToken,
  };
}

export function browseProducts() {
  const start = Date.now();

  try {
    // Get all products
    const listRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { endpoint: "product_browse" },
    });

    const listBody = safeJson(listRes);

    const listCheck = check(listRes, {
      "browse: get-product status is 200": (r) => r.status === 200,
      "browse: has success property": () =>
        Boolean(listBody && listBody.success === true),
      "browse: returns products array": () =>
        Boolean(listBody && Array.isArray(listBody.products)),
    });

    if (!listCheck) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
    } else {
      apiErrorRate.add(0);
      successRate.add(true);
    }

    // Get product count
    const countRes = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { endpoint: "product_count" },
    });

    const countBody = safeJson(countRes);

    const countCheck = check(countRes, {
      "browse: product-count status is 200": (r) => r.status === 200,
      "browse: count is numeric": () =>
        Boolean(countBody && Number.isFinite(countBody.total)),
    });

    if (!countCheck) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
    } else {
      apiErrorRate.add(0);
    }

    // Cover category and photo endpoints with a sampled product.
    const products = Array.isArray(listBody?.products) ? listBody.products : [];
    if (products.length > 0) {
      const sampledProduct = randomItem(products);

      if (sampledProduct?._id) {
        const photoRes = http.get(
          `${BASE_URL}/api/v1/product/product-photo/${sampledProduct._id}`,
          { tags: { endpoint: "product_photo" } },
        );

        check(photoRes, {
          "browse: product-photo status is 200": (r) => r.status === 200,
        });
      }

      const categorySlug = extractCategorySlug(sampledProduct);
      if (categorySlug) {
        const categoryRes = http.get(
          `${BASE_URL}/api/v1/product/product-category/${categorySlug}`,
          { tags: { endpoint: "product_category" } },
        );

        const categoryBody = safeJson(categoryRes);
        check(categoryRes, {
          "browse: product-category status is 200": (r) => r.status === 200,
          "browse: product-category has products": () =>
            Boolean(categoryBody && Array.isArray(categoryBody.products)),
        });
      }
    }
  } catch {
    apiErrorRate.add(1);
    successRate.add(false);
    scenarioErrors.add(1);
  } finally {
    browseLatency.add(Date.now() - start);
  }

  sleep(THINK_TIME);
}

export function searchProducts() {
  const start = Date.now();
  const keyword = randomItem(SEARCH_KEYWORDS);

  try {
    // Search products
    const searchRes = http.get(
      `${BASE_URL}/api/v1/product/search/${encodeURIComponent(keyword)}`,
      {
        tags: { endpoint: "product_search" },
      },
    );

    const searchBody = safeJson(searchRes);

    const searchCheck = check(searchRes, {
      "search: status is 200": (r) => r.status === 200,
      "search: returns array": () => Array.isArray(searchBody),
    });

    if (!searchCheck) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
    } else {
      apiErrorRate.add(0);
      successRate.add(true);
    }

    // Get paginated list
    const page = 1 + Math.floor(Math.random() * 5);
    const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
      tags: { endpoint: "product_list" },
    });

    const listBody = safeJson(listRes);

    const listCheck = check(listRes, {
      "search: product-list status is 200": (r) => r.status === 200,
      "search: product-list returns products": () =>
        Boolean(listBody && Array.isArray(listBody.products)),
    });

    if (!listCheck) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
    } else {
      apiErrorRate.add(0);
    }
  } catch {
    apiErrorRate.add(1);
    successRate.add(false);
    scenarioErrors.add(1);
  } finally {
    searchLatency.add(Date.now() - start);
  }

  sleep(THINK_TIME);
}

export function filterProducts() {
  const start = Date.now();

  try {
    // Filter products by price or category
    const filterRes = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      JSON.stringify({
        checked: [],
        radio: [100, 5000],
      }),
      {
        headers: jsonHeaders(),
        tags: { endpoint: "product_filter" },
      },
    );

    const filterBody = safeJson(filterRes);

    const filterCheck = check(filterRes, {
      "filter: status is 200": (r) => r.status === 200,
      "filter: returns array": () => Array.isArray(filterBody),
    });

    if (!filterCheck) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
    } else {
      apiErrorRate.add(0);
      successRate.add(true);
    }

    // Get a single product if available
    if (filterBody && Array.isArray(filterBody) && filterBody.length > 0) {
      const product = filterBody[Math.floor(Math.random() * filterBody.length)];
      const slug = product.slug;

      const singleRes = http.get(
        `${BASE_URL}/api/v1/product/get-product/${slug}`,
      );

      const singleBody = safeJson(singleRes);

      check(singleRes, {
        "filter: single product status is 200": (r) => r.status === 200,
        "filter: single product has data": () =>
          Boolean(singleBody && (singleBody.product || singleBody)),
      });

      // Cover related-products endpoint from a selected product detail.
      const singleProduct = singleBody?.product || singleBody;
      const productId = singleProduct?._id || product?._id;
      const categoryId = extractCategoryId(singleProduct) || extractCategoryId(product);

      if (productId && categoryId) {
        const relatedRes = http.get(
          `${BASE_URL}/api/v1/product/related-product/${productId}/${categoryId}`,
          { tags: { endpoint: "related_product" } },
        );

        const relatedBody = safeJson(relatedRes);
        check(relatedRes, {
          "filter: related-product status is 200": (r) => r.status === 200,
          "filter: related-product returns array": () => Array.isArray(relatedBody),
        });
      }
    }
  } catch {
    apiErrorRate.add(1);
    successRate.add(false);
    scenarioErrors.add(1);
  } finally {
    filterLatency.add(Date.now() - start);
  }

  sleep(THINK_TIME);
}

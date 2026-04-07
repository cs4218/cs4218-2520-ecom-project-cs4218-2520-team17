import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Sebastian Tay, A0252864X
//TODO verify the VU scenarios flow before commencing long soak test - just want to check the calling of API endpoints, no need simulate user interaction flows

const BASE_URL = "http://localhost:6060";
const TARGET_VUS = 100;
const WARM_UP = "10m";
const SOAK_HOLD = "700m";
const COOL_DOWN = "10m";
// const WARM_UP = "1m";
// const SOAK_HOLD = "2m";
// const COOL_DOWN = "1m";
const THINK_TIME = 0.5;

const USER_EMAIL = "cs4218@test.com";
const USER_PASSWORD = "cs4218@test.com";
const ADMIN_EMAIL = "test@admin.com";
const ADMIN_PASSWORD = "test@admin.com";

const SEARCH_KEYWORDS = "phone,laptop,shoe,bag,watch,headphone,camera,tablet"
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

// Throughput counters for endpoint-level requests over time.
const endpointRequestsTotalThroughput = new Counter(
  "endpoint_requests_total_throughput",
);
const endpointSuccessfulRequestsTotalThroughput = new Counter(
  "endpoint_successful_requests_total_throughput",
);

// Response Duration
const productBrowseResponseDuration = new Trend("product_browse_response_duration", true);
const productCountResponseDuration = new Trend("product_count_response_duration", true);
const productPhotoResponseDuration = new Trend("product_photo_response_duration", true);
const productCategoryResponseDuration = new Trend("product_category_response_duration", true);
const productSearchResponseDuration = new Trend("product_search_response_duration", true);
const productListResponseDuration = new Trend("product_list_response_duration", true);
const productFilterResponseDuration = new Trend("product_filter_response_duration", true);
const productDetailResponseDuration = new Trend("product_detail_response_duration", true);
const relatedProductResponseDuration = new Trend("related_product_response_duration", true);


// Error Rates
const productBrowseApiErrorRate = new Rate("product_browse_api_error_rate");
const productCountApiErrorRate = new Rate("product_count_api_error_rate");
const productPhotoApiErrorRate = new Rate("product_photo_api_error_rate");
const productCategoryApiErrorRate = new Rate("product_category_api_error_rate");
const productSearchApiErrorRate = new Rate("product_search_api_error_rate");
const productListApiErrorRate = new Rate("product_list_api_error_rate");
const productFilterApiErrorRate = new Rate("product_filter_api_error_rate");
const productDetailApiErrorRate = new Rate("product_detail_api_error_rate");
const relatedProductApiErrorRate = new Rate("related_product_api_error_rate");

function recordEndpointThroughput(endpoint, res) {
  endpointRequestsTotalThroughput.add(1, {
    endpoint,
    status: String(res.status),
  });

  if (res.status >= 200 && res.status < 400) {
    endpointSuccessfulRequestsTotalThroughput.add(1, { endpoint });
  }
}

function loginAndGetToken(email, password, label) {
  const endpoint = `auth_login_${label}`;
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { endpoint } },
  );
  recordEndpointThroughput(endpoint, loginRes);

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
    product_browse_api_error_rate: ["rate<0.01"],
    product_count_api_error_rate: ["rate<0.01"],
    product_photo_api_error_rate: ["rate<0.10"],
    product_category_api_error_rate: ["rate<0.10"],
    product_search_api_error_rate: ["rate<0.05"],
    product_list_api_error_rate: ["rate<0.01"],
    product_filter_api_error_rate: ["rate<0.05"],
    product_detail_api_error_rate: ["rate<0.05"],
    related_product_api_error_rate: ["rate<0.10"]
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
  try {
    // Get all products
    const listRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { endpoint: "product_browse" },
    });
    recordEndpointThroughput("product_browse", listRes);
    productBrowseResponseDuration.add(listRes.timings.duration);

    const listBody = safeJson(listRes);

    const listCheck = check(listRes, {
      "browse: get-product status is 200": (r) => r.status === 200,
      "browse: has success property": () =>
        Boolean(listBody && listBody.success === true),
      "browse: returns products array": () =>
        Boolean(listBody && Array.isArray(listBody.products)),
    });

    if (!listCheck) {
      productBrowseApiErrorRate.add(1);
    } else {
      productBrowseApiErrorRate.add(0);
    }

    // Get product count
    const countRes = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { endpoint: "product_count" },
    });
    recordEndpointThroughput("product_count", countRes);
    productCountResponseDuration.add(countRes.timings.duration);

    const countBody = safeJson(countRes);

    const countCheck = check(countRes, {
      "browse: product-count status is 200": (r) => r.status === 200,
      "browse: count is numeric": () =>
        Boolean(countBody && Number.isFinite(countBody.total)),
    });

    if (!countCheck) {
      productCountApiErrorRate.add(1);
    } else {
      productCountApiErrorRate.add(0);
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
        recordEndpointThroughput("product_photo", photoRes);
        productPhotoResponseDuration.add(photoRes.timings.duration);
        const photoCheck = check(photoRes, {
          "browse: product-photo status is 200": (r) => r.status === 200,
        });

        if (!photoCheck) {
          productPhotoApiErrorRate.add(1);
        } else {
          productPhotoApiErrorRate.add(0);
        }
      }

      const categorySlug = extractCategorySlug(sampledProduct);
      if (categorySlug) {
        const categoryRes = http.get(
          `${BASE_URL}/api/v1/product/product-category/${categorySlug}`,
          { tags: { endpoint: "product_category" } },
        );
        recordEndpointThroughput("product_category", categoryRes);
        productCategoryResponseDuration.add(categoryRes.timings.duration);

        const categoryBody = safeJson(categoryRes);
        const categoryCheck = check(categoryRes, {
          "browse: product-category status is 200": (r) => r.status === 200,
          "browse: product-category has products": () =>
            Boolean(categoryBody && Array.isArray(categoryBody.products)),
        });

        if (!categoryCheck) {
          productCategoryApiErrorRate.add(1);
        } else {
          productCategoryApiErrorRate.add(0);
        }
      }
    }
  } catch {
    productBrowseApiErrorRate.add(1);
    productCountApiErrorRate.add(1);
    productPhotoApiErrorRate.add(1);
    productCategoryApiErrorRate.add(1);
  }

  sleep(THINK_TIME);
}

export function searchProducts() {
  const keyword = randomItem(SEARCH_KEYWORDS);

  try {
    // Search products
    const searchRes = http.get(
      `${BASE_URL}/api/v1/product/search/${encodeURIComponent(keyword)}`,
      {
        tags: { endpoint: "product_search" },
      },
    );
    recordEndpointThroughput("product_search", searchRes);
    productSearchResponseDuration.add(searchRes.timings.duration);

    const searchBody = safeJson(searchRes);

    const searchCheck = check(searchRes, {
      "search: status is 200": (r) => r.status === 200,
      "search: returns array": () => Array.isArray(searchBody),
    });

    if (!searchCheck) {
      productSearchApiErrorRate.add(1);
    } else {
      productSearchApiErrorRate.add(0);
    }

    // Get paginated list
    const page = 1 + Math.floor(Math.random() * 5);
    const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
      tags: { endpoint: "product_list" },
    });
    recordEndpointThroughput("product_list", listRes);
    productListResponseDuration.add(listRes.timings.duration);

    const listBody = safeJson(listRes);

    const listCheck = check(listRes, {
      "search: product-list status is 200": (r) => r.status === 200,
      "search: product-list returns products": () =>
        Boolean(listBody && Array.isArray(listBody.products)),
    });

    if (!listCheck) {
      productListApiErrorRate.add(1);
    } else {
      productListApiErrorRate.add(0);
    }
  } catch {
    productSearchApiErrorRate.add(1);
    productListApiErrorRate.add(1);
  }

  sleep(THINK_TIME);
}

export function filterProducts() {
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
    recordEndpointThroughput("product_filter", filterRes);
    productFilterResponseDuration.add(filterRes.timings.duration);

    const filterBody = safeJson(filterRes);

    const filterCheck = check(filterRes, {
      "filter: status is 200": (r) => r.status === 200,
      "filter: returns array": () => Array.isArray(filterBody),
    });

    if (!filterCheck) {
      productFilterApiErrorRate.add(1);
    } else {
      productFilterApiErrorRate.add(0);
    }

    // Get a single product if available
    if (filterBody && Array.isArray(filterBody) && filterBody.length > 0) {
      const product = filterBody[Math.floor(Math.random() * filterBody.length)];
      const slug = product.slug;

      const singleRes = http.get(
        `${BASE_URL}/api/v1/product/get-product/${slug}`,
        {
          tags: { endpoint: "product_detail" },
        },
      );
      recordEndpointThroughput("product_detail", singleRes);
      productDetailResponseDuration.add(singleRes.timings.duration);

      const singleBody = safeJson(singleRes);

      const singleCheck = check(singleRes, {
        "filter: single product status is 200": (r) => r.status === 200,
        "filter: single product has data": () =>
          Boolean(singleBody && (singleBody.product || singleBody)),
      });

      if (!singleCheck) {
        productDetailApiErrorRate.add(1);
      } else {
        productDetailApiErrorRate.add(0);
      }

      // Cover related-products endpoint from a selected product detail.
      const singleProduct = singleBody?.product || singleBody;
      const productId = singleProduct?._id || product?._id;
      const categoryId = extractCategoryId(singleProduct) || extractCategoryId(product);

      if (productId && categoryId) {
        const relatedRes = http.get(
          `${BASE_URL}/api/v1/product/related-product/${productId}/${categoryId}`,
          { tags: { endpoint: "related_product" } },
        );
        recordEndpointThroughput("related_product", relatedRes);
        relatedProductResponseDuration.add(relatedRes.timings.duration);

        const relatedBody = safeJson(relatedRes);
        const relatedCheck = check(relatedRes, {
          "filter: related-product status is 200": (r) => r.status === 200,
          "filter: related-product returns array": () => Array.isArray(relatedBody),
        });

        if (!relatedCheck) {
          relatedProductApiErrorRate.add(1);
        } else {
          relatedProductApiErrorRate.add(0);
        }
      }
    }
  } catch {
    productFilterApiErrorRate.add(1);
    productDetailApiErrorRate.add(1);
    relatedProductApiErrorRate.add(1);
  }

  sleep(THINK_TIME);
}

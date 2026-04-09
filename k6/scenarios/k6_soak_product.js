import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Sebastian Tay, A0252864X

const BASE_URL = "http://localhost:6060";
const TARGET_VUS = 100;
const WARM_UP = "10m";
const SOAK_HOLD = "700m";
const COOL_DOWN = "10m";
const THINK_TIME = 0.5;

const USER_EMAIL = "cs4218@test.com";
const USER_PASSWORD = "cs4218@test.com";
const ADMIN_EMAIL = "test@admin.com";
const ADMIN_PASSWORD = "test@admin.com";
const CRUD_SOAK_MARKER = "[SOAK-CRUD]";
const BOOK_CATEGORY_SLUG = "book";
const DEFAULT_BOOK_CATEGORY_ID = "66db427fdb0119d9234b27ef";

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
const productCreateResponseDuration = new Trend("product_create_response_duration", true);
const productUpdateResponseDuration = new Trend("product_update_response_duration", true);
const productDeleteResponseDuration = new Trend("product_delete_response_duration", true);


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
const productCreateApiErrorRate = new Rate("product_create_api_error_rate");
const productUpdateApiErrorRate = new Rate("product_update_api_error_rate");
const productDeleteApiErrorRate = new Rate("product_delete_api_error_rate");

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

function getBookCategoryId() {
  const categoriesRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: {
      endpoint: "category_list",
      name: "GET /api/v1/category/get-category",
    },
  });

  const categoriesBody = safeJson(categoriesRes);
  const categories = Array.isArray(categoriesBody?.category)
    ? categoriesBody.category
    : [];

  const bookCategory = categories.find(
    (c) => c?.slug === BOOK_CATEGORY_SLUG || String(c?.name || "").toLowerCase() === "book",
  );

  if (bookCategory?._id) {
    return bookCategory._id;
  }

  return DEFAULT_BOOK_CATEGORY_ID;
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

function authHeaders(token = "") {
  const headers = {};
  if (token) {
    headers.Authorization = token;
  }
  return headers;
}

function buildProductPayload(categoryId, nameSuffix) {
  return {
    name: `${CRUD_SOAK_MARKER} Soak Product ${nameSuffix}`,
    description: `Generated by soak test ${nameSuffix}`,
    price: "199",
    category: categoryId,
    quantity: "5",
    shipping: "true",
  };
}

function isAdminCrudSoakProduct(product) {
  const name = String(product?.name || "");
  return (
    name.startsWith(`${CRUD_SOAK_MARKER} `) ||
    name.startsWith("Soak Product ") ||
    name.startsWith("Soak Product Updated ")
  );
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
const filterVus = Math.max(1, Math.floor(TARGET_VUS * 0.2));
const crudVus = Math.max(1, Math.floor(TARGET_VUS * 0.05));


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
    admin_product_crud: {
      executor: "ramping-vus",
      exec: "adminProductCrud",
      startVUs: 0,
      stages: [
        { duration: WARM_UP, target: crudVus },
        { duration: SOAK_HOLD, target: crudVus },
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
    "http_req_duration{endpoint:product_browse}": ["p(95)<900", "p(99)<1400"],
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
    "http_req_duration{endpoint:product_category}": ["p(95)<2000", "p(99)<2300"],
    "http_req_failed{endpoint:related_product}": ["rate<0.10"],
    "http_req_duration{endpoint:related_product}": ["p(95)<10000", "p(99)<12000"],
    "http_req_failed{endpoint:product_create}": ["rate<0.10"],
    "http_req_duration{endpoint:product_create}": ["p(95)<1200", "p(99)<2000"],
    "http_req_failed{endpoint:product_update}": ["rate<0.10"],
    "http_req_duration{endpoint:product_update}": ["p(95)<1200", "p(99)<2000"],
    "http_req_failed{endpoint:product_delete}": ["rate<0.10"],
    "http_req_duration{endpoint:product_delete}": ["p(95)<1200", "p(99)<2000"],
    product_browse_api_error_rate: ["rate<0.01"],
    product_count_api_error_rate: ["rate<0.01"],
    product_photo_api_error_rate: ["rate<0.10"],
    product_category_api_error_rate: ["rate<0.10"],
    product_search_api_error_rate: ["rate<0.05"],
    product_list_api_error_rate: ["rate<0.01"],
    product_filter_api_error_rate: ["rate<0.05"],
    product_detail_api_error_rate: ["rate<0.05"],
    related_product_api_error_rate: ["rate<0.10"],
    product_create_api_error_rate: ["rate<0.10"],
    product_update_api_error_rate: ["rate<0.10"],
    product_delete_api_error_rate: ["rate<0.10"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

// Runs at start of script before any scenarios iteration
export function setup() {
  const userToken = loginAndGetToken(USER_EMAIL, USER_PASSWORD, "user");
  const adminToken = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD, "admin");
  const bookCategoryId = getBookCategoryId();

  return {
    userToken,
    adminToken,
    bookCategoryId,
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
    const products = Array.isArray(listBody?.products)
      ? listBody.products.filter((p) => !isAdminCrudSoakProduct(p))
      : [];
    if (products.length > 0) {
      const sampledProduct = randomItem(products);

      if (sampledProduct?._id) {
        const photoRes = http.get(
          `${BASE_URL}/api/v1/product/product-photo/${sampledProduct._id}`,
          {
            tags: {
              endpoint: "product_photo",
              name: "GET /api/v1/product/product-photo/:id",
            },
          },
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
          {
            tags: {
              endpoint: "product_category",
              name: "GET /api/v1/product/product-category/:slug",
            },
          },
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
        tags: {
          endpoint: "product_search",
          name: "GET /api/v1/product/search/:keyword",
        },
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
      tags: {
        endpoint: "product_list",
        name: "GET /api/v1/product/product-list/:page",
      },
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

export function filterProducts(data) {
  const bookCategoryId = data?.bookCategoryId || DEFAULT_BOOK_CATEGORY_ID;
  try {
    // Filter products by price or category
    const filterRes = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      JSON.stringify({
        checked: [bookCategoryId],
        radio: [50, 60],
      }),
      {
        headers: jsonHeaders(),
        tags: { endpoint: "product_filter" },
      },
    );
    //Response should consist only of "The Law of Contract in Singapore" book
    recordEndpointThroughput("product_filter", filterRes);
    productFilterResponseDuration.add(filterRes.timings.duration);

    const filterBody = safeJson(filterRes);

    const filterCheck = check(filterRes, {
      "filter: status is 200": (r) => r.status === 200,
      "filter: returns array": () => Array.isArray(filterBody?.products),
    });

    if (!filterCheck) {
      productFilterApiErrorRate.add(1);
    } else {
      productFilterApiErrorRate.add(0);
    }

    // Get a single product if available
    if (filterBody.products && Array.isArray(filterBody.products) && filterBody.products.length > 0) {
      const product = filterBody.products[0];
      const slug = product.slug;

      const singleRes = http.get(
        `${BASE_URL}/api/v1/product/get-product/${slug}`,
        {
          tags: {
            endpoint: "product_detail",
            name: "GET /api/v1/product/get-product/:slug",
          },
        },
      );
      recordEndpointThroughput("product_detail", singleRes);
      productDetailResponseDuration.add(singleRes.timings.duration);

      const singleBody = safeJson(singleRes);

      const singleCheck = check(singleRes, {
        "filter: single product status is 200": (r) => r.status === 200,
        "filter: single product has data": () =>
          Boolean(singleBody && singleBody.product),
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
          {
            tags: {
              endpoint: "related_product",
              name: "GET /api/v1/product/related-product/:productId/:categoryId",
            },
          },
        );
        recordEndpointThroughput("related_product", relatedRes);
        relatedProductResponseDuration.add(relatedRes.timings.duration);

        const relatedBody = safeJson(relatedRes);
        const relatedCheck = check(relatedRes, {
          "filter: related-product status is 200": (r) => r.status === 200,
          "filter: related-product returns array": () => Array.isArray(relatedBody?.products),
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

export function adminProductCrud(data) {
  const adminToken = data?.adminToken || "";
  const bookCategoryId = data?.bookCategoryId || DEFAULT_BOOK_CATEGORY_ID;

  if (!adminToken) {
    sleep(THINK_TIME);
    return;
  }

  try {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const createPayload = buildProductPayload(bookCategoryId, suffix);

    const createRes = http.post(
      `${BASE_URL}/api/v1/product/create-product`,
      createPayload,
      {
        headers: authHeaders(adminToken),
        tags: { endpoint: "product_create" },
      },
    );
    recordEndpointThroughput("product_create", createRes);
    productCreateResponseDuration.add(createRes.timings.duration);

    const createBody = safeJson(createRes);
    const createdProduct = createBody?.products;
    const productId = createdProduct?._id;

    const createCheck = check(createRes, {
      "crud: create-product status is 201": (r) => r.status === 201,
      "crud: create-product returns id": () => Boolean(productId),
    });

    if (!createCheck) {
      productCreateApiErrorRate.add(1);
      sleep(THINK_TIME);
      return;
    }
    productCreateApiErrorRate.add(0);

    const updateRes = http.put(
      `${BASE_URL}/api/v1/product/update-product/${productId}`,
      {
        ...createPayload,
        name: `Soak Product Updated ${suffix}`,
        quantity: "8",
      },
      {
        headers: authHeaders(adminToken),
        tags: {
          endpoint: "product_update",
          name: "PUT /api/v1/product/update-product/:id",
        },
      },
    );
    recordEndpointThroughput("product_update", updateRes);
    productUpdateResponseDuration.add(updateRes.timings.duration);

    const updateBody = safeJson(updateRes);
    const updateCheck = check(updateRes, {
      "crud: update-product status is 201": (r) => r.status === 201,
      "crud: update-product success": () => Boolean(updateBody?.success),
    });

    if (!updateCheck) {
      productUpdateApiErrorRate.add(1);
      sleep(THINK_TIME);
      return;
    }
    productUpdateApiErrorRate.add(0);

    const deleteRes = http.del(
      `${BASE_URL}/api/v1/product/delete-product/${productId}`,
      null,
      {
        headers: authHeaders(adminToken),
        tags: {
          endpoint: "product_delete",
          name: "DELETE /api/v1/product/delete-product/:id",
        },
      },
    );
    recordEndpointThroughput("product_delete", deleteRes);
    productDeleteResponseDuration.add(deleteRes.timings.duration);

    const deleteBody = safeJson(deleteRes);
    const deleteCheck = check(deleteRes, {
      "crud: delete-product status is 200": (r) => r.status === 200,
      "crud: delete-product success": () => Boolean(deleteBody?.success),
    });

    if (!deleteCheck) {
      productDeleteApiErrorRate.add(1);
    } else {
      productDeleteApiErrorRate.add(0);
    }
  } catch {
    productCreateApiErrorRate.add(1);
    productUpdateApiErrorRate.add(1);
    productDeleteApiErrorRate.add(1);
  }

  sleep(THINK_TIME);
}

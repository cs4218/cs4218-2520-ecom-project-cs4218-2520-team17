import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const PRODUCT_COUNT_PATH = __ENV.PRODUCT_COUNT_PATH || "/api/v1/product/product-count";
const PRODUCT_LIST_PATH = __ENV.PRODUCT_LIST_PATH || "/api/v1/product/product-list";
const PRODUCT_DETAIL_PATH = __ENV.PRODUCT_DETAIL_PATH || "/api/v1/product/get-product";

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return (Number.isNaN(parsed) || parsed < 1) ? fallback : parsed;
}

const PER_PAGE = toPositiveInt(__ENV.PER_PAGE, 6);

export const options = {
  scenarios: {
    browse_stress: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "2m", target: 100 },
        { duration: "3m", target: 200 },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["avg<1500"],
    checks: ["rate>0.95"],
  },
};

export function setup() {
  const countUrl = `${BASE_URL}${PRODUCT_COUNT_PATH}`;
  const countResponse = http.get(countUrl, { tags: { endpoint: "product-count" } });

  let totalProducts = 0;
  try {
    totalProducts = Number(countResponse.json("total")) || 0;
  } catch {
    totalProducts = 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / PER_PAGE));
  return { totalPages };
}

function randomPage(totalPages) {
  // 1 <= page <= totalPages
  return Math.floor(Math.random() * totalPages) + 1;
}

function randomSlug(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return undefined;
  }
  // 0 <= index <= products.length - 1
  const index = Math.floor(Math.random() * products.length);
  return products[index]?.slug;
}

export default function productBrowseCapacityTest(data) {
  const page = randomPage(data.totalPages);
  const listUrl = `${BASE_URL}${PRODUCT_LIST_PATH}/${page}`;
  const listResponse = http.get(listUrl, { tags: { endpoint: "product-list" } });

  const listCheckPassed = check(listResponse, {
    "product list status is 200": (r) => r.status === 200,
    "product list success true": (r) => {
      try {
        return r.json("success") === true;
      } catch {
        return false;
      }
    },
  });

  if (!listCheckPassed) {
    return;
  }

  let products;
  try {
    products = listResponse.json("products");
  } catch {
    return;
  }

  const slug = randomSlug(products);
  if (!slug) {
    return;
  }

  const detailUrl = `${BASE_URL}${PRODUCT_DETAIL_PATH}/${slug}`;
  const detailResponse = http.get(detailUrl, { tags: { endpoint: "product-detail" } });

  check(detailResponse, {
    "product detail status is 200": (r) => r.status === 200,
    "product detail success true": (r) => {
      try {
        return r.json("success") === true;
      } catch {
        return false;
      }
    },
  });
}

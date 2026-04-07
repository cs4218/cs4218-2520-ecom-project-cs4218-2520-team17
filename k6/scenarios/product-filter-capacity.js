import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const CATEGORY_PATH = __ENV.CATEGORY_PATH || "/api/v1/category/get-category";
const FILTER_PATH = __ENV.FILTER_PATH || "/api/v1/product/product-filters";

const PRICE_RANGES = [
  [0, 19],
  [20, 39],
  [40, 59],
  [60, 79],
  [80, 99],
  [100, 9999],
];

export const options = {
  scenarios: {
    product_filter_stress: {
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

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function randomPriceRange() {
  return PRICE_RANGES[randomInt(PRICE_RANGES.length)];
}

function maybeCategory(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  // Returns an empty list sometimes so some requests test price-only filters.
  if (Math.random() < 0.3) {
    return [];
  }

  const maxSelection = Math.min(3, categories.length);
  const selectionCount = randomInt(maxSelection) + 1;
  const selectedIds = new Set();
  
  // Choose 1–3 unique category IDs
  while (selectedIds.size < selectionCount) {
    const category = categories[randomInt(categories.length)];
    if (category?._id) {
      selectedIds.add(category._id);
    }
  }

  return Array.from(selectedIds);
}

export function setup() {
  const categoryUrl = `${BASE_URL}${CATEGORY_PATH}`;
  const categoryResponse = http.get(categoryUrl, {
    tags: { endpoint: "get-category" },
  });

  let categories = [];
  try {
    categories = categoryResponse.json("category") || [];
  } catch {
    categories = [];
  }

  return { categories };
}

export default function productFilterCapacityTest(data) {
  const payload = {
    checked: maybeCategory(data.categories),
    radio: randomPriceRange(),
  };

  const filterUrl = `${BASE_URL}${FILTER_PATH}`;
  const response = http.post(filterUrl, JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "product-filters" },
  });

  check(response, {
    "filter status is 200": (r) => r.status === 200,
    "filter success true": (r) => {
      try {
        return r.json("success") === true;
      } catch {
        return false;
      }
    },
    "filter products array": (r) => {
      try {
        return Array.isArray(r.json("products"));
      } catch {
        return false;
      }
    },
  });
}

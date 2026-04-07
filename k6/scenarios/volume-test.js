// Li Jiakai, A0252287Y

import { sleep } from "k6";
import { Counter, Gauge, Trend } from "k6/metrics";
import { buildSeededAdminEmail, buildSeededUserEmail, randomInt, randomPick, shuffleCopy, toBooleanEnv, uniqueName } from "../utils/common.js";
import { checkUserAuth, login, registerUser } from "../utils/auth.js";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../utils/categories.js";
import { createOrderPayment, listAllOrders, listUserOrders, updateOrderStatus } from "../utils/orders.js";
import { createProduct, deleteProduct, getProductCount, listLatestProducts, listProductsPage, searchProducts, updateProduct } from "../utils/products.js";
import { scenarioErrors } from "../utils/metrics.js";

const BASE_URL = (__ENV.BASE_URL || "http://host.docker.internal:6060").replace(/\/$/, "");
const API_BASE = `${BASE_URL}/api/v1`;

const USER_VUS = Number(__ENV.USER_VUS || 100);
const DATA_GROWTH_VUS = Number(__ENV.DATA_GROWTH_VUS || 4);
const RAMP_UP = __ENV.RAMP_UP || "5m";
const STEADY_DURATION = __ENV.STEADY_DURATION || "30m";
const RAMP_DOWN = __ENV.RAMP_DOWN || "5m";
const DATA_GROWTH_DURATION = __ENV.DATA_GROWTH_DURATION || "40m";
const ADMIN_ACTIONS_DURATION = __ENV.ADMIN_ACTIONS_DURATION || DATA_GROWTH_DURATION;
const ADMIN_ACTIONS_SLEEP_SECONDS = Number(__ENV.ADMIN_ACTIONS_SLEEP_SECONDS || 1);

const SEEDED_USERS = Number(__ENV.VOLUME_SEED_USERS || 5000);
const SEEDED_ADMINS = Number(__ENV.VOLUME_SEED_ADMINS || 5);
const SEEDED_CATEGORIES = Number(__ENV.VOLUME_SEED_CATEGORIES || 100);
const SEEDED_PRODUCTS = Number(__ENV.VOLUME_SEED_PRODUCTS || 10000);
const SEEDED_ORDERS = Number(__ENV.VOLUME_SEED_ORDERS || 10000);

const DATA_GROWTH_USERS_PER_CYCLE = Number(__ENV.DATA_GROWTH_USERS_PER_CYCLE || 5);
const DATA_GROWTH_PRODUCTS_PER_CYCLE = Number(__ENV.DATA_GROWTH_PRODUCTS_PER_CYCLE || 10);
const DATA_GROWTH_ORDERS_PER_CYCLE = Number(__ENV.DATA_GROWTH_ORDERS_PER_CYCLE || 20);
const DATA_GROWTH_CYCLE_SLEEP_SECONDS = Number(__ENV.DATA_GROWTH_CYCLE_SLEEP_SECONDS || 1);

const USER_PASSWORD = __ENV.VOLUME_TEST_PASSWORD || "VolumeTest!123";
const ADMIN_EMAIL = __ENV.VOLUME_ADMIN_EMAIL || buildSeededAdminEmail(1);
const ADMIN_PASSWORD = __ENV.VOLUME_ADMIN_PASSWORD || USER_PASSWORD;
const INCLUDE_PAYMENT = toBooleanEnv(__ENV.INCLUDE_PAYMENT, true);
const MAX_DISTINCT_PRODUCTS_PER_ORDER = Number(__ENV.VOLUME_MAX_DISTINCT_PRODUCTS || 20);
const MAX_QTY_PER_PRODUCT = Number(__ENV.VOLUME_MAX_PRODUCT_QTY || 10);

const registeredUsers = new Counter("registered_users");
const createdCategories = new Counter("created_categories");
const createdProducts = new Counter("created_products");
const createdOrders = new Counter("created_orders");
const addedUsers = new Counter("added_users");
const addedCategories = new Counter("added_categories");
const addedProducts = new Counter("added_products");
const addedOrders = new Counter("added_orders");
const addedUsersUserTraffic = new Counter("added_users_user_traffic");
const addedUsersDataGrowth = new Counter("added_users_data_growth");
const addedCategoriesUserTraffic = new Counter("added_categories_user_traffic");
const addedCategoriesDataGrowth = new Counter("added_categories_data_growth");
const addedProductsUserTraffic = new Counter("added_products_user_traffic");
const addedProductsDataGrowth = new Counter("added_products_data_growth");
const addedOrdersUserTraffic = new Counter("added_orders_user_traffic");
const addedOrdersDataGrowth = new Counter("added_orders_data_growth");
const dbUsersTotal = new Gauge("db_users_total");
const dbCategoriesTotal = new Gauge("db_categories_total");
const dbProductsTotal = new Gauge("db_products_total");
const dbOrdersTotal = new Gauge("db_orders_total");
const dbEntitySamples = new Counter("db_entity_samples");
const paymentFailures = new Counter("payment_failures");
const dataGrowthWrites = new Counter("data_growth_writes");
const adminActionsIterations = new Counter("admin_actions_iterations");
const adminActionsFailures = new Counter("admin_actions_failures");
const adminActionsCycleDuration = new Trend("admin_actions_cycle_duration", true);
const adminCategoryGetOps = new Counter("admin_category_get_ops");
const adminCategoryGetFailures = new Counter("admin_category_get_failures");
const adminCategoryGetDuration = new Trend("admin_category_get_duration", true);
const adminCategoryCreateOps = new Counter("admin_category_create_ops");
const adminCategoryCreateFailures = new Counter("admin_category_create_failures");
const adminCategoryCreateDuration = new Trend("admin_category_create_duration", true);
const adminCategoryUpdateOps = new Counter("admin_category_update_ops");
const adminCategoryUpdateFailures = new Counter("admin_category_update_failures");
const adminCategoryUpdateDuration = new Trend("admin_category_update_duration", true);
const adminCategoryDeleteOps = new Counter("admin_category_delete_ops");
const adminCategoryDeleteFailures = new Counter("admin_category_delete_failures");
const adminCategoryDeleteDuration = new Trend("admin_category_delete_duration", true);
const adminOrderListOps = new Counter("admin_order_list_ops");
const adminOrderListFailures = new Counter("admin_order_list_failures");
const adminOrderListDuration = new Trend("admin_order_list_duration", true);
const adminOrderStatusUpdateOps = new Counter("admin_order_status_update_ops");
const adminOrderStatusUpdateFailures = new Counter("admin_order_status_update_failures");
const adminOrderStatusUpdateDuration = new Trend("admin_order_status_update_duration", true);
const adminProductCreateOps = new Counter("admin_product_create_ops");
const adminProductCreateFailures = new Counter("admin_product_create_failures");
const adminProductCreateDuration = new Trend("admin_product_create_duration", true);
const adminProductUpdateOps = new Counter("admin_product_update_ops");
const adminProductUpdateFailures = new Counter("admin_product_update_failures");
const adminProductUpdateDuration = new Trend("admin_product_update_duration", true);
const adminProductDeleteOps = new Counter("admin_product_delete_ops");
const adminProductDeleteFailures = new Counter("admin_product_delete_failures");
const adminProductDeleteDuration = new Trend("admin_product_delete_duration", true);

const READ_ENDPOINT_BUDGET = ["p(90)<2000", "p(95)<4000", "p(99)<8000"]
const WRITE_ENDPOINT_BUDGET = ["p(90)<3000", "p(95)<5000", "p(99)<10000"]

const RESOURCE_DURATION_BUDGETS = {
  login: READ_ENDPOINT_BUDGET,
  "auth-register": WRITE_ENDPOINT_BUDGET,
  "user-auth": READ_ENDPOINT_BUDGET,

  "category-list": READ_ENDPOINT_BUDGET,
  "category-create": WRITE_ENDPOINT_BUDGET,
  "category-update": WRITE_ENDPOINT_BUDGET,
  "category-delete": WRITE_ENDPOINT_BUDGET,

  "order-list-user": READ_ENDPOINT_BUDGET,
  "order-list-admin": WRITE_ENDPOINT_BUDGET,
  "order-status-update": WRITE_ENDPOINT_BUDGET,
  "braintree-token": READ_ENDPOINT_BUDGET,
  "order-create-payment": WRITE_ENDPOINT_BUDGET,

  "product-count": READ_ENDPOINT_BUDGET,
  "product-list-page": WRITE_ENDPOINT_BUDGET,
  "product-list-latest": WRITE_ENDPOINT_BUDGET,
  "product-search": READ_ENDPOINT_BUDGET,
  "product-create": WRITE_ENDPOINT_BUDGET,
  "product-update": WRITE_ENDPOINT_BUDGET,
  "product-delete": WRITE_ENDPOINT_BUDGET,
};

const RESOURCE_DURATION_THRESHOLDS = Object.fromEntries(
  Object.entries(RESOURCE_DURATION_BUDGETS).map(([resource, threshold]) => [
    `http_req_duration{resource:${resource}}`,
    threshold,
  ])
);

const RESOURCE_FAILURE_THRESHOLDS = Object.fromEntries(
  Object.keys(RESOURCE_DURATION_BUDGETS).map((resource) => [
    `http_req_failed{resource:${resource}}`,
    ["rate<0.05"],
  ])
);

export const options = {
  scenarios: {
    user_traffic: {
      executor: "ramping-vus",
      exec: "simulateUsers",
      startVUs: 1,
      gracefulRampDown: "30s",
      stages: [
        { duration: RAMP_UP, target: USER_VUS },
        { duration: STEADY_DURATION, target: USER_VUS },
        { duration: RAMP_DOWN, target: 0 },
      ],
    },
    admin_actions: {
      executor: "constant-vus",
      exec: "adminActions",
      vus: 1,
      duration: ADMIN_ACTIONS_DURATION,
      gracefulStop: "30s",
    },
    data_growth: {
      executor: "constant-vus",
      exec: "dataGrowth",
      vus: DATA_GROWTH_VUS,
      duration: DATA_GROWTH_DURATION,
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:read}": ["p(95)<800", "p(99)<1200"],
    "http_req_duration{endpoint:write}": ["p(95)<1200", "p(99)<2000"],
    dropped_iterations: ["count<200"],
    scenario_errors: ["count<3000"],
    ...RESOURCE_DURATION_THRESHOLDS,
    ...RESOURCE_FAILURE_THRESHOLDS,
  },
};

let userSession;
let growthSession;
let growthUserSession;
let adminActionSession;
let cachedCategoryIds = [];

let estimatedUsersTotal = SEEDED_USERS + SEEDED_ADMINS;
let estimatedCategoriesTotal = SEEDED_CATEGORIES;
let estimatedProductsTotal = SEEDED_PRODUCTS;
let estimatedOrdersTotal = SEEDED_ORDERS;

function captureEntityTotals(tags = {}) {
  dbUsersTotal.add(estimatedUsersTotal, tags);
  dbCategoriesTotal.add(estimatedCategoriesTotal, tags);
  dbProductsTotal.add(estimatedProductsTotal, tags);
  dbOrdersTotal.add(estimatedOrdersTotal, tags);

  dbEntitySamples.add(1, tags);
}

function runMeasuredOperation(metric, tags, action) {
  const startedAt = Date.now();
  const result = action();
  metric.add(Date.now() - startedAt, tags);
  return result;
}

function buildGrowthUserPayload(prefix = "growth-user") {
  const name = uniqueName(prefix);
  return {
    name,
    email: `${name}@test.local`,
    password: USER_PASSWORD,
    phone: String(randomInt(81000000, 99999999)),
    address: `Growth Address ${name}`,
    answer: `answer-${name}`,
  };
}

function buildProductPayload(categoryId) {
  const suffix = uniqueName("growth-product");
  return {
    name: `Growth Product ${suffix}`,
    description: `Generated by data-growth scenario ${suffix}`,
    price: randomInt(10, 2500),
    category: categoryId,
    quantity: randomInt(1, 120),
    shipping: Math.random() < 0.7,
  };
}

function resolveMaxPage(totalProducts) {
  const perPage = 6;
  return Math.max(1, Math.ceil(Math.max(1, totalProducts) / perPage));
}

function collectDistinctProducts(maxDistinct, maxPage) {
  const selected = new Map();
  const safetyLimit = 10;

  for (let i = 0; i < safetyLimit && selected.size < maxDistinct; i += 1) {
    const page = randomInt(1, maxPage);
    const products = listProductsPage(API_BASE, page, { scenario: "collect-products" });

    const shuffled = shuffleCopy(products);
    for (const item of shuffled) {
      if (item && item._id) {
        selected.set(String(item._id), item);
      }
      if (selected.size >= maxDistinct) {
        break;
      }
    }
  }

  return Array.from(selected.values());
}

function buildCartWithQuantities(products) {
  const cart = [];

  for (const product of products) {
    const qty = randomInt(1, MAX_QTY_PER_PRODUCT);
    for (let i = 0; i < qty; i += 1) {
      cart.push({
        _id: product._id,
        price: product.price,
      });
    }
  }

  return cart;
}

function loginSeededUserByVu() {
  const userIndex = ((__VU - 1) % SEEDED_USERS) + 1;
  const email = buildSeededUserEmail(userIndex);
  const auth = login(API_BASE, email, USER_PASSWORD, { scenario: "user-traffic" });

  if (!auth) {
    scenarioErrors.add(1, { scenario: "user-traffic", stage: "seeded-login" });
    return null;
  }

  return {
    email,
    token: auth.token,
  };
}

function ensureGrowthUserSession() {
  if (growthUserSession && growthUserSession.token) {
    return growthUserSession;
  }

  const index = randomInt(1, SEEDED_USERS);
  const email = buildSeededUserEmail(index);
  const auth = login(API_BASE, email, USER_PASSWORD, { scenario: "data-growth" });

  if (!auth) {
    return null;
  }

  growthUserSession = {
    email,
    token: auth.token,
  };

  return growthUserSession;
}

function ensureAdminActionSession(setupData) {
  if (adminActionSession && adminActionSession.adminToken) {
    return adminActionSession;
  }

  adminActionSession = {
    adminToken: setupData.adminToken,
    categoryIds: [...(setupData.categoryIds || [])],
  };

  return adminActionSession;
}

export function setup() {
  const adminAuth = login(API_BASE, ADMIN_EMAIL, ADMIN_PASSWORD, { scenario: "setup" });

  if (!adminAuth) {
    throw new Error(`Unable to login admin account ${ADMIN_EMAIL}`);
  }

  const categories = listCategories(API_BASE, { scenario: "setup" });
  const categoryIds = categories.map((item) => item._id).filter(Boolean);

  const totalProducts = getProductCount(API_BASE, { scenario: "setup" });
  const maxPage = resolveMaxPage(totalProducts);

  estimatedUsersTotal = SEEDED_USERS + SEEDED_ADMINS;
  estimatedCategoriesTotal = categoryIds.length || estimatedCategoriesTotal;
  estimatedProductsTotal = totalProducts || estimatedProductsTotal;
  estimatedOrdersTotal = SEEDED_ORDERS;

  captureEntityTotals({ scenario: "setup" });

  return {
    adminToken: adminAuth.token,
    categoryIds,
    maxPage,
  };
}

export function simulateUsers(setupData) {
  if (!userSession || !userSession.token) {
    userSession = loginSeededUserByVu();
    if (!userSession) {
      sleep(1);
      return;
    }
  }

  const roll = Math.random();

  if (roll < 0.7) {
    // 70% read/browse traffic
    const maxPage = Math.max(1, setupData.maxPage || 1);
    listProductsPage(API_BASE, randomInt(1, maxPage), { scenario: "user-traffic" });

    if (Math.random() < 0.35) {
      listLatestProducts(API_BASE, { scenario: "user-traffic" });
    }

    if (Math.random() < 0.35) {
      searchProducts(API_BASE, "Volume", { scenario: "user-traffic" });
    }
  } else if (roll < 0.9) {
    // 20% auth traffic: mix of session checks, login, and registration
    const authRoll = Math.random();

    if (authRoll < 0.45) {
      // 45% of auth branch: session check
      checkUserAuth(API_BASE, userSession.token, { scenario: "user-traffic" });
    } else if (authRoll < 0.8) {
      // 35% of auth branch: login
      const relogin = login(API_BASE, userSession.email, USER_PASSWORD, {
        scenario: "user-traffic",
      });
      if (relogin && relogin.token) {
        userSession.token = relogin.token;
      }
    } else {
      // 20% of auth branch: registration
      const payload = buildGrowthUserPayload("user-traffic-signup");
      const result = registerUser(API_BASE, payload, { scenario: "user-traffic" });

      if (result.response.status === 201) {
        registeredUsers.add(1, { scenario: "user-traffic" });
        addedUsers.add(1, { scenario: "user-traffic" });
        addedUsersUserTraffic.add(1);
        estimatedUsersTotal += 1;
        captureEntityTotals({ scenario: "user-traffic" });

        const auth = login(API_BASE, payload.email, payload.password, {
          scenario: "user-traffic",
        });

        if (auth && auth.token) {
          userSession = {
            email: payload.email,
            token: auth.token,
          };
        }
      }
    }
  } else {
    // 10% order/payment branch
    listUserOrders(API_BASE, userSession.token, { scenario: "user-traffic" });

    if (INCLUDE_PAYMENT && Math.random() < 0.5) {
      const products = listProductsPage(API_BASE, randomInt(1, Math.max(1, setupData.maxPage)), {
        scenario: "user-traffic",
      });

      if (products.length > 0) {
        const picked = shuffleCopy(products).slice(0, randomInt(1, Math.min(4, products.length)));
        const cart = buildCartWithQuantities(picked);

        const payment = createOrderPayment(
          API_BASE,
          userSession.token,
          "fake-valid-nonce",
          cart,
          { scenario: "user-traffic" }
        );

        if (payment.ok && payment.data && payment.data.ok === true) {
          createdOrders.add(1, { scenario: "user-traffic" });
          addedOrders.add(1, { scenario: "user-traffic" });
          addedOrdersUserTraffic.add(1);
          estimatedOrdersTotal += 1;
          captureEntityTotals({ scenario: "user-traffic" });
        } else {
          paymentFailures.add(1, { scenario: "user-traffic" });
          scenarioErrors.add(1, { scenario: "user-traffic", stage: "payment" });
        }
      }
    }

    // Keep scenario-specific counters present even if this scenario does not create these entities.
    addedCategoriesUserTraffic.add(0);
    addedProductsUserTraffic.add(0);
  }

  sleep(Math.random() * 2 + 0.4);
}

// Adds data constantly to model growth and observe performance implications.
export function dataGrowth(setupData) {
  if (!growthSession || !growthSession.adminToken) {
    growthSession = { adminToken: setupData.adminToken };
    cachedCategoryIds = setupData.categoryIds || [];
  }

  if (cachedCategoryIds.length === 0) {
    cachedCategoryIds = listCategories(API_BASE, { scenario: "data-growth" })
      .map((item) => item._id)
      .filter(Boolean);
    estimatedCategoriesTotal = cachedCategoryIds.length || estimatedCategoriesTotal;
  }

  // +5 users per cycle
  for (let i = 0; i < DATA_GROWTH_USERS_PER_CYCLE; i += 1) {
    const payload = buildGrowthUserPayload("data-growth-user");
    const result = registerUser(API_BASE, payload, { scenario: "data-growth" });

    if (result.response.status === 201) {
      registeredUsers.add(1, { scenario: "data-growth" });
      addedUsers.add(1, { scenario: "data-growth" });
      addedUsersDataGrowth.add(1);
      dataGrowthWrites.add(1, { scenario: "data-growth", type: "user" });
      estimatedUsersTotal += 1;
    }
  }

  // +10 products per cycle
  for (let i = 0; i < DATA_GROWTH_PRODUCTS_PER_CYCLE; i += 1) {
    const categoryId = randomPick(cachedCategoryIds);
    if (!categoryId) {
      break;
    }

    const product = createProduct(
      API_BASE,
      growthSession.adminToken,
      buildProductPayload(categoryId),
      { scenario: "data-growth" }
    );

    if (product && product._id) {
      createdProducts.add(1, { scenario: "data-growth" });
      addedProducts.add(1, { scenario: "data-growth" });
      addedProductsDataGrowth.add(1);
      dataGrowthWrites.add(1, { scenario: "data-growth", type: "product" });
      estimatedProductsTotal += 1;
    }
  }

  // Sync products total from backend once per cycle.
  const productCount = getProductCount(API_BASE, { scenario: "data-growth" });
  if (productCount > 0) {
    estimatedProductsTotal = productCount;
  }

  // +20 orders per cycle
  if (INCLUDE_PAYMENT) {
    const session = ensureGrowthUserSession();
    if (session) {
      const maxPage = resolveMaxPage(estimatedProductsTotal);
      const productPool = collectDistinctProducts(
        Math.min(MAX_DISTINCT_PRODUCTS_PER_ORDER * 3, 120),
        maxPage
      );

      for (let i = 0; i < DATA_GROWTH_ORDERS_PER_CYCLE; i += 1) {
        if (productPool.length === 0) {
          break;
        }

        const picked = shuffleCopy(productPool).slice(
          0,
          randomInt(1, Math.min(MAX_DISTINCT_PRODUCTS_PER_ORDER, productPool.length))
        );
        const cart = buildCartWithQuantities(picked);

        const payment = createOrderPayment(
          API_BASE,
          session.token,
          "fake-valid-nonce",
          cart,
          { scenario: "data-growth" }
        );

        if (payment.ok && payment.data && payment.data.ok === true) {
          createdOrders.add(1, { scenario: "data-growth" });
          addedOrders.add(1, { scenario: "data-growth" });
          addedOrdersDataGrowth.add(1);
          dataGrowthWrites.add(1, { scenario: "data-growth", type: "order" });
          estimatedOrdersTotal += 1;
        } else {
          paymentFailures.add(1, { scenario: "data-growth" });
          scenarioErrors.add(1, { scenario: "data-growth", stage: "payment" });
        }
      }
    } else {
      scenarioErrors.add(1, { scenario: "data-growth", stage: "login-user" });
    }
  }

  // Keep per-scenario counters visible even when unchanged in this scenario.
  addedCategoriesDataGrowth.add(0);
  addedCategoriesUserTraffic.add(0);
  addedProductsUserTraffic.add(0);

  captureEntityTotals({ scenario: "data-growth" });
  sleep(DATA_GROWTH_CYCLE_SLEEP_SECONDS);
}

// Simulates 1 admin doing admin-related actions
export function adminActions(setupData) {
  const session = ensureAdminActionSession(setupData);
  const tags = { scenario: "admin-actions" };
  const cycleStartedAt = Date.now();
  let hasFailure = false;

  adminActionsIterations.add(1, tags);

  adminCategoryGetOps.add(1, tags);
  const categories = runMeasuredOperation(adminCategoryGetDuration, tags, () =>
    listCategories(API_BASE, tags)
  );
  if (categories.length > 0) {
    session.categoryIds = categories.map((item) => item._id).filter(Boolean);
    estimatedCategoriesTotal = session.categoryIds.length;
  } else {
    adminCategoryGetFailures.add(1, tags);
    hasFailure = true;
  }

  const categoryName = `Admin Category ${uniqueName("admin-category")}`;
  let createdCategoryId;

  adminCategoryCreateOps.add(1, tags);
  const createdCategory = runMeasuredOperation(adminCategoryCreateDuration, tags, () =>
    createCategory(API_BASE, session.adminToken, categoryName, tags)
  );
  if (createdCategory && createdCategory._id) {
    createdCategoryId = createdCategory._id;
    createdCategories.add(1, tags);
    addedCategories.add(1, tags);
    estimatedCategoriesTotal += 1;
  } else {
    adminCategoryCreateFailures.add(1, tags);
    hasFailure = true;
    scenarioErrors.add(1, { scenario: "admin-actions", stage: "category-create" });
  }

  if (createdCategoryId) {
    adminCategoryUpdateOps.add(1, tags);
    const updatedCategory = runMeasuredOperation(adminCategoryUpdateDuration, tags, () =>
      updateCategory(
        API_BASE,
        session.adminToken,
        createdCategoryId,
        `${categoryName} Updated`,
        tags
      )
    );

    if (!updatedCategory) {
      adminCategoryUpdateFailures.add(1, tags);
      hasFailure = true;
      scenarioErrors.add(1, { scenario: "admin-actions", stage: "category-update" });
    }
  }

  adminOrderListOps.add(1, tags);
  const allOrders = runMeasuredOperation(adminOrderListDuration, tags, () =>
    listAllOrders(API_BASE, session.adminToken, tags)
  );
  if (allOrders.length === 0) {
    adminOrderListFailures.add(1, tags);
    hasFailure = true;
  }

  if (allOrders.length > 0) {
    const order = randomPick(allOrders);
    if (order && order._id) {
      adminOrderStatusUpdateOps.add(1, tags);
      const updatedOrder = runMeasuredOperation(
        adminOrderStatusUpdateDuration,
        tags,
        () =>
          updateOrderStatus(
            API_BASE,
            session.adminToken,
            order._id,
            randomPick(["Not Process", "Processing", "Shipped", "Delivered"]),
            tags
          )
      );

      if (!updatedOrder) {
        adminOrderStatusUpdateFailures.add(1, tags);
        hasFailure = true;
        scenarioErrors.add(1, { scenario: "admin-actions", stage: "order-status-update" });
      }
    } else {
      adminOrderStatusUpdateFailures.add(1, tags);
      hasFailure = true;
    }
  }

  // Exercise the admin order listing endpoint again to model repeated dashboard checks.
  adminOrderListOps.add(1, tags);
  const secondOrderList = runMeasuredOperation(adminOrderListDuration, tags, () =>
    listAllOrders(API_BASE, session.adminToken, tags)
  );
  if (secondOrderList.length === 0) {
    adminOrderListFailures.add(1, tags);
    hasFailure = true;
  }

  const categoryForProduct = createdCategoryId || randomPick(session.categoryIds);
  let createdProductId;

  if (categoryForProduct) {
    adminProductCreateOps.add(1, tags);
    const createdProduct = runMeasuredOperation(adminProductCreateDuration, tags, () =>
      createProduct(
        API_BASE,
        session.adminToken,
        buildProductPayload(categoryForProduct),
        tags
      )
    );

    if (createdProduct && createdProduct._id) {
      createdProductId = createdProduct._id;
      createdProducts.add(1, tags);
      addedProducts.add(1, tags);
      estimatedProductsTotal += 1;

      adminProductUpdateOps.add(1, tags);
      const updatedProduct = runMeasuredOperation(adminProductUpdateDuration, tags, () =>
        updateProduct(
          API_BASE,
          session.adminToken,
          createdProductId,
          {
            ...buildProductPayload(categoryForProduct),
            name: `Admin Product ${uniqueName("admin-product-update")}`,
          },
          tags
        )
      );

      if (!updatedProduct) {
        adminProductUpdateFailures.add(1, tags);
        hasFailure = true;
        scenarioErrors.add(1, { scenario: "admin-actions", stage: "product-update" });
      }
    } else {
      adminProductCreateFailures.add(1, tags);
      hasFailure = true;
      scenarioErrors.add(1, { scenario: "admin-actions", stage: "product-create" });
    }
  } else {
    adminProductCreateFailures.add(1, tags);
    hasFailure = true;
    scenarioErrors.add(1, { scenario: "admin-actions", stage: "product-category-unavailable" });
  }

  if (createdProductId) {
    adminProductDeleteOps.add(1, tags);
    const deletedProduct = runMeasuredOperation(adminProductDeleteDuration, tags, () =>
      deleteProduct(API_BASE, session.adminToken, createdProductId, tags)
    );
    if (deletedProduct) {
      estimatedProductsTotal = Math.max(0, estimatedProductsTotal - 1);
    } else {
      adminProductDeleteFailures.add(1, tags);
      hasFailure = true;
      scenarioErrors.add(1, { scenario: "admin-actions", stage: "product-delete" });
    }
  }

  if (createdCategoryId) {
    adminCategoryDeleteOps.add(1, tags);
    const deletedCategory = runMeasuredOperation(adminCategoryDeleteDuration, tags, () =>
      deleteCategory(API_BASE, session.adminToken, createdCategoryId, tags)
    );
    if (deletedCategory) {
      estimatedCategoriesTotal = Math.max(0, estimatedCategoriesTotal - 1);
    } else {
      adminCategoryDeleteFailures.add(1, tags);
      hasFailure = true;
      scenarioErrors.add(1, { scenario: "admin-actions", stage: "category-delete" });
    }
  }

  if (hasFailure) {
    adminActionsFailures.add(1, tags);
  }
  adminActionsCycleDuration.add(Date.now() - cycleStartedAt, tags);

  captureEntityTotals(tags);
  sleep(ADMIN_ACTIONS_SLEEP_SECONDS);
}

export function handleSummary(data) {
  return {
    "k6/reports/k6-summary-runtime.json": JSON.stringify(data, null, 2),
  };
}

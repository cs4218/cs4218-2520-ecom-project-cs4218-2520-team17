import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Sebastian Tay, A0252864X

const BASE_URL = "http://localhost:6060";
const TARGET_VUS = 30;
const WARM_UP = "10m";
const SOAK_HOLD = "700m";
const COOL_DOWN = "10m";
// For quick testing
// const WARM_UP = "1m";
// const SOAK_HOLD = "2m";
// const COOL_DOWN = "1m";
const THINK_TIME = 1;

const USER_EMAIL = "cs4218@test.com";
const USER_PASSWORD = "cs4218@test.com";
const ADMIN_EMAIL = "test@admin.com";
const ADMIN_PASSWORD = "test@admin.com";

const userOrdersLatency = new Trend("user_orders_latency", true);
const orderStatusLatency = new Trend("order_status_latency", true);
const apiErrorRate = new Rate("order_api_error_rate");
const successRate = new Rate("order_success_rate");
const scenarioErrors = new Counter("order_scenario_errors");

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

const userVus = Math.max(1, Math.floor(TARGET_VUS * 0.6));
const adminVus = Math.max(1, Math.floor(TARGET_VUS * 0.4));

export const options = {
  scenarios: {
    user_orders: {
      executor: "ramping-vus",
      exec: "getUserOrders",
      startVUs: 0,
      stages: [
        { duration: WARM_UP, target: userVus },
        { duration: SOAK_HOLD, target: userVus },
        { duration: COOL_DOWN, target: 0 },
      ],
      gracefulRampDown: "1m",
    },
    admin_operations: {
      executor: "ramping-vus",
      exec: "adminOrderOperations",
      startVUs: 0,
      stages: [
        { duration: WARM_UP, target: adminVus },
        { duration: SOAK_HOLD, target: adminVus },
        { duration: COOL_DOWN, target: 0 },
      ],
      gracefulRampDown: "1m",
    },
  },
  thresholds: {
    checks: ["rate>0.90"],
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    "http_req_failed{endpoint:user_orders}": ["rate<0.05"],
    "http_req_duration{endpoint:user_orders}": ["p(95)<900", "p(99)<1500"],
    "http_req_failed{endpoint:all_orders}": ["rate<0.10"],
    "http_req_duration{endpoint:all_orders}": ["p(95)<1200", "p(99)<2000"],
    "http_req_failed{endpoint:order_status}": ["rate<0.10"],
    "http_req_duration{endpoint:order_status}": ["p(95)<1000", "p(99)<1800"],
    order_success_rate: ["rate>0.85"],
    order_scenario_errors: ["count<150"],
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

export function getUserOrders(data) {
  const userToken = data?.userToken || "";

  if (!userToken) {
    sleep(THINK_TIME);
    return;
  }

  const start = Date.now();

  try {
    const ordersRes = http.get(`${BASE_URL}/api/v1/order/orders`, {
      headers: jsonHeaders(userToken),
      tags: { endpoint: "user_orders" },
    });

    const ordersBody = safeJson(ordersRes);

    const checkResult = check(ordersRes, {
      "user orders: status is 200": (r) => r.status === 200,
      "user orders: returns array or object": () =>
        Boolean(
          ordersBody &&
            (Array.isArray(ordersBody) || ordersBody.orders),
        ),
    });

    if (!checkResult) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
    } else {
      apiErrorRate.add(0);
      successRate.add(true);
    }
  } catch {
    apiErrorRate.add(1);
    successRate.add(false);
    scenarioErrors.add(1);
  } finally {
    userOrdersLatency.add(Date.now() - start);
  }

  sleep(THINK_TIME);
}

export function adminOrderOperations(data) {
  const adminToken = data?.adminToken || "";

  if (!adminToken) {
    sleep(THINK_TIME);
    return;
  }

  const start = Date.now();

  try {
    // Get all orders first
    const allOrdersRes = http.get(`${BASE_URL}/api/v1/order/all-orders`, {
      headers: jsonHeaders(adminToken),
      tags: { endpoint: "all_orders" },
    });

    const allOrdersBody = safeJson(allOrdersRes);

    const getAllCheck = check(allOrdersRes, {
      "all orders: status is 200": (r) => r.status === 200,
      "all orders: returns data": () =>
        Boolean(
          allOrdersBody &&
            (Array.isArray(allOrdersBody) || allOrdersBody.orders),
        ),
    });

    if (!getAllCheck) {
      apiErrorRate.add(1);
      successRate.add(false);
      scenarioErrors.add(1);
      sleep(THINK_TIME);
      return;
    }

    // Optionally update order status (if we have a valid order ID)
    const orders = Array.isArray(allOrdersBody) ? allOrdersBody : (allOrdersBody?.orders || []);
    if (orders.length > 0) {
      const randomOrder = orders[Math.floor(Math.random() * orders.length)];
      const orderId = randomOrder._id;

      const statusRes = http.put(
        `${BASE_URL}/api/v1/order/order-status/${orderId}`,
        JSON.stringify({
          status: "Shipped",
        }),
        {
          headers: jsonHeaders(adminToken),
          tags: { endpoint: "order_status" },
        },
      );

      const statusBody = safeJson(statusRes);

      const statusCheck = check(statusRes, {
        "update status: status is 200": (r) => r.status === 200,
        "update status: has response": () => Boolean(statusBody),
      });

      if (!statusCheck) {
        apiErrorRate.add(1);
        successRate.add(false);
        scenarioErrors.add(1);
      } else {
        apiErrorRate.add(0);
        successRate.add(true);
      }
    } else {
      apiErrorRate.add(0);
      successRate.add(true);
    }
  } catch {
    apiErrorRate.add(1);
    successRate.add(false);
    scenarioErrors.add(1);
  } finally {
    orderStatusLatency.add(Date.now() - start);
  }

  sleep(THINK_TIME);
}

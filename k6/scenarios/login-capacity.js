// Tan Zhi Heng, A0252037M

import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const LOGIN_PATH = __ENV.LOGIN_PATH || "/api/v1/auth/login";
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || "cs4218@test.com";
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || "cs4218@test.com";

if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new TypeError("LOGIN_EMAIL and LOGIN_PASSWORD environment variables are required.");
}

export const options = {
  scenarios: {
    login_stress: {
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
    http_req_duration: ["avg<3000"],
    checks: ["rate>0.95"],
  },
};

export default function loginCapacityTest() {
  const url = `${BASE_URL}${LOGIN_PATH}`;
  const payload = {
    email: LOGIN_EMAIL,
    password: LOGIN_PASSWORD,
  };

  const response = http.post(url, JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "login" },
  });

  check(response, {
    "login status is 200": (r) => r.status === 200,
    "login success true": (r) => {
      try {
        return r.json("success") === true;
      } catch {
        return false;
      }
    },
    "login token present": (r) => {
      try {
        return Boolean(r.json("token"));
      } catch {
        return false;
      }
    },
  });
}

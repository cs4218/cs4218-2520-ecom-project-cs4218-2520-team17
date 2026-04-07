import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const REGISTER_PATH = __ENV.REGISTER_PATH || "/api/v1/auth/register";

export const options = {
  scenarios: {
    register_stress: {
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

function uniqueEmail() {
  const uid = `${Date.now()}-${__VU}-${__ITER}`;
  return `k6-user-${uid}@example.com`;
}

function testPassword() {
  return __ENV.REGISTER_PASSWORD || `k6Pass-${__VU}-${__ITER}-Aa1`;
}

export default function registerCapacityTest() {
const url = `${BASE_URL}${REGISTER_PATH}`;
  const payload = {
    name: `k6-user-${__VU}-${__ITER}`,
    email: uniqueEmail(),
    password: testPassword(),
    phone: "81234567",
    address: "K6 Load Test Address",
    answer: "basketball",
  };

  const response = http.post(url, JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "register" },
  });

  check(response, {
    "register status is 201": (r) => r.status === 201,
    "register success true": (r) => {
      try {
        return r.json("success") === true;
      } catch {
        return false;
      }
    },
  });
}
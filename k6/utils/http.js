import http from "k6/http";
import { check } from "k6";
import { recordEndpointMetrics, scenarioErrors } from "./metrics.js";

export function parseJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function makeJsonParams(token, tags = {}, extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: token } : {}),
    ...(extra.headers || {}),
  };

  return {
    ...extra,
    tags,
    headers,
  };
}

export function makeFormParams(token, tags = {}, extra = {}) {
  const headers = {
    ...(token ? { Authorization: token } : {}),
    ...(extra.headers || {}),
  };

  return {
    ...extra,
    tags,
    headers,
  };
}

export function expectStatus(response, expectedStatus, label) {
  const ok = check(response, {
    [`${label} status ${expectedStatus}`]:
      (res) => res.status === expectedStatus,
  });

  if (!ok) {
    scenarioErrors.add(1, response.request ? response.request.tags : {});
  }

  return ok;
}

export function get(url, params) {
  const response = http.get(url, params);
  recordEndpointMetrics(response, params);
  return response;
}

export function postJson(url, payload, params) {
  const response = http.post(url, JSON.stringify(payload), params);
  recordEndpointMetrics(response, params);
  return response;
}

export function putJson(url, payload, params) {
  const response = http.put(url, JSON.stringify(payload), params);
  recordEndpointMetrics(response, params);
  return response;
}

export function postForm(url, payload, params) {
  const response = http.post(url, payload, params);
  recordEndpointMetrics(response, params);
  return response;
}

export function putForm(url, payload, params) {
  const response = http.put(url, payload, params);
  recordEndpointMetrics(response, params);
  return response;
}

export function del(url, payload, params) {
  const response = http.del(url, payload, params);
  recordEndpointMetrics(response, params);
  return response;
}

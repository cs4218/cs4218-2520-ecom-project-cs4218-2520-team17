import { Counter, Rate, Trend } from "k6/metrics";

export const scenarioErrors = new Counter("scenario_errors");

const RESOURCE_KEYS = [
  "login",
  "auth-register",
  "user-auth",

  "category-list",
  "category-create",
  "category-update",
  "category-delete",

  "order-list-user",
  "order-list-admin",
  "order-status-update",
  "braintree-token",
  "order-create-payment",

  "product-count",
  "product-list-page",
  "product-list-latest",
  "product-search",
  "product-create",
  "product-update",
  "product-delete",
];
const ADMIN_RESOURCE_PREFIX = "admin";
const METRIC_RESOURCE_KEYS = [
  ...RESOURCE_KEYS,
  ...RESOURCE_KEYS.map((resource) => `${ADMIN_RESOURCE_PREFIX}-${resource}`),
];

const TIMING_FIELDS = [
  ["duration", "http_req_duration"],
  ["waiting", "http_req_waiting"],
];

function toMetricKey(value, fallback = "unclassified") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function buildEndpointMetricSet(resource) {
  const metricKey = toMetricKey(resource);
  const timings = {};

  for (const [timingField, sourceMetric] of TIMING_FIELDS) {
    timings[timingField] = new Trend(`endpoint_${metricKey}_${sourceMetric}`, true);
  }

  return {
    timings,
    errorRate: new Rate(`endpoint_${metricKey}_error_rate`),
  };
}

const endpointMetricSets = Object.fromEntries(
  METRIC_RESOURCE_KEYS.map((resource) => [resource, buildEndpointMetricSet(resource)])
);
const fallbackEndpointMetricSet = buildEndpointMetricSet("unclassified");

function metricSetsForTags(tags = {}, separateAdminMetrics = false) {
  const resource = tags.resource;
  const sets = [];

  if (resource && endpointMetricSets[resource]) {
    sets.push(endpointMetricSets[resource]);
  } else {
    sets.push(fallbackEndpointMetricSet);
  }

  if (separateAdminMetrics && tags.scenario === "admin-actions" && resource) {
    const adminScopedKey = `${ADMIN_RESOURCE_PREFIX}-${resource}`;
    const adminScopedSet = endpointMetricSets[adminScopedKey];
    if (adminScopedSet) {
      sets.push(adminScopedSet);
    }
  }

  return sets;
}

export function recordEndpointMetrics(response, params = {}) {
  const tags = params && params.tags ? params.tags : {};
  const metricSets = metricSetsForTags(tags);
  const timings = response && response.timings ? response.timings : {};

  const status = response && typeof response.status === "number" ? response.status : 0;
  const isError = status === 0 || status >= 400;

  for (const metrics of metricSets) {
    for (const [timingField] of TIMING_FIELDS) {
      const value = timings[timingField];
      metrics.timings[timingField].add(typeof value === "number" ? value : 0, tags);
    }

    metrics.errorRate.add(isError ? 1 : 0, tags);
  }
}

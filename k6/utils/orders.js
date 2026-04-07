import {
  expectStatus,
  get,
  makeJsonParams,
  parseJson,
  postJson,
  putJson,
} from "./http.js";

export function listUserOrders(apiBase, token, tags = {}) {
  const response = get(
    `${apiBase}/order/orders`,
    makeJsonParams(token, {
      endpoint: "read",
      resource: "order-list-user",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "list user orders");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return Array.isArray(data) ? data : [];
}

export function listAllOrders(apiBase, adminToken, tags = {}) {
  const response = get(
    `${apiBase}/order/all-orders`,
    makeJsonParams(adminToken, {
      endpoint: "read",
      resource: "order-list-admin",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "list all orders");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return Array.isArray(data) ? data : [];
}

export function updateOrderStatus(apiBase, adminToken, orderId, status, tags = {}) {
  const response = putJson(
    `${apiBase}/order/order-status/${orderId}`,
    { status },
    makeJsonParams(adminToken, {
      endpoint: "write",
      resource: "order-status-update",
      operation: "update",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "update order status");
  if (!isOk) {
    return null;
  }

  return parseJson(response);
}

export function getBraintreeToken(apiBase, tags = {}) {
  const response = get(
    `${apiBase}/product/braintree/token`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "braintree-token",
      operation: "fetch",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "get braintree token");
  if (!isOk) {
    return null;
  }

  return parseJson(response);
}

export function createOrderPayment(apiBase, userToken, nonce, cart, tags = {}) {
  const response = postJson(
    `${apiBase}/product/braintree/payment`,
    { nonce, cart },
    makeJsonParams(userToken, {
      endpoint: "write",
      resource: "order-create-payment",
      operation: "create",
      ...tags,
    })
  );

  return {
    response,
    data: parseJson(response),
    ok: response.status === 200,
  };
}

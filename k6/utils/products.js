import {
  del,
  expectStatus,
  get,
  makeFormParams,
  makeJsonParams,
  parseJson,
  postForm,
  postJson,
  putForm,
} from "./http.js";

function toProductFormPayload(product) {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    category: product.category,
    quantity: String(product.quantity),
    shipping: String(Boolean(product.shipping)),
  };
}

export function getProductCount(apiBase, tags = {}) {
  const response = get(
    `${apiBase}/product/product-count`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-count",
      operation: "count",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "product count");
  if (!isOk) {
    return 0;
  }

  const data = parseJson(response);
  return data && typeof data.total === "number" ? data.total : 0;
}

export function listProductsPage(apiBase, page, tags = {}) {
  const response = get(
    `${apiBase}/product/product-list/${page}`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-list-page",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "product list page");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return data && Array.isArray(data.products) ? data.products : [];
}

export function listLatestProducts(apiBase, tags = {}) {
  const response = get(
    `${apiBase}/product/get-product`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-list-latest",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "latest products");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return data && Array.isArray(data.products) ? data.products : [];
}

export function searchProducts(apiBase, keyword, tags = {}) {
  const response = get(
    `${apiBase}/product/search/${encodeURIComponent(keyword)}`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-search",
      operation: "search",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "search products");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  if (Array.isArray(data)) {
    return data;
  }

  return data && Array.isArray(data.results) ? data.results : [];
}

export function getSingleProduct(apiBase, slug, tags = {}) {
  const response = get(
    `${apiBase}/product/get-product/${encodeURIComponent(slug)}`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-detail",
      operation: "get",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "single product");
  if (!isOk) {
    return null;
  }

  const data = parseJson(response);
  return data ? data.product : null;
}

export function getProductPhoto(apiBase, pid, tags = {}) {
  const response = get(
    `${apiBase}/product/product-photo/${pid}`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-photo",
      operation: "get",
      ...tags,
    })
  );

  expectStatus(response, 200, "product photo");
  return response;
}

export function getRelatedProducts(apiBase, pid, cid, tags = {}) {
  const response = get(
    `${apiBase}/product/related-product/${pid}/${cid}`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-related",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "related products");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return data && Array.isArray(data.products) ? data.products : [];
}

export function getProductsByCategory(apiBase, slug, tags = {}) {
  const response = get(
    `${apiBase}/product/product-category/${encodeURIComponent(slug)}`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-category",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "products by category");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return data && Array.isArray(data.products) ? data.products : [];
}

export function filterProducts(apiBase, checked, radio, tags = {}) {
  const response = postJson(
    `${apiBase}/product/product-filters`,
    { checked, radio },
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "product-filter",
      operation: "filter",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "filter products");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return data && Array.isArray(data.products) ? data.products : [];
}

export function createProduct(apiBase, adminToken, product, tags = {}) {
  const response = postForm(
    `${apiBase}/product/create-product`,
    toProductFormPayload(product),
    makeFormParams(adminToken, {
      endpoint: "write",
      resource: "product-create",
      operation: "create",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 201, "create product");
  if (!isOk) {
    return null;
  }

  const data = parseJson(response);
  return data ? data.products : null;
}

export function updateProduct(apiBase, adminToken, productId, product, tags = {}) {
  const response = putForm(
    `${apiBase}/product/update-product/${productId}`,
    toProductFormPayload(product),
    makeFormParams(adminToken, {
      endpoint: "write",
      resource: "product-update",
      operation: "update",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 201, "update product");
  if (!isOk) {
    return null;
  }

  const data = parseJson(response);
  return data ? data.products : null;
}

export function deleteProduct(apiBase, adminToken, productId, tags = {}) {
  const response = del(
    `${apiBase}/product/delete-product/${productId}`,
    null,
    makeFormParams(adminToken, {
      endpoint: "write",
      resource: "product-delete",
      operation: "delete",
      ...tags,
    })
  );

  return expectStatus(response, 200, "delete product");
}

import {
  del,
  expectStatus,
  get,
  makeJsonParams,
  parseJson,
  postJson,
  putJson,
} from "./http.js";

export function listCategories(apiBase, tags = {}) {
  const response = get(
    `${apiBase}/category/get-category`,
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "category-list",
      operation: "list",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "list categories");
  if (!isOk) {
    return [];
  }

  const data = parseJson(response);
  return data && Array.isArray(data.category) ? data.category : [];
}

export function createCategory(apiBase, adminToken, name, tags = {}) {
  const response = postJson(
    `${apiBase}/category/create-category`,
    { name },
    makeJsonParams(adminToken, {
      endpoint: "write",
      resource: "category-create",
      operation: "create",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 201, "create category");
  if (!isOk) {
    return null;
  }

  const data = parseJson(response);
  return data ? data.category : null;
}

export function updateCategory(apiBase, adminToken, categoryId, name, tags = {}) {
  const response = putJson(
    `${apiBase}/category/update-category/${categoryId}`,
    { name },
    makeJsonParams(adminToken, {
      endpoint: "write",
      resource: "category-update",
      operation: "update",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "update category");
  if (!isOk) {
    return null;
  }

  const data = parseJson(response);
  return data ? data.category : null;
}

export function deleteCategory(apiBase, adminToken, categoryId, tags = {}) {
  const response = del(
    `${apiBase}/category/delete-category/${categoryId}`,
    null,
    makeJsonParams(adminToken, {
      endpoint: "write",
      resource: "category-delete",
      operation: "delete",
      ...tags,
    })
  );

  return expectStatus(response, 200, "delete category");
}

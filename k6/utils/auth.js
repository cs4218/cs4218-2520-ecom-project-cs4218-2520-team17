import {
  expectStatus,
  get,
  makeJsonParams,
  parseJson,
  postJson,
} from "./http.js";

export function login(apiBase, email, password, tags = {}) {
  const response = postJson(
    `${apiBase}/auth/login`,
    { email, password },
    makeJsonParams(undefined, {
      endpoint: "read",
      resource: "login",
      operation: "login",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "login");
  if (!isOk) {
    return null;
  }

  const data = parseJson(response);
  if (!data || !data.token) {
    return null;
  }

  return {
    token: data.token,
    user: data.user,
    raw: data,
  };
}

export function registerUser(apiBase, user, tags = {}) {
  const response = postJson(
    `${apiBase}/auth/register`,
    user,
    makeJsonParams(undefined, {
      endpoint: "write",
      resource: "auth-register",
      operation: "register",
      ...tags,
    })
  );

  const accepted = response.status === 201 || response.status === 400;
  if (!accepted) {
    expectStatus(response, 201, "register user");
  }

  return {
    response,
    data: parseJson(response),
  };
}

export function checkUserAuth(apiBase, token, tags = {}) {
  const response = get(
    `${apiBase}/auth/user-auth`,
    makeJsonParams(token, {
      endpoint: "read",
      resource: "user-auth",
      operation: "check",
      ...tags,
    })
  );

  const isOk = expectStatus(response, 200, "user auth");
  if (!isOk) {
    return null;
  }

  return parseJson(response);
}

/**
 * ApiClient — fetch wrapper for the Realmforge Express backend.
 *
 * - All routes are proxied by webpack-dev-server to http://127.0.0.1:3001.
 * - In production, the built bundle is served by Express at /play, so the
 *   same relative paths work unchanged.
 * - JWT is stored in localStorage under KEY_TOKEN and attached automatically.
 */
const KEY_TOKEN = "rf_jwt";

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload.message);
    this.status = status;
    this.payload = payload;
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor() {
    this.token = localStorage.getItem(KEY_TOKEN);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem(KEY_TOKEN, token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem(KEY_TOKEN);
  }

  get hasToken() {
    return this.token !== null;
  }

  get(path) {
    return this.request("GET", path);
  }

  post(path, body) {
    return this.request("POST", path, body);
  }

  put(path, body) {
    return this.request("PUT", path, body);
  }

  async request(method, path, body) {
    const headers = {};
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      let errPayload;
      try {
        errPayload = await res.json();
      } catch {
        errPayload = {
          error: "NetworkError",
          message: `HTTP ${res.status}`
        };
      }
      throw new ApiError(res.status, errPayload);
    }

    if (res.status === 204 || res.status === 205) {
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return null;
    }

    return res.json();
  }
}

// Singleton — one ApiClient instance for the session
export const api = new ApiClient();

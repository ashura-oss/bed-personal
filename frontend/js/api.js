import { getToken } from "./state.js";

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function requestJson(path, options = {}) {
  const response = await fetch(path, buildRequestOptions(options));
  const payload = await readJson(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response), {
      status: response.status,
      payload
    });
  }

  return payload;
}

export function getHealth() {
  return requestJson("/health");
}

function buildRequestOptions(options) {
  const headers = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return {
    ...options,
    headers,
    body:
      options.body !== undefined && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
  };
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new ApiError("Server returned a response the frontend could not read.", {
      status: response.status,
      payload: text
    });
  }
}

function getErrorMessage(payload, response) {
  if (payload?.message) {
    return payload.message;
  }

  return `Request failed with status ${response.status}.`;
}

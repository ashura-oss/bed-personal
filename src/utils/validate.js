import { createHttpError } from "./httpError.js";

export function getRequiredString(source, fieldName) {
  const value = source?.[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      `${fieldName} is required and must be a non-empty string.`
    );
  }

  return value.trim();
}

export function getOptionalString(source, fieldName) {
  const value = source?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      `${fieldName} must be a non-empty string when provided.`
    );
  }

  return value.trim();
}

export function getOptionalInteger(source, fieldName, options = {}) {
  const value = source?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be an integer.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw createHttpError(
      400,
      "Bad Request",
      `${fieldName} must be at least ${options.min}.`
    );
  }

  return value;
}

export function getRequiredInteger(source, fieldName, options = {}) {
  const value = source?.[fieldName];

  if (value === undefined) {
    throw createHttpError(400, "Bad Request", `${fieldName} is required.`);
  }

  if (!Number.isInteger(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be an integer.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw createHttpError(
      400,
      "Bad Request",
      `${fieldName} must be at least ${options.min}.`
    );
  }

  return value;
}

export function getOptionalPositiveIntegerQuery(query, fieldName) {
  const value = query?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} query must be provided once.`);
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw createHttpError(400, "Bad Request", `${fieldName} query must be a positive integer.`);
  }

  return parsedValue;
}

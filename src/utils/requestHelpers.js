// Builds an error object for helpers that cannot respond with res directly.
// Controllers catch this object and turn the status code/message into a JSON response.
export function createHttpError(statusCode, error, message, details) {
  const httpError = new Error(message);
  httpError.statusCode = statusCode;
  httpError.error = error;

  if (details !== undefined) {
    httpError.details = details;
  }

  return httpError;
}

// Sends controller errors in one consistent JSON format.
// Expected errors keep their own status code; unexpected errors become 500 responses.
export function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message: error.message || "Internal Server Error.",
    details: error.details
  });
}

// Reads a required string field and trims it before controller or model logic uses it.
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

// Reads an optional string field and trims it when provided.
// Undefined means "not provided"; blank strings are treated as invalid input.
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

// Reads an optional integer field and checks optional min/max limits.
// This is used for update fields where the route allows partial request bodies.
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

  if (options.max !== undefined && value > options.max) {
    throw createHttpError(
      400,
      "Bad Request",
      `${fieldName} must be at most ${options.max}.`
    );
  }

  return value;
}

// Reads a required integer field and checks optional min/max limits.
// This is used when the route requires a numeric body field such as quantity.
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

  if (options.max !== undefined && value > options.max) {
    throw createHttpError(
      400,
      "Bad Request",
      `${fieldName} must be at most ${options.max}.`
    );
  }

  return value;
}

// Reads a required numeric id from body data.
// String ids from HTTP input are converted to numbers before model functions receive them.
export function getRequiredId(source, fieldName) {
  const value = source?.[fieldName];
  const parsedValue = typeof value === "string" ? Number(value) : value;

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be a positive integer id.`);
  }

  return parsedValue;
}

// Reads an optional numeric id from body data.
// Null and undefined are accepted so optional foreign keys can be left empty.
export function getOptionalId(source, fieldName) {
  const value = source?.[fieldName];

  if (value === undefined || value === null) {
    return undefined;
  }

  return getRequiredId(source, fieldName);
}

// Reads a required numeric id from route parameters.
// Route params always arrive as strings, so this reuses the same positive id validation.
export function getRequiredIdParam(params, fieldName) {
  return getRequiredId(params, fieldName);
}

// Reads a positive integer query value when it is provided.
// Query values are optional filters, so missing values simply return undefined.
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

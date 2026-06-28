// Starts the shared request context used by validation, controllers, and response middleware.
// Every request receives a clean res.locals object before any route-specific middleware runs.
export function initRequestContext(_req, res, next) {
  res.locals.data = undefined;
  res.locals.httpStatus = 200;
  res.locals.message = "Success";

  next();
}

// Parses required or optional route parameters according to a route schema.
// Numeric id fields are converted before controllers receive them.
export function validateParams(schema) {
  return (req, res, next) => parseRequestSource(req.params, schema, "route parameter", res, next);
}

// Parses required or optional JSON body fields according to a route schema.
// Required fields also enforce that the request body is a non-empty JSON object.
export function validateBody(schema) {
  return (req, res, next) => {
    if (!hasJsonObjectBody(req.body)) {
      return res.status(400).json({
        message: "Request body cannot be empty. This route expects a JSON object."
      });
    }

    return parseRequestSource(req.body, schema, "request body", res, next);
  };
}

// Parses update request bodies where at least one allowed field must be provided.
// Only provided fields are copied into res.locals.
export function validateAnyBody(schema) {
  return (req, res, next) => {
    if (!hasJsonObjectBody(req.body)) {
      return res.status(400).json({
        message: "Request body cannot be empty. This update route expects a JSON object."
      });
    }

    const fieldNames = Object.keys(schema);
    const hasAllowedField = fieldNames.some((fieldName) => {
      const definition = schema[fieldName];
      const value = req.body[fieldName];

      return !isMissing(value) || (value === null && definition.nullable);
    });

    if (!hasAllowedField) {
      return res.status(400).json({
        message: `Request body must include at least one of these fields: ${fieldNames.join(", ")}.`
      });
    }

    return parseRequestSource(req.body, optionalSchema(schema), "request body", res, next);
  };
}

// Parses optional query string fields according to a route schema.
// Missing query fields are ignored because query filters are optional.
export function validateQuery(schema) {
  return (req, res, next) => parseRequestSource(req.query, optionalSchema(schema), "query", res, next);
}

// Responds when the request body is not valid JSON.
// Express passes malformed JSON here before the request reaches any route file.
export function handleJsonParseError(error, _req, res, _next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Request body must be valid JSON. Check for invalid quotes, commas, braces, or trailing characters."
    });
  }

  return _next(error);
}

// Treats undefined, null, and blank strings as missing request data.
// A value of 0 is allowed because some routes use 0/1 flags.
function isMissing(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

// Trims string input and leaves non-string values unchanged.
function cleanValue(value) {
  return typeof value === "string" ? value.trim() : value;
}

// Accepts only a non-empty JSON object for body-based routes.
// Arrays and empty objects are rejected because controllers expect named fields.
function hasJsonObjectBody(body) {
  return (
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Object.keys(body).length > 0
  );
}

// Converts a schema to optional form for update bodies and query parameters.
function optionalSchema(schema) {
  return Object.fromEntries(
    Object.entries(schema).map(([fieldName, definition]) => [
      fieldName,
      { ...definition, optional: true }
    ])
  );
}

// Parses one request source and writes validated values to res.locals.
function parseRequestSource(source, schema, sourceName, res, next) {
  for (const [fieldName, definition] of Object.entries(schema)) {
    const value = source?.[fieldName];
    const localName = definition.localName || fieldName;

    if (value === null && definition.nullable) {
      res.locals[localName] = null;
      continue;
    }

    if (isMissing(value)) {
      if (definition.optional) {
        continue;
      }

      return res.status(400).json({
        message: `${fieldName} is required in the ${sourceName}.`
      });
    }

    const parsedResult = parseValue(cleanValue(value), fieldName, definition);

    if (!parsedResult.ok) {
      return res.status(400).json({
        message: parsedResult.message
      });
    }

    res.locals[localName] = parsedResult.value;
  }

  next();
}

// Converts one request value according to its schema definition.
function parseValue(value, fieldName, definition) {
  if (definition.type === "string") {
    return parseStringValue(value, fieldName, definition);
  }

  if (definition.type === "integer") {
    return parseIntegerValue(value, fieldName, definition);
  }

  if (definition.type === "number") {
    return parseNumberValue(value, fieldName, definition);
  }

  if (definition.type === "bit") {
    return parseBitValue(value, fieldName);
  }

  if (definition.type === "array") {
    return parseArrayValue(value, fieldName);
  }

  return {
    ok: false,
    message: `${fieldName} has an unsupported validation type.`
  };
}

// Parses one non-empty string and checks optional length or allowed values.
function parseStringValue(value, fieldName, definition) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      ok: false,
      message: `${fieldName} must be a non-empty string.`
    };
  }

  const parsedValue = value.trim();

  if (definition.minLength !== undefined && parsedValue.length < definition.minLength) {
    return {
      ok: false,
      message: `${fieldName} must be at least ${definition.minLength} characters long.`
    };
  }

  if (definition.options && !definition.options.includes(parsedValue)) {
    return {
      ok: false,
      message: `${fieldName} must be one of: ${definition.options.join(", ")}.`
    };
  }

  return { ok: true, value: parsedValue };
}

// Parses one integer and checks optional min or max rules.
function parseIntegerValue(value, fieldName, definition) {
  const parsedValue = typeof value === "string" ? Number(value) : value;

  if (!Number.isInteger(parsedValue)) {
    return {
      ok: false,
      message: `${fieldName} must be an integer.`
    };
  }

  return validateNumberRange(parsedValue, fieldName, definition);
}

// Parses one finite number and checks optional min or max rules.
function parseNumberValue(value, fieldName, definition) {
  const parsedValue = typeof value === "string" ? Number(value) : value;

  if (typeof parsedValue !== "number" || Number.isNaN(parsedValue) || !Number.isFinite(parsedValue)) {
    return {
      ok: false,
      message: `${fieldName} must be a finite number.`
    };
  }

  return validateNumberRange(parsedValue, fieldName, definition);
}

// Applies numeric min and max checks used by integer and number fields.
function validateNumberRange(parsedValue, fieldName, definition) {
  if (definition.min !== undefined && parsedValue < definition.min) {
    return {
      ok: false,
      message: `${fieldName} must be at least ${definition.min}.`
    };
  }

  if (definition.max !== undefined && parsedValue > definition.max) {
    return {
      ok: false,
      message: `${fieldName} must be at most ${definition.max}.`
    };
  }

  return { ok: true, value: parsedValue };
}

// Parses boolean-like values into SQLite-friendly 0 or 1 values.
function parseBitValue(value, fieldName) {
  if (value === true || value === 1 || value === "1") {
    return { ok: true, value: 1 };
  }

  if (value === false || value === 0 || value === "0") {
    return { ok: true, value: 0 };
  }

  return {
    ok: false,
    message: `${fieldName} must be a boolean or 0/1.`
  };
}

// Parses one array field.
function parseArrayValue(value, fieldName) {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      message: `${fieldName} must be an array.`
    };
  }

  return { ok: true, value };
}

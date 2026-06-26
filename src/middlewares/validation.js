// Checks that required JSON body fields exist before controller logic runs.
export function requireBodyFields(...fieldNames) {
  return (req, res, next) => {
    if (!hasJsonObjectBody(req.body)) {
      return res.status(400).json({
        message: "Request body cannot be empty."
      });
    }

    for (const fieldName of fieldNames) {
      if (isMissing(req.body[fieldName])) {
        return res.status(400).json({
          message: `${fieldName} is required.`
        });
      }
    }

    next();
  };
}

// Checks that at least one allowed JSON body field exists for update routes.
export function requireAnyBodyField(...fieldNames) {
  return (req, res, next) => {
    if (!hasJsonObjectBody(req.body)) {
      return res.status(400).json({
        message: "Request body cannot be empty."
      });
    }

    const hasAllowedField = fieldNames.some((fieldName) => !isMissing(req.body[fieldName]));

    if (!hasAllowedField) {
      return res.status(400).json({
        message: `Provide at least one field: ${fieldNames.join(", ")}.`
      });
    }

    next();
  };
}

// Checks that required route parameters exist before controller logic runs.
export function requireParamFields(...fieldNames) {
  return (req, res, next) => {
    for (const fieldName of fieldNames) {
      if (isMissing(req.params?.[fieldName])) {
        return res.status(400).json({
          message: `${fieldName} parameter is required.`
        });
      }
    }

    next();
  };
}

// Responds when the request body is not valid JSON.
export function handleJsonParseError(error, _req, res, _next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Request body must be valid JSON."
    });
  }

  return _next(error);
}

// Treats undefined, null, and blank strings as missing request data.
function isMissing(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

// Accept only a non-empty JSON object for body-based routes.
function hasJsonObjectBody(body) {
  return body !== undefined && body !== null && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length > 0;
}

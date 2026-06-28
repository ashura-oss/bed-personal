// Checks that required JSON body fields exist before controller logic runs.
// This keeps simple "missing field" validation out of each route controller.
export function requireBodyFields(...fieldNames) {
  return (req, res, next) => {
    if (!hasJsonObjectBody(req.body)) {
      return res.status(400).json({
        message: "Request body cannot be empty. This route expects a JSON object."
      });
    }

    for (const fieldName of fieldNames) {
      if (isMissing(req.body[fieldName])) {
        return res.status(400).json({
          message: `${fieldName} is required in the request body.`
        });
      }
    }

    next();
  };
}

// Checks that at least one allowed JSON body field exists for update routes.
// PUT routes use this so empty update requests fail before model logic runs.
export function requireAnyBodyField(...fieldNames) {
  return (req, res, next) => {
    if (!hasJsonObjectBody(req.body)) {
      return res.status(400).json({
        message: "Request body cannot be empty. This update route expects a JSON object."
      });
    }

    const hasAllowedField = fieldNames.some((fieldName) => !isMissing(req.body[fieldName]));

    if (!hasAllowedField) {
      return res.status(400).json({
        message: `Request body must include at least one of these fields: ${fieldNames.join(", ")}.`
      });
    }

    next();
  };
}

// Checks that required route parameters exist before controller logic runs.
// Controllers still validate type and ownership after this middleware confirms presence.
export function requireParamFields(...fieldNames) {
  return (req, res, next) => {
    for (const fieldName of fieldNames) {
      if (isMissing(req.params?.[fieldName])) {
        return res.status(400).json({
          message: `${fieldName} route parameter is required.`
        });
      }
    }

    next();
  };
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

// Accepts only a non-empty JSON object for body-based routes.
// Arrays and empty objects are rejected because controllers expect named fields.
function hasJsonObjectBody(body) {
  return body !== undefined && body !== null && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length > 0;
}

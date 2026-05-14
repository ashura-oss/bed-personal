import { createHttpError } from "../utils/httpError.js";
import { verifyAuthToken } from "../utils/tokens.js";

export function authenticateToken(req, _res, next) {
  try {
    const token = getBearerToken(req);
    const payload = verifyAuthToken(token);

    if (!payload || typeof payload !== "object" || typeof payload.userId !== "string") {
      throw createHttpError(401, "Unauthorized", "Token payload is invalid.");
    }

    req.auth = {
      userId: payload.userId,
      username: payload.username
    };

    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }

    next(createHttpError(401, "Unauthorized", "Token is invalid or expired."));
  }
}

export function requireSelfParam(paramName) {
  return (req, _res, next) => {
    try {
      requireAuthenticatedUser(req);

      if (req.auth.userId !== req.params[paramName]) {
        throw createHttpError(403, "Forbidden", "You cannot access another user's resource.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireSelfBody(fieldName) {
  return (req, _res, next) => {
    try {
      requireAuthenticatedUser(req);

      if (req.auth.userId !== req.body?.[fieldName]) {
        throw createHttpError(403, "Forbidden", "Request userId must match the logged-in user.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function assertOwnsUserResource(req, userId) {
  if (!req.auth?.userId) {
    throw createHttpError(401, "Unauthorized", "Login is required for this route.");
  }

  if (req.auth.userId !== userId) {
    throw createHttpError(403, "Forbidden", "You cannot access another user's resource.");
  }
}

function getBearerToken(req) {
  const authorizationHeader = req.get("Authorization");

  if (!authorizationHeader) {
    throw createHttpError(401, "Unauthorized", "Authorization header is required.");
  }

  const parts = authorizationHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    throw createHttpError(
      401,
      "Unauthorized",
      "Authorization header must use the Bearer token format."
    );
  }

  return parts[1];
}

function requireAuthenticatedUser(req) {
  if (!req.auth?.userId) {
    throw createHttpError(401, "Unauthorized", "Login is required for this route.");
  }
}

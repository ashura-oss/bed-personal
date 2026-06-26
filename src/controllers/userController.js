// User controller functions handle user validation, loading, and CRUD.
import * as userModel from "../models/userModel.js";
import { createError, sendError } from "../utils/errorCode.js";

// Shared controller steps used before routes that need an existing user.
export async function loadUserFromUserIdParam(req, res, next) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createError(400, "Bad Request", "userId must be a positive integer id.");
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      throw createError(404, "Not Found", "User was not found.");
    }

    res.locals.user = user;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Load user from body for the next controller.
export async function loadUserFromBody(req, res, next) {
  try {
    const value = req.body?.userId;
    const userId = typeof value === "string" ? Number(value) : value;

    if (!Number.isInteger(userId) || userId < 1) {
      throw createError(400, "Bad Request", "userId must be a positive integer id.");
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      throw createError(404, "Not Found", "User was not found.");
    }

    res.locals.user = user;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// User CRUD controllers.
export async function getUsers(req, res, next) {
  try {
    let level;

    if (req.query.level !== undefined) {
      if (Array.isArray(req.query.level)) {
        throw createError(400, "Bad Request", "level query must be provided once.");
      }

      level = Number(req.query.level);

      if (!Number.isInteger(level) || level < 1) {
        throw createError(400, "Bad Request", "level query must be a positive integer.");
      }
    }

    const userList = await userModel.findUsers({ level });

    res.locals.data = userList;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Read one user by id.
export async function getUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      throw createError(404, "Not Found", "User was not found.");
    }

    res.locals.data = user;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Create a user after validating the username.
export async function postUser(req, res, next) {
  try {
    if (typeof req.body.username !== "string" || req.body.username.trim().length === 0) {
      throw createError(400, "Bad Request", "username is required and must be a non-empty string.");
    }

    const username = req.body.username.trim();
    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      throw createError(409, "Conflict", "Username is already taken.");
    }

    const user = await userModel.createUser({ username });

    res.locals.data = user;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Update user by id.
export async function putUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    const updates = buildUserUpdates(req.body);

    if (updates.username !== undefined) {
      const usernameOwner = await userModel.findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== userId) {
        throw createError(409, "Conflict", "Username is already taken.");
      }
    }

    const updatedUser = await userModel.updateUserById(userId, updates);

    if (!updatedUser) {
      throw createError(404, "Not Found", "User was not found.");
    }

    res.locals.data = updatedUser;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Delete user.
export async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    const deletedUser = await userModel.deleteUserById(userId);

    if (!deletedUser) {
      throw createError(404, "Not Found", "User was not found.");
    }

    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Build only the user fields that the request is allowed to update.
function buildUserUpdates(body) {
  const updates = {};

  if (body.username !== undefined) {
    if (typeof body.username !== "string" || body.username.trim().length === 0) {
      throw createError(400, "Bad Request", "username must be a non-empty string when provided.");
    }

    updates.username = body.username.trim();
  }

  if (body.level !== undefined) {
    if (!Number.isInteger(body.level)) {
      throw createError(400, "Bad Request", "level must be an integer.");
    }

    if (body.level < 1) {
      throw createError(400, "Bad Request", "level must be at least 1.");
    }

    updates.level = body.level;
  }

  if (body.xp !== undefined) {
    if (!Number.isInteger(body.xp)) {
      throw createError(400, "Bad Request", "xp must be an integer.");
    }

    if (body.xp < 0) {
      throw createError(400, "Bad Request", "xp must be at least 0.");
    }

    updates.xp = body.xp;
  }

  if (body.gold !== undefined) {
    if (!Number.isInteger(body.gold)) {
      throw createError(400, "Bad Request", "gold must be an integer.");
    }

    if (body.gold < 0) {
      throw createError(400, "Bad Request", "gold must be at least 0.");
    }

    updates.gold = body.gold;
  }

  if (Object.keys(updates).length === 0) {
    throw createError(
      400,
      "Bad Request",
      "Provide at least one updatable field: username, level, xp, or gold."
    );
  }

  return updates;
}

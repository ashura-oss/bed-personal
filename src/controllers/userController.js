// User controller functions handle user validation, loading, and CRUD.
import * as userModel from "../models/userModel.js";

// ------------------------------------------------------------
// RESOURCE LOADERS
// ------------------------------------------------------------

// Shared controller steps used before routes that need an existing user.
export async function loadUserFromUserIdParam(req, res, next) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "userId must be a positive integer id." });
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User was not found." });
    }

    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Load user from body for the next controller.
export async function loadUserFromBody(req, res, next) {
  try {
    const value = req.body?.userId;
    const userId = typeof value === "string" ? Number(value) : value;

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "userId must be a positive integer id." });
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User was not found." });
    }

    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return all users, optionally filtered by level.
export async function getUsers(req, res, next) {
  try {
    let level;

    if (req.query.level !== undefined) {
      if (Array.isArray(req.query.level)) {
        return res.status(400).json({ message: "level query must be provided once." });
      }

      level = Number(req.query.level);

      if (!Number.isInteger(level) || level < 1) {
        return res.status(400).json({ message: "level query must be a positive integer." });
      }
    }

    const userList = await userModel.findUsers({ level });

    res.locals.data = userList;
    next();
  } catch (error) {
    next(error);
  }
}

// Read one user by id.
export async function getUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User was not found." });
    }

    res.locals.data = user;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// CREATE AND ACTION CONTROLLERS
// ------------------------------------------------------------

// Create a user after validating the username.
export async function postUser(req, res, next) {
  try {
    if (typeof req.body.username !== "string" || req.body.username.trim().length === 0) {
      return res.status(400).json({ message: "username is required and must be a non-empty string." });
    }

    const username = req.body.username.trim();
    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      return res.status(409).json({ message: "Username is already taken." });
    }

    const user = await userModel.createUser({ username });

    res.locals.data = user;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Update one user row by id.
export async function putUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    const updates = buildUserUpdates(req.body, res);

    if (!updates) {
      return;
    }

    if (updates.username !== undefined) {
      const usernameOwner = await userModel.findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== userId) {
        return res.status(409).json({ message: "Username is already taken." });
      }
    }

    const updatedUser = await userModel.updateUserById(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ message: "User was not found." });
    }

    res.locals.data = updatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// REMOVE CONTROLLERS
// ------------------------------------------------------------

// Delete user.
export async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    const deletedUser = await userModel.deleteUserById(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User was not found." });
    }

    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// PRIVATE HELPERS
// ------------------------------------------------------------

// Build only the user fields that the request is allowed to update.
function buildUserUpdates(body, res) {
  const updates = {};

  if (body.username !== undefined) {
    if (typeof body.username !== "string" || body.username.trim().length === 0) {
      res.status(400).json({ message: "username must be a non-empty string when provided." });
      return null;
    }

    updates.username = body.username.trim();
  }

  if (body.level !== undefined) {
    if (!Number.isInteger(body.level)) {
      res.status(400).json({ message: "level must be an integer." });
      return null;
    }

    if (body.level < 1) {
      res.status(400).json({ message: "level must be at least 1." });
      return null;
    }

    updates.level = body.level;
  }

  if (body.xp !== undefined) {
    if (!Number.isInteger(body.xp)) {
      res.status(400).json({ message: "xp must be an integer." });
      return null;
    }

    if (body.xp < 0) {
      res.status(400).json({ message: "xp must be at least 0." });
      return null;
    }

    updates.xp = body.xp;
  }

  if (body.gold !== undefined) {
    if (!Number.isInteger(body.gold)) {
      res.status(400).json({ message: "gold must be an integer." });
      return null;
    }

    if (body.gold < 0) {
      res.status(400).json({ message: "gold must be at least 0." });
      return null;
    }

    updates.gold = body.gold;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: "Provide at least one updatable field: username, level, xp, or gold." });
    return null;
  }

  return updates;
}

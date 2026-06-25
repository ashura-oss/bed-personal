import * as userModel from "../models/userModel.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function getUsers(req, res, next) {
  try {
    let level;

    if (req.query.level !== undefined) {
      if (Array.isArray(req.query.level)) {
        throw createHttpError(400, "Bad Request", "level query must be provided once.");
      }

      level = Number(req.query.level);

      if (!Number.isInteger(level) || level < 1) {
        throw createHttpError(400, "Bad Request", "level query must be a positive integer.");
      }
    }

    const userList = await userModel.findUsers({ level });

    res.locals.data = userList;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getUserById(req, res, next) {
  try {
    res.locals.data = res.locals.user;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function postUser(req, res, next) {
  try {
    if (typeof req.body.username !== "string" || req.body.username.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "username is required and must be a non-empty string.");
    }

    const username = req.body.username.trim();
    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      throw createHttpError(409, "Conflict", "Username is already taken.");
    }

    const user = await userModel.createUser({ username });

    res.locals.data = user;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function putUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "id must be a positive integer id.");
    }

    const updates = buildUserUpdates(req.body);

    if (updates.username !== undefined) {
      const usernameOwner = await userModel.findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== userId) {
        throw createHttpError(409, "Conflict", "Username is already taken.");
      }
    }

    const updatedUser = await userModel.updateUserById(userId, updates);

    res.locals.data = updatedUser;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "id must be a positive integer id.");
    }

    const deletedUser = await userModel.deleteUserById(userId);

    if (!deletedUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

function buildUserUpdates(body) {
  const updates = {};

  if (body.username !== undefined) {
    if (typeof body.username !== "string" || body.username.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "username must be a non-empty string when provided.");
    }

    updates.username = body.username.trim();
  }

  if (body.level !== undefined) {
    if (!Number.isInteger(body.level)) {
      throw createHttpError(400, "Bad Request", "level must be an integer.");
    }

    if (body.level < 1) {
      throw createHttpError(400, "Bad Request", "level must be at least 1.");
    }

    updates.level = body.level;
  }

  if (body.xp !== undefined) {
    if (!Number.isInteger(body.xp)) {
      throw createHttpError(400, "Bad Request", "xp must be an integer.");
    }

    if (body.xp < 0) {
      throw createHttpError(400, "Bad Request", "xp must be at least 0.");
    }

    updates.xp = body.xp;
  }

  if (body.gold !== undefined) {
    if (!Number.isInteger(body.gold)) {
      throw createHttpError(400, "Bad Request", "gold must be an integer.");
    }

    if (body.gold < 0) {
      throw createHttpError(400, "Bad Request", "gold must be at least 0.");
    }

    updates.gold = body.gold;
  }

  if (Object.keys(updates).length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      "Provide at least one updatable field: username, level, xp, or gold."
    );
  }

  return updates;
}

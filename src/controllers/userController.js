import {
  createUser,
  deleteUserById,
  findUserById,
  findUserByUsername,
  findUsers,
  updateUserById
} from "../models/userModel.js";
import { createHttpError } from "../utils/httpError.js";
import { hashPassword } from "../utils/passwords.js";
import {
  getOptionalInteger,
  getOptionalPositiveIntegerQuery,
  getOptionalString,
  getRequiredIdParam,
  getRequiredString
} from "../utils/validate.js";

export async function getUsers(req, res, next) {
  try {
    const level = getOptionalPositiveIntegerQuery(req.query, "level");
    const userList = await findUsers({ level });

    res.locals.data = userList;
    next();
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "id");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.locals.data = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function postUser(req, res, next) {
  try {
    const username = getRequiredString(req.body, "username");
    const password = getRequiredString(req.body, "password");
    const existingUser = await findUserByUsername(username);

    if (existingUser) {
      throw createHttpError(409, "Conflict", "Username is already taken.");
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ username, password: hashedPassword });

    res.locals.data = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function putUserById(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "id");
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    const updates = buildUserUpdates(req.body);

    if (updates.username !== undefined) {
      const usernameOwner = await findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== userId) {
        throw createHttpError(409, "Conflict", "Username is already taken.");
      }
    }

    const updatedUser = await updateUserById(userId, updates);

    res.locals.data = updatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "id");
    const deletedUser = await deleteUserById(userId);

    if (!deletedUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.locals.status = 204;
    next();
  } catch (error) {
    next(error);
  }
}

function buildUserUpdates(body) {
  const updates = {};
  const username = getOptionalString(body, "username");
  const level = getOptionalInteger(body, "level", { min: 1 });
  const xp = getOptionalInteger(body, "xp", { min: 0 });
  const gold = getOptionalInteger(body, "gold", { min: 0 });

  if (username !== undefined) {
    updates.username = username;
  }

  if (level !== undefined) {
    updates.level = level;
  }

  if (xp !== undefined) {
    updates.xp = xp;
  }

  if (gold !== undefined) {
    updates.gold = gold;
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

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
  getRequiredString
} from "../utils/validate.js";

export async function getUsers(req, res, next) {
  try {
    const level = getOptionalPositiveIntegerQuery(req.query, "level");
    const userList = await findUsers({ level });

    res.status(200).json(userList);
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await findUserById(req.params.id);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.status(200).json(user);
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

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function putUserById(req, res, next) {
  try {
    const existingUser = await findUserById(req.params.id);

    if (!existingUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    const updates = buildUserUpdates(req.body);

    if (updates.username !== undefined) {
      const usernameOwner = await findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== req.params.id) {
        throw createHttpError(409, "Conflict", "Username is already taken.");
      }
    }

    const updatedUser = await updateUserById(req.params.id, updates);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const deletedUser = await deleteUserById(req.params.id);

    if (!deletedUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.status(204).send();
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

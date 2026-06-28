// User controller functions validate account rules, call user models, and pass data forward.
// Success status codes and messages are attached in the route middleware.
import * as userModel from "../models/userModel.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// USER LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all users, optionally filtered by level.
export async function getUsers(_req, res, next) {
  try {
    const userList = await userModel.findUsers({ level: res.locals.level });

    res.locals.data = userList;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one user by id.
export async function getUserById(_req, res, next) {
  try {
    const user = await findRequiredUser(res.locals.userId);

    res.locals.data = user;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// USER CREATION CONTROLLERS
// ------------------------------------------------------------

// Creates one user after checking username uniqueness.
export async function postUser(_req, res, next) {
  try {
    const { username, password } = res.locals;
    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      throw createHttpError(409, "Conflict", "Username is already taken.");
    }

    res.locals.data = await userModel.createUser({ username, password });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Logs in one user by checking username and password.
export async function postUserLogin(_req, res, next) {
  try {
    const { username, password } = res.locals;
    const userCredentials = await userModel.findUserCredentialsByUsername(username);

    if (!userCredentials || userCredentials.password !== password) {
      throw createHttpError(401, "Unauthorized", "Username or password is incorrect.");
    }

    res.locals.data = await userModel.findUserById(userCredentials.id);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// USER UPDATE CONTROLLERS
// ------------------------------------------------------------

// Updates one user after checking the target user and username ownership.
export async function putUserById(_req, res, next) {
  try {
    const { userId } = res.locals;

    await findRequiredUser(userId);

    const updates = buildUserUpdates(res.locals);

    if (updates.username !== undefined) {
      const usernameOwner = await userModel.findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== userId) {
        throw createHttpError(409, "Conflict", "Username is already taken.");
      }
    }

    res.locals.data = await userModel.updateUserById(userId, updates);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// USER DELETE CONTROLLERS
// ------------------------------------------------------------

// Deletes one user and lets the model clean up dependent rows.
export async function deleteUser(_req, res, next) {
  try {
    const deletedUser = await userModel.deleteUserById(res.locals.userId);

    if (!deletedUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Builds allowed user update fields from validated res.locals values.
function buildUserUpdates(locals) {
  const updates = {};

  if (locals.username !== undefined) {
    updates.username = locals.username;
  }

  if (locals.password !== undefined) {
    updates.password = locals.password;
  }

  if (locals.level !== undefined) {
    updates.level = locals.level;
  }

  if (locals.xp !== undefined) {
    updates.xp = locals.xp;
  }

  if (locals.gold !== undefined) {
    updates.gold = locals.gold;
  }

  return updates;
}

// Finds one user or raises a 404 controller error.
async function findRequiredUser(userId) {
  const user = await userModel.findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Not Found", "User was not found.");
  }

  return user;
}

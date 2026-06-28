// User controller functions validate requests, call user models, and send responses.
// User models store account-level progress such as level, XP, and gold.
import * as userModel from "../models/userModel.js";
import { hashPassword, validatePassword, verifyPassword } from "../utils/password.js";
import {
  createHttpError,
  getOptionalInteger,
  getOptionalPositiveIntegerQuery,
  getOptionalString,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// USER LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all users, optionally filtered by level.
export async function getUsers(req, res) {
  try {
    const level = getOptionalPositiveIntegerQuery(req.query, "level");
    const userList = await userModel.findUsers({ level });

    return res.status(200).json({
      message: "Users retrieved.",
      data: userList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one user by id.
export async function getUserById(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "id");
    const user = await findRequiredUser(userId);

    return res.status(200).json({
      message: "User retrieved.",
      data: user
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// USER CREATION CONTROLLERS
// ------------------------------------------------------------

// Creates one user.
export async function postUser(req, res) {
  try {
    const username = getRequiredString(req.body, "username");
    const password = getRequiredString(req.body, "password");
    const passwordError = validatePassword(password);

    if (passwordError) {
      throw createHttpError(400, "Bad Request", passwordError);
    }

    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      throw createHttpError(409, "Conflict", "Username is already taken.");
    }

    const user = await userModel.createUser({
      username,
      passwordHash: hashPassword(password)
    });

    return res.status(201).json({
      message: "User created.",
      data: user
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Logs in one user by checking username and password.
export async function postUserLogin(req, res) {
  try {
    const username = getRequiredString(req.body, "username");
    const password = getRequiredString(req.body, "password");
    const userCredentials = await userModel.findUserCredentialsByUsername(username);

    if (!userCredentials || !verifyPassword(password, userCredentials.passwordHash)) {
      throw createHttpError(401, "Unauthorized", "Username or password is incorrect.");
    }

    const user = await userModel.findUserById(userCredentials.id);

    return res.status(200).json({
      message: "Login successful.",
      data: user
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// USER UPDATE CONTROLLERS
// ------------------------------------------------------------

// Updates one user.
export async function putUserById(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "id");

    await findRequiredUser(userId);

    const updates = buildUserUpdates(req.body);

    if (updates.username !== undefined) {
      const usernameOwner = await userModel.findUserByUsername(updates.username);

      if (usernameOwner && usernameOwner.userId !== userId) {
        throw createHttpError(409, "Conflict", "Username is already taken.");
      }
    }

    const updatedUser = await userModel.updateUserById(userId, updates);

    return res.status(200).json({
      message: "User updated.",
      data: updatedUser
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// USER DELETE CONTROLLERS
// ------------------------------------------------------------

// Deletes one user.
export async function deleteUser(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "id");
    const deletedUser = await userModel.deleteUserById(userId);

    if (!deletedUser) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    return res.status(204).send();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Builds allowed user update fields.
// Only fields present in the request body are sent to the model update.
function buildUserUpdates(body) {
  const updates = {};
  const username = getOptionalString(body, "username");
  const password = getOptionalString(body, "password");
  const level = getOptionalInteger(body, "level", { min: 1 });
  const xp = getOptionalInteger(body, "xp", { min: 0 });
  const gold = getOptionalInteger(body, "gold", { min: 0 });

  if (username !== undefined) {
    updates.username = username;
  }

  if (password !== undefined) {
    const passwordError = validatePassword(password);

    if (passwordError) {
      throw createHttpError(400, "Bad Request", passwordError);
    }

    updates.passwordHash = hashPassword(password);
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
      "Provide at least one updatable field: username, password, level, xp, or gold."
    );
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

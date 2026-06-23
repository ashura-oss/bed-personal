import {
  createUser,
  findUserById,
  findUserByUsername,
  findUserCredentialsByUsername,
  updateUserPasswordById
} from "../models/userModel.js";
import { createHttpError } from "../utils/httpError.js";
import { getRequiredString } from "../utils/validate.js";
import { hashPassword, isBcryptHash, verifyPassword } from "../utils/passwords.js";
import { getTokenExpiry, signAuthToken } from "../utils/tokens.js";

export async function postRegister(req, res, next) {
  try {
    const username = getRequiredString(req.body, "username");
    const password = getRequiredString(req.body, "password");
    const existingUser = await findUserByUsername(username);

    if (existingUser) {
      throw createHttpError(409, "Conflict", "Username is already taken.");
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ username, password: hashedPassword });

    res.locals.data = buildAuthResponse(user);
    next();
  } catch (error) {
    next(error);
  }
}

export async function postLogin(req, res, next) {
  try {
    const username = getRequiredString(req.body, "username");
    const password = getRequiredString(req.body, "password");
    const userCredentials = await findUserCredentialsByUsername(username);

    if (!userCredentials) {
      throw invalidCredentialsError();
    }

    const isValidPassword = await checkAndMigratePassword(userCredentials, password);

    if (!isValidPassword) {
      throw invalidCredentialsError();
    }

    res.locals.data = buildAuthResponse(toPublicUser(userCredentials));
    next();
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await findUserById(req.auth.userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    res.locals.data = user;
    next();
  } catch (error) {
    next(error);
  }
}

async function checkAndMigratePassword(userCredentials, plainPassword) {
  if (isBcryptHash(userCredentials.password)) {
    return verifyPassword(plainPassword, userCredentials.password);
  }

  if (userCredentials.password !== plainPassword) {
    return false;
  }

  const hashedPassword = await hashPassword(plainPassword);
  await updateUserPasswordById(userCredentials.userId, hashedPassword);

  return true;
}

function buildAuthResponse(user) {
  return {
    user,
    token: signAuthToken(user),
    tokenType: "Bearer",
    expiresIn: getTokenExpiry()
  };
}

function toPublicUser(userCredentials) {
  const { password: _password, ...publicUser } = userCredentials;
  return publicUser;
}

function invalidCredentialsError() {
  return createHttpError(401, "Unauthorized", "Username or password is incorrect.");
}

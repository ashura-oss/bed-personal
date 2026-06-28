// User route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
import { Router } from "express";
import { getAdventureLogsByUserId } from "../controllers/adventureController.js";
import { getCharactersByUserId } from "../controllers/characterController.js";
import {
  deleteUser,
  getUserById,
  getUsers,
  postUser,
  postUserLogin,
  putUserById
} from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateAnyBody, validateBody, validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all users.
// Optional fields: level query
router.get(
  "/",
  validateQuery({ level: { type: "integer", min: 1 } }),
  getUsers,
  withMessage("Users retrieved."),
  sendResponse
);

// Get all characters owned by one user.
// Required fields: userId parameter
router.get(
  "/:userId/characters",
  validateParams({ userId: { type: "integer", min: 1 } }),
  getCharactersByUserId,
  withMessage("User characters retrieved."),
  sendResponse
);

// Get all adventure logs owned by one user.
// Required fields: userId parameter
router.get(
  "/:userId/adventure-logs",
  validateParams({ userId: { type: "integer", min: 1 } }),
  getAdventureLogsByUserId,
  withMessage("User adventure logs retrieved."),
  sendResponse
);

// Get one user by id.
// Required fields: id parameter
router.get(
  "/:id",
  validateParams({ id: { type: "integer", min: 1, localName: "userId" } }),
  getUserById,
  withMessage("User retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Login one user.
// Required fields: username, password
router.post(
  "/login",
  validateBody({
    username: { type: "string" },
    password: { type: "string", minLength: 6 }
  }),
  postUserLogin,
  withMessage("Login successful."),
  sendResponse
);

// Create one user.
// Required fields: username, password
router.post(
  "/",
  validateBody({
    username: { type: "string" },
    password: { type: "string", minLength: 6 }
  }),
  postUser,
  withMessage("User created.", 201),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Update one user by id.
// Required fields: id parameter, one update field
// Optional fields: username, password, level, xp, gold
router.put(
  "/:id",
  validateParams({ id: { type: "integer", min: 1, localName: "userId" } }),
  validateAnyBody({
    username: { type: "string" },
    password: { type: "string", minLength: 6 },
    level: { type: "integer", min: 1 },
    xp: { type: "integer", min: 0 },
    gold: { type: "integer", min: 0 }
  }),
  putUserById,
  withMessage("User updated."),
  sendResponse
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Delete one user by id.
// Required fields: id parameter
router.delete(
  "/:id",
  validateParams({ id: { type: "integer", min: 1, localName: "userId" } }),
  deleteUser,
  withMessage("User deleted.", 204),
  sendResponse
);

export default router;

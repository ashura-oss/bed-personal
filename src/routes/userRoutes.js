import { Router } from "express";
import {
  deleteUser,
  getUserById,
  getUsers,
  loadUserFromUserIdParam,
  postUser,
  putUserById
} from "../controllers/userController.js";
import { getCharactersByUserId } from "../controllers/characterController.js";
import { getAdventureLogsByUserId } from "../controllers/adventureController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List users, optionally filtered by level.
router.get(
  "/",
  getUsers,
  withMessage("Users retrieved."),
  sendResponse
);

// Create a new user.
router.post(
  "/",
  postUser,
  withMessage("User created.", 201),
  sendResponse
);

// List characters owned by one user.
router.get(
  "/:userId/characters",
  loadUserFromUserIdParam,
  getCharactersByUserId,
  withMessage("User characters retrieved."),
  sendResponse
);

// List adventure logs owned by one user.
router.get(
  "/:userId/adventure-logs",
  loadUserFromUserIdParam,
  getAdventureLogsByUserId,
  withMessage("User adventure logs retrieved."),
  sendResponse
);

// Read one user by id.
router.get(
  "/:id",
  getUserById,
  withMessage("User retrieved."),
  sendResponse
);

// Update one user by id.
router.put(
  "/:id",
  putUserById,
  withMessage("User updated."),
  sendResponse
);

// Delete one user by id.
router.delete(
  "/:id",
  deleteUser,
  withMessage("User deleted.", 204),
  sendResponse
);

export default router;

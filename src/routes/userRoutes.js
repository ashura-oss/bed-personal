// User route definitions.
// Route order: validate required params/body fields first, then let the controller handle user logic.
import { Router } from "express";
import { getAdventureLogsByUserId } from "../controllers/adventureController.js";
import { getCharactersByUserId } from "../controllers/characterController.js";
import { deleteUser, getUserById, getUsers, postUser, putUserById } from "../controllers/userController.js";
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all users.
// Required fields: none
// Optional fields: level query
router.get(
  "/",
  getUsers
);

// Get all characters owned by one user.
// Required fields: userId parameter
// Optional fields: none
router.get(
  "/:userId/characters",
  requireParamFields("userId"),
  getCharactersByUserId
);

// Get all adventure logs owned by one user.
// Required fields: userId parameter
// Optional fields: none
router.get(
  "/:userId/adventure-logs",
  requireParamFields("userId"),
  getAdventureLogsByUserId
);

// Get one user by id.
// Required fields: id parameter
// Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getUserById
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Create one user.
// Required fields: username
// Optional fields: none
router.post(
  "/",
  requireBodyFields("username"),
  postUser
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Update one user by id.
// Required fields: id parameter, one update field
// Optional fields: username, level, xp, gold
router.put(
  "/:id",
  requireParamFields("id"),
  requireAnyBodyField("username", "level", "xp", "gold"),
  putUserById
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Delete one user by id.
// Required fields: id parameter
// Optional fields: none
router.delete(
  "/:id",
  requireParamFields("id"),
  deleteUser
);

export default router;

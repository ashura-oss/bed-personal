// User route definitions.
import { Router } from "express";
import { getCharactersByUserId } from "../controllers/characterController.js";
import { getAdventureLogsByUserId } from "../controllers/adventureController.js";
import { deleteUser, getUserById, getUsers, loadUserFromUserIdParam, postUser, putUserById } from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all users.
//Required fields: none
//Optional fields: level query
router.get(
  "/",
  getUsers,
  withMessage("Users retrieved."),
  sendResponse
);

//Get all characters owned by one user.
//Required fields: userId parameter
//Optional fields: none
router.get(
  "/:userId/characters",
  requireParamFields("userId"),
  loadUserFromUserIdParam,
  getCharactersByUserId,
  withMessage("User characters retrieved."),
  sendResponse
);

//Get all adventure logs owned by one user.
//Required fields: userId parameter
//Optional fields: none
router.get(
  "/:userId/adventure-logs",
  requireParamFields("userId"),
  loadUserFromUserIdParam,
  getAdventureLogsByUserId,
  withMessage("User adventure logs retrieved."),
  sendResponse
);

//Get one user by id.
//Required fields: id parameter
//Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getUserById,
  withMessage((locals) => `User ${locals.data.username} retrieved.`),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Create one user.
//Required fields: username
//Optional fields: none
router.post(
  "/",
  requireBodyFields("username"),
  postUser,
  withMessage((locals) => `User ${locals.data.username} created.`, 201),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

//Update one user by id.
//Required fields: id parameter, one update field
//Optional fields: username, level, xp, gold
router.put(
  "/:id",
  requireParamFields("id"),
  requireAnyBodyField("username", "level", "xp", "gold"),
  putUserById,
  withMessage((locals) => `User ${locals.data.username} updated.`),
  sendResponse
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

//Delete one user by id.
//Required fields: id parameter
//Optional fields: none
router.delete(
  "/:id",
  requireParamFields("id"),
  deleteUser,
  withMessage("User deleted.", 204),
  sendResponse
);

export default router;

import { Router } from "express";
import {
  deleteUser,
  getUserById,
  getUsers,
  postUser,
  putUserById
} from "../controllers/userController.js";
import { getAdventureLogsByUserId } from "../controllers/adventureController.js";
import { getCharactersByUserId } from "../controllers/characterController.js";
import { authenticateToken, requireSelfParam } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getUsers, withMessage("Users retrieved."), sendResponse);
router.post("/", postUser, withMessage("User created.", 201), sendResponse);
router.get(
  "/:userId/characters",
  authenticateToken,
  requireSelfParam("userId"),
  getCharactersByUserId,
  withMessage("User characters retrieved."),
  sendResponse
);
router.get(
  "/:userId/adventure-logs",
  authenticateToken,
  requireSelfParam("userId"),
  getAdventureLogsByUserId,
  withMessage("User adventure logs retrieved."),
  sendResponse
);
router.get("/:id", authenticateToken, requireSelfParam("id"), getUserById, withMessage("User retrieved."), sendResponse);
router.put("/:id", authenticateToken, requireSelfParam("id"), putUserById, withMessage("User updated."), sendResponse);
router.delete("/:id", authenticateToken, requireSelfParam("id"), deleteUser, withMessage("User deleted."), sendResponse);

export default router;

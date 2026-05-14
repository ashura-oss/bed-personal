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

const router = Router();

router.get("/", getUsers);
router.post("/", postUser);
router.get("/:userId/characters", authenticateToken, requireSelfParam("userId"), getCharactersByUserId);
router.get(
  "/:userId/adventure-logs",
  authenticateToken,
  requireSelfParam("userId"),
  getAdventureLogsByUserId
);
router.get("/:id", authenticateToken, requireSelfParam("id"), getUserById);
router.put("/:id", authenticateToken, requireSelfParam("id"), putUserById);
router.delete("/:id", authenticateToken, requireSelfParam("id"), deleteUser);

export default router;

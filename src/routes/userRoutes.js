import { Router } from "express";
import { deleteUser, getUserById, getUsers, postUser, putUserById } from "../controllers/userController.js";
import { getCharactersByUserId } from "../controllers/characterController.js";
import { getAdventureLogsByUserId } from "../controllers/adventureController.js";
import { loadUserFromIdParam, loadUserFromUserIdParam } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getUsers, withMessage("Users retrieved."), sendResponse);

router.post("/", postUser, withMessage("User created.", 201), sendResponse);

router.get("/:userId/characters", loadUserFromUserIdParam, getCharactersByUserId, withMessage("User characters retrieved."), sendResponse);

router.get("/:userId/adventure-logs", loadUserFromUserIdParam, getAdventureLogsByUserId, withMessage("User adventure logs retrieved."), sendResponse);

router.get("/:id", loadUserFromIdParam, getUserById, withMessage("User retrieved."), sendResponse);

router.put("/:id", loadUserFromIdParam, putUserById, withMessage("User updated."), sendResponse);

router.delete("/:id", loadUserFromIdParam, deleteUser, withMessage("User deleted.", 204), sendResponse);

export default router;

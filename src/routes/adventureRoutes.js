import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { loadCharacterFromBody, loadQuestFromBody, loadUserFromBody } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.post("/attempt", loadUserFromBody, loadCharacterFromBody, loadQuestFromBody, postAdventureAttempt, withMessage("Adventure attempt resolved."), sendResponse);

export default router;

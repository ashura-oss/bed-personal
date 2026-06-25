import { Router } from "express";
import { getCombatSession, postCombatSession, postCombatTurn } from "../controllers/combatController.js";
import { loadCharacterFromBody } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.post("/sessions", loadCharacterFromBody, postCombatSession, withMessage("Combat session started.", 201), sendResponse);

router.get("/sessions/:combatSessionId", getCombatSession, withMessage("Combat session retrieved."), sendResponse);

router.post("/sessions/:combatSessionId/turns", loadCharacterFromBody, postCombatTurn, withMessage("Combat turn resolved."), sendResponse);

export default router;

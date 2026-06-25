import { Router } from "express";
import { getArmyEncounterById, getArmyEncounters } from "../controllers/armyEncounterController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getArmyEncounters, withMessage("Army encounters retrieved."), sendResponse);

router.get("/:armyEncounterId", getArmyEncounterById, withMessage("Army encounter retrieved."), sendResponse);

export default router;

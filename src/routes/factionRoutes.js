import { Router } from "express";
import { getFactionById, getFactions } from "../controllers/factionController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getFactions, withMessage("Factions retrieved."), sendResponse);

router.get("/:factionId", getFactionById, withMessage("Faction retrieved."), sendResponse);

export default router;

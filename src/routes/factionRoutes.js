// Faction route definitions.
import { Router } from "express";
import { getFactionById, getFactions } from "../controllers/factionController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all faction definitions.
//Required fields: none
//Optional fields: none
router.get(
  "/",
  getFactions,
  withMessage("Factions retrieved."),
  sendResponse
);

//Get one faction definition.
//Required fields: factionId parameter
//Optional fields: none
router.get(
  "/:factionId",
  requireParamFields("factionId"),
  getFactionById,
  withMessage("Faction retrieved."),
  sendResponse
);

export default router;

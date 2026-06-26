// Quest route definitions.
import { Router } from "express";
import { getQuestById, getQuests } from "../controllers/questController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all quest definitions.
//Required fields: none
//Optional fields: none
router.get(
  "/",
  getQuests,
  withMessage("Quests retrieved."),
  sendResponse
);

//Get one quest definition.
//Required fields: id parameter
//Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getQuestById,
  withMessage("Quest retrieved."),
  sendResponse
);

export default router;

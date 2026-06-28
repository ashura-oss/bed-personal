// Quest route definitions.
// Quest data is fixed game content, so these routes only validate lookup fields.
import { Router } from "express";
import { getQuestById, getQuests } from "../controllers/questController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateParams } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all quest definitions.
// Required fields: none
router.get(
  "/",
  getQuests,
  withMessage("Quests retrieved."),
  sendResponse
);

// Get one quest definition.
// Required fields: id parameter
router.get(
  "/:id",
  validateParams({ id: { type: "string" } }),
  getQuestById,
  withMessage("Quest retrieved."),
  sendResponse
);

export default router;

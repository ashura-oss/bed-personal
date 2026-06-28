// Quest route definitions.
// Route order: validate required params when needed, then let the controller return fixed quest data.
import { Router } from "express";
import { getQuestById, getQuests } from "../controllers/questController.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all quest definitions.
// Required fields: none
// Optional fields: none
router.get(
  "/",
  getQuests
);

// Get one quest definition.
// Required fields: id parameter
// Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getQuestById
);

export default router;

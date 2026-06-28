// Item route definitions.
// Route order: optional query input goes straight to the controller for filtering fixed item data.
import { Router } from "express";
import { getItemById, getItems } from "../controllers/itemController.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all item definitions.
// Required fields: none
// Optional fields: itemType query, equipmentSlot query
router.get(
  "/",
  getItems
);

// Get one item definition.
// Required fields: itemId parameter
// Optional fields: none
router.get(
  "/:itemId",
  requireParamFields("itemId"),
  getItemById
);

export default router;

// Item route definitions.
// Route order: validate filters, run controller logic, attach success response, then send.
import { Router } from "express";
import { getItemById, getItems } from "../controllers/itemController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all item definitions.
// Optional fields: itemType query, equipmentSlot query
router.get(
  "/",
  validateQuery({
    itemType: { type: "string" },
    equipmentSlot: { type: "string" }
  }),
  getItems,
  withMessage("Items retrieved."),
  sendResponse
);

// Get one item definition.
// Required fields: itemId parameter
router.get(
  "/:itemId",
  validateParams({ itemId: { type: "string" } }),
  getItemById,
  withMessage("Item retrieved."),
  sendResponse
);

export default router;

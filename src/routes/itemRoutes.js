// Item route definitions.
import { Router } from "express";
import { getItemById, getItems } from "../controllers/itemController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all item definitions.
//Required fields: none
//Optional fields: itemType query, equipmentSlot query
router.get(
  "/",
  getItems,
  withMessage("Items retrieved."),
  sendResponse
);

//Get one item definition.
//Required fields: itemId parameter
//Optional fields: none
router.get(
  "/:itemId",
  requireParamFields("itemId"),
  getItemById,
  withMessage("Item retrieved."),
  sendResponse
);

export default router;

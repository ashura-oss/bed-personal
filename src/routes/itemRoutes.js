// Item route definitions.
import { Router } from "express";
import { getItemById, getItems } from "../controllers/itemController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all item definitions.
router.get(
  "/",
  getItems,
  withMessage("Items retrieved."),
  sendResponse
);

// Read one item definition.
router.get(
  "/:itemId",
  getItemById,
  withMessage("Item retrieved."),
  sendResponse
);

export default router;

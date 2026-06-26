import { Router } from "express";
import { getItemById, getItems } from "../controllers/itemController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

router.get("/", getItems, withMessage("Items retrieved."), sendResponse);

router.get("/:itemId", getItemById, withMessage("Item retrieved."), sendResponse);

export default router;

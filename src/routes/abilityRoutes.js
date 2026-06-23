import { Router } from "express";
import { getAbilities } from "../controllers/abilityController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getAbilities, withMessage("Abilities retrieved."), sendResponse);

export default router;

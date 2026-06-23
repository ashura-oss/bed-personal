import { Router } from "express";
import { getCurrentUser, postLogin, postRegister } from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.post("/register", postRegister, withMessage("Registration complete.", 201), sendResponse);
router.post("/login", postLogin, withMessage("Login complete."), sendResponse);
router.get("/me", authenticateToken, getCurrentUser, withMessage("Current user retrieved."), sendResponse);

export default router;

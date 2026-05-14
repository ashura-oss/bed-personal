import { Router } from "express";
import { getCurrentUser, postLogin, postRegister } from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", postRegister);
router.post("/login", postLogin);
router.get("/me", authenticateToken, getCurrentUser);

export default router;

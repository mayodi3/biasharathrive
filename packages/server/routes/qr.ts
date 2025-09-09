import { Router } from "express";
import { generateCode } from "../controllers/qr";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/generate", authenticate, generateCode);

export default router;

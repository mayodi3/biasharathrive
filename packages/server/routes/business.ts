import { Router } from "express";
import { onboardBusiness } from "../controllers/business";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/onboard", authenticate, onboardBusiness);

export default router;

import { Router } from "express";
import { getSales, makeASale } from "../controllers/sale";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/", authenticate, makeASale);
router.get("/", authenticate, getSales);

export default router;

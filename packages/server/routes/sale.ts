import { Router } from "express";
import { makeASale } from "../controllers/sale";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.post("/", makeASale);

export default router;

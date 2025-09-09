import { Router } from "express";
import { exportData } from "../controllers/export";

const router = Router();

router.post("/", exportData);

export default router;

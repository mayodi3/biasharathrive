import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { addBranch, getBusinessBranches } from "../controllers/branch";

const router = Router();

router.get("/", authenticate, getBusinessBranches);
router.post("/add", authenticate, addBranch);

export default router;

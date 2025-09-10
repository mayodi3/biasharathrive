import { Router } from "express";
import { addExpense, getExpenses } from "../controllers/expense";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.post("/", addExpense);
router.get("/list", getExpenses);

export default router;

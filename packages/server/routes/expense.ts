import { Router } from "express";
import { addExpense, getExpenses } from "../controllers/expense";

const router = Router();

router.post("/", addExpense);
router.post("/list", getExpenses);

export default router;

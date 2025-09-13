import { Router } from "express";
import {
  addExpense,
  deleteExpense,
  getExpenses,
  getExpensesForBusiness,
  updateExpense,
} from "../controllers/expense";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.post("/", addExpense);
router.get("/list", getExpensesForBusiness);
router.get("/", getExpenses);
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;

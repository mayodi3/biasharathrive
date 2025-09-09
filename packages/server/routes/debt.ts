import { Router } from "express";
import {
  addDebt,
  getDebts,
  updateDebtPayment,
  deleteDebt,
  getCustomerOrders,
} from "../controllers/debt";

const router = Router();

router.post("/", addDebt);
router.post("/list", getDebts);
router.put("/payment", updateDebtPayment);
router.get("/customer", getCustomerOrders);
router.delete("/", deleteDebt);

export default router;

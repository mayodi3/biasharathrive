import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order";

const router = Router();

router.post("/", createOrder);
router.post("/list", getOrders);
router.put("/status", updateOrderStatus);
router.delete("/", deleteOrder);

export default router;

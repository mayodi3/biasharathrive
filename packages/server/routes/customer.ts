import { Router } from "express";
import {
  getCustomers,
  addCustomer,
  deleteCustomer,
} from "../controllers/customer";

const router = Router();

router.get("/", getCustomers);
router.post("/", addCustomer);
router.delete("/:customerId", deleteCustomer);

export default router;

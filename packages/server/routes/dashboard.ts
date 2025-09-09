import { Router } from "express";
import {
  getOwnerDashboardData,
  getEmployeeDashboardData,
} from "../controllers/dashboard";

const router = Router();

router.get("/owner", getOwnerDashboardData);
router.get("/employee", getEmployeeDashboardData);

export default router;

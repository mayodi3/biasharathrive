import { Router } from "express";
import {
  approveRefundHandler,
  getSales,
  makeASale,
  rejectRefundHandler,
  requestRefund,
} from "../controllers/sale";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.post("/", makeASale);
router.post("/get", getSales);
router.post("/refund/request", requestRefund);
router.post("/refund/approove", approveRefundHandler);
router.post("/refund/reject", rejectRefundHandler);

export default router;

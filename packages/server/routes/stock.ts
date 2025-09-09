import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import {
  addStock,
  deleteStock,
  getBranchStockItems,
  getBusinessStockItems,
  getStockItemsWithQrCodes,
  updateStock,
} from "../controllers/stock";
import upload from "../middlewares/multer";

const router = Router();

router.use(authenticate);

router.get("/business", getBusinessStockItems);
router.post("/branch", getBranchStockItems);
router.post("/add", upload.single("image"), addStock);
router.patch("/update", upload.single("image"), updateStock);
router.delete("/delete/:stockId", deleteStock);
router.post("/codes", getStockItemsWithQrCodes);

export default router;

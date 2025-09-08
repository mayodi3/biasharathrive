import { Router } from "express";
import { addEmployee } from "../controllers/employee";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/multer";

const router = Router();

router.post(
  "/add",
  authenticate,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idImageFront", maxCount: 1 },
    { name: "idImageBack", maxCount: 1 },
  ]),
  addEmployee
);

export default router;

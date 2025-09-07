import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  logoutAll,
  me,
  sessions,
  revokeSession,
  onboardBusiness,
  getBusinessBranches,
  addBranch,
  addEmployee,
} from "../controllers/auth";

import multer from "multer";
import { authenticate } from "../middlewares/auth";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idImageFront", maxCount: 1 },
    { name: "idImageBack", maxCount: 1 },
  ]),
  register
);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/sessions", authenticate, sessions);
router.post("/revoke/:id", authenticate, revokeSession);
router.get("/me", authenticate, me);
router.post("/onboarding", authenticate, onboardBusiness);
router.get("/branches", authenticate, getBusinessBranches);
router.post("/branches/add", authenticate, addBranch);
router.post(
  "/employees/add",
  authenticate,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "idImageFront", maxCount: 1 },
    { name: "idImageBack", maxCount: 1 },
  ]),
  addEmployee
);

export default router;

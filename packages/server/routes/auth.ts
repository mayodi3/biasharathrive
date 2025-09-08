import { Router } from "express";
import {
  login,
  logout,
  logoutAll,
  me,
  refreshToken,
  register,
  revokeSession,
  sessions,
} from "../controllers/auth";
import { authenticate } from "../middlewares/auth";
import upload from "../middlewares/multer";

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

export default router;

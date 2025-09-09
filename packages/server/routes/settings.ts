import { Router } from "express";
import { updateProfileSettings, updatePassword } from "../controllers/settings";

const router = Router();

router.put("/profile", updateProfileSettings);
router.put("/password", updatePassword);

export default router;

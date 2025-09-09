import { type Request, type Response } from "express";
import {
  updateProfileSettingsService,
  updatePasswordService,
} from "../services/settings";

export const updateProfileSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { userName, businessName } = req.body;

    const result = await updateProfileSettingsService(
      userId,
      userName,
      businessName
    );

    res.json(result);
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const result = await updatePasswordService(
      userId,
      oldPassword,
      newPassword,
      confirmPassword
    );

    res.json(result);
  } catch (error: any) {
    console.error("Failed to update password:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
};

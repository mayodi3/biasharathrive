import { type Request, type Response } from "express";
import {
  getOwnerDashboardDataService,
  getEmployeeDashboardDataService,
} from "../services/dashboard";

export const getOwnerDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = await getOwnerDashboardDataService(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = await getEmployeeDashboardDataService(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

import { type Request, type Response } from "express";
import {
  getCustomersService,
  addCustomerService,
  deleteCustomerService,
} from "../services/customer";

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // injected from auth middleware
    const customers = await getCustomersService(userId);
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await addCustomerService(userId, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { customerId } = req.params;
    const result = await deleteCustomerService(userId, customerId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

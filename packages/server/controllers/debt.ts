import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const addDebt = async (req: Request, res: Response) => {
  const {
    debtorName,
    debtAmount,
    dueDate,
    debtorPhone,
    description,
    branchId,
  } = req.body;
  const userId = (req as any).userId;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid business" });
    }

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, businessId: business.id },
      });
      if (!branch) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid branch" });
      }
    }

    const debt = await prisma.debt.create({
      data: {
        debtorName,
        amount: Number(debtAmount),
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        debtorPhone: debtorPhone || null,
        description: description || "",
        debtStatus: "pending",
        branchId: branchId || null,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Debt added successfully", debt });
  } catch (error) {
    console.error("Failed to add debt:", error);
    res.status(500).json({ success: false, message: "Failed to add debt" });
  }
};

export const getDebts = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  const userId = (req as any).userId;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid business" });
    }

    const debts = await prisma.debt.findMany({
      where: {
        branch: {
          businessId: business.id,
          ...(branchId && { id: branchId }),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: branchId ? "Branch debts retrieved" : "Business debts retrieved",
      debts,
    });
  } catch (error) {
    console.error("Failed to fetch debts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch debts" });
  }
};

export const updateDebtPayment = async (req: Request, res: Response) => {
  const { debtId, paymentAmount } = req.body;

  try {
    const debt = await prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt) {
      return res
        .status(404)
        .json({ success: false, message: "Debt not found" });
    }

    if (debt.debtStatus === "pending") {
      const newAmountPaid = debt.amountPaid + Number(paymentAmount);
      const newStatus = newAmountPaid >= debt.amount ? "paid" : "pending";
      const balance = debt.amount - paymentAmount;

      const updatedDebt = await prisma.debt.update({
        where: { id: debtId },
        data: {
          amountPaid: newAmountPaid,
          debtStatus: newStatus,
          balance,
        },
      });

      res.status(200).json({
        success: true,
        message: "Payment recorded",
        debt: updatedDebt,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Debt payment completed",
      });
    }
  } catch (error) {
    console.error("Failed to update debt:", error);
    res.status(500).json({ success: false, message: "Failed to update debt" });
  }
};

export const deleteDebt = async (req: Request, res: Response) => {
  const { debtId } = req.body;

  try {
    await prisma.debt.delete({ where: { id: debtId } });
    res
      .status(200)
      .json({ success: true, message: "Debt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete debt:", error);
    res.status(500).json({ success: false, message: "Failed to delete debt" });
  }
};

export const getCustomerOrders = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      include: { orderItems: { include: { stock: true } }, sale: true },
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

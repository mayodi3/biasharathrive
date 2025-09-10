import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const addExpense = async (req: Request, res: Response) => {
  const { description, amount, expenseType, branchId } = req.body;
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

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: Number(amount),
        expenseType,
        branchId: branchId || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add expense" });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { branchId, from, to } = req.params;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (!business) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid business" });
    }

    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    } else {
      where.branch = {
        businessId: business.id,
      };
    }

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { branch: true },
    });

    return res.status(200).json({
      success: true,
      message: branchId
        ? "Branch expenses retrieved successfully"
        : "Business expenses retrieved successfully",
      expenses,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to get expenses" });
  }
};

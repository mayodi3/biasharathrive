import { type Request, type Response } from "express";
import {
  deleteExpenseById,
  findExpenseById,
  getExpensesFromDB,
  recordAnExpense,
  updateExpenseById,
} from "../db/expense";
import {
  getBranchById,
  getBusinessesOwnedByUser,
  getBusinsessById,
} from "../db/shared";

export const addExpense = async (req: Request, res: Response) => {
  const { description, amount, expenseType, branchId } = req.body;

  try {
    if (branchId) {
      const branch = await getBranchById(branchId);

      if (!branch) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid branch" });
      }
    }

    const expenseData = {
      description,
      amount: Number(amount),
      expenseType,
      branchId: branchId || null,
    };

    const expense = await recordAnExpense(expenseData);

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

export const getExpensesForBusiness = async (req: Request, res: Response) => {
  const { businessId, branchId, from, to } = req.params;

  try {
    let business: any;
    if (businessId) {
      business = await getBusinsessById(businessId);

      if (!business) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid business" });
      }
    }

    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    } else if (businessId) {
      where.branch = {
        businessId,
      };
    }

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const expenses = await getExpensesFromDB(where);

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

export const getExpenses = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { from, to } = req.query;

  try {
    const businesses = await getBusinessesOwnedByUser(userId);

    if (!businesses || businesses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No businesses found for this user" });
    }

    const branchIds = businesses.flatMap(
      (b: any) => b.branches?.map((branch: any) => branch.id) || []
    );

    if (branchIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No branches found for user’s businesses",
        expenses: [],
      });
    }

    const where: any = {
      branchId: { in: branchIds },
    };

    if (from && to) {
      where.createdAt = {
        gte: new Date(from as string),
        lte: new Date(to as string),
      };
    }

    const expenses = await getExpensesFromDB(where);

    return res.status(200).json({
      success: true,
      message: "All expenses retrieved successfully",
      expenses,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to get expenses" });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { id: expenseId } = req.params;

  try {
    const expense = await findExpenseById(expenseId!);

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    await deleteExpenseById(expenseId!);

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete expense" });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const { id: expenseId } = req.params;
  const { description, amount, expenseType, branchId } = req.body;

  try {
    const expense = await findExpenseById(expenseId!);

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    if (branchId) {
      const branch = await getBranchById(branchId);
      if (!branch) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid branch" });
      }
    }

    const updateExpenseData = {
      description: description ?? expense.description,
      amount: amount !== undefined ? Number(amount) : expense.amount,
      expenseType: expenseType ?? expense.expenseType,
      branchId: branchId ?? expense.branchId,
    };

    const updatedExpense = await updateExpenseById(
      expenseId!,
      updateExpenseData
    );

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update expense" });
  }
};

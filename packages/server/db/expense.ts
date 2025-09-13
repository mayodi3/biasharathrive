import prismaClient from "../config/prisma";

export const getExpensesFromDB = async (where: any = {}) =>
  await prismaClient.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { branch: true },
  });

export const recordAnExpense = async (expenseData: any = {}) =>
  await prismaClient.expense.create({
    data: expenseData,
  });

export const findExpenseById = async (expenseId: string) =>
  await prismaClient.expense.findUnique({
    where: { id: expenseId },
  });

export const deleteExpenseById = async (expenseId: string) =>
  prismaClient.expense.delete({
    where: { id: expenseId },
  });

export const updateExpenseById = async (
  expenseId: string,
  updateExpenseData: any = {}
) =>
  prismaClient.expense.update({
    where: { id: expenseId },
    data: updateExpenseData,
  });

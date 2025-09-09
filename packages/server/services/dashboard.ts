import prisma from "../config/prisma";
import { subDays, startOfDay, format, startOfMonth } from "date-fns";

export async function getOwnerDashboardDataService(userId: string) {
  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found for user.");

    const todayStart = startOfDay(new Date());
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

    // --- Fetch data in parallel ---
    const [salesToday, salesLast7Days, expensesLast7Days, allDebts, allStock] =
      await Promise.all([
        prisma.saleItem.findMany({
          where: {
            sale: {
              stock: { branch: { businessId: business.id } },
              createdAt: { gte: todayStart },
            },
          },
          include: { sale: true, stock: true },
        }),
        prisma.saleItem.findMany({
          where: {
            sale: {
              stock: { branch: { businessId: business.id } },
              createdAt: { gte: sevenDaysAgo },
            },
          },
          include: { sale: true, stock: true },
        }),
        prisma.expense.findMany({
          where: {
            businessId: business.id,
            expenseDate: { gte: sevenDaysAgo },
          },
        }),
        prisma.debt.findMany({
          where: { businessId: business.id },
        }),
        prisma.stock.findMany({
          where: { branch: { businessId: business.id } },
        }),
      ]);

    // --- KPIs ---
    const totalSalesToday = salesToday.reduce(
      (sum, s) => sum + s.price * s.quantity,
      0
    );
    const totalSalesLast7Days = salesLast7Days.reduce(
      (sum, s) => sum + s.price * s.quantity,
      0
    );
    const totalExpensesLast7Days = expensesLast7Days.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const outstandingDebt = allDebts
      .filter((d) => d.status === "PENDING")
      .reduce((sum, d) => sum + (d.debtAmount - d.amountPaid), 0);
    const lowStockCount = allStock.filter((item) => item.quantity < 10).length;

    // --- Chart Data ---
    const salesChartData = Array.from({ length: 7 })
      .map((_, i) => {
        const date = subDays(new Date(), i);
        return {
          date: format(date, "MMM d"),
          Sales: 0,
        };
      })
      .reverse();

    salesLast7Days.forEach((s) => {
      const dateKey = format(new Date(s.sale.createdAt), "MMM d");
      const entry = salesChartData.find((d) => d.date === dateKey);
      if (entry) {
        entry.Sales += s.price * s.quantity;
      }
    });

    const expenseCategories = expensesLast7Days.reduce((acc, e) => {
      const category = e.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const expenseChartData = Object.entries(expenseCategories).map(
      ([name, value]) => ({ name, value })
    );

    // --- Recent ---
    const recentSales = salesLast7Days.slice(0, 5);
    const recentExpenses = expensesLast7Days.slice(0, 5);

    return {
      kpis: {
        totalSalesToday,
        totalSalesLast7Days,
        totalExpensesLast7Days,
        outstandingDebt,
        lowStockCount,
      },
      charts: {
        salesChartData,
        expenseChartData,
      },
      recentActivities: {
        sales: recentSales,
        expenses: recentExpenses,
      },
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      kpis: {
        totalSalesToday: 0,
        totalSalesLast7Days: 0,
        totalExpensesLast7Days: 0,
        outstandingDebt: 0,
        lowStockCount: 0,
      },
      charts: { salesChartData: [], expenseChartData: [] },
      recentActivities: { sales: [], expenses: [] },
    };
  }
}

export async function getEmployeeDashboardDataService(userId: string) {
  try {
    const employee = await prisma.user.findUnique({ where: { id: userId } });
    if (!employee) throw new Error("Employee not found.");

    const todayStart = startOfDay(new Date());
    const monthStart = startOfMonth(new Date());

    const allSales = await prisma.saleItem.findMany({
      where: {
        sale: { userId },
      },
      include: { sale: true },
      orderBy: { sale: { createdAt: "desc" } },
    });

    const salesToday = allSales
      .filter((s) => new Date(s.sale.createdAt) >= todayStart)
      .reduce((sum, s) => sum + s.price * s.quantity, 0);

    const salesThisMonth = allSales
      .filter((s) => new Date(s.sale.createdAt) >= monthStart)
      .reduce((sum, s) => sum + s.price * s.quantity, 0);

    const recentSales = allSales.slice(0, 10);

    return {
      kpis: {
        salesToday,
        salesThisMonth,
      },
      recentSales,
    };
  } catch (error) {
    console.error("Failed to fetch employee dashboard data:", error);
    return {
      kpis: { salesToday: 0, salesThisMonth: 0 },
      recentSales: [],
    };
  }
}

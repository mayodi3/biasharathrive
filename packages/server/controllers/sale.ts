import type { Request, RequestHandler, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { findStockById, recordPaymentAfterSale, recordSale } from "../db/sale";
import { getSellingPriceByStock } from "../utils/utils";

const prisma = new PrismaClient();

export const makeASale = async (req: Request, res: Response) => {
  const { stockId, quantity, saleType, paymentMethod } = req.body;
  const userId = (req as any).userId;

  try {
    const stock = await findStockById(stockId);
    if (!stock || stock.quantity < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock" });
    }

    const sale = await recordSale(stock.id, quantity, saleType, userId);

    const sellingPrice = getSellingPriceByStock(saleType, stock);

    await recordPaymentAfterSale(sellingPrice, quantity, paymentMethod, sale);

    res
      .status(200)
      .json({ success: true, message: "Sale recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Sale failed to record. Please try again",
    });
  }
};

export const getSales: RequestHandler = async (req, res) => {
  const { branchId, dateRange } = (req.body ?? {}) as {
    branchId?: string;
    dateRange?: { from?: string; to?: string };
  };
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

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or access denied",
      });
    }

    const where: any = {
      stock: {
        branch: {
          businessId: business.id,
          ...(branchId && { id: branchId }),
        },
      },
    };

    if (dateRange?.from && dateRange?.to) {
      where.createdAt = {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      };
    }

    const sales = await prisma.saleItem.findMany({
      where,
      include: {
        stock: { include: { branch: true } },
        sale: { include: { soldBy: true, payment: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: branchId
        ? "Branch sales retrieved successfully"
        : "Business sales retrieved successfully",
      sales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get sales" });
  }
};

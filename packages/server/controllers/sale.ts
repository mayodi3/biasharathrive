import type { Request, RequestHandler, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const makeASale = async (req: Request, res: Response) => {
  const { stockId, quantity, saleType, paymentMethod } = req.body;
  const userId = (req as any).userId;

  try {
    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock || stock.quantity < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock" });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          saleType: saleType || "retail",
          userId: userId,
        },
      });

      const sellingPrice =
        saleType === "retail" ? stock.sellingPrice : stock.wholesalePrice!;

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          stockId,
          quantity,
          price: sellingPrice,
        },
      });

      await tx.stock.update({
        where: { id: stockId },
        data: { quantity: { decrement: quantity } },
      });

      return sale;
    });

    await prisma.payment.create({
      data: {
        amount: quantity * stock.sellingPrice,
        paymentMethod: paymentMethod || "cash",
        status: "paid",
        saleId: sale.id,
      },
    });

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
  const { branchId, dateRange } = req.body;
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

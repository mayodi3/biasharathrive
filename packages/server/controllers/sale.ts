import type { Request, RequestHandler, Response } from "express";
import {
  approveRefund,
  createRefundRequest,
  getSaleItems,
  recordPaymentAfterSale,
  recordSale,
  rejectRefund,
} from "../db/sale";
import { getBranchById, getBusinsessById } from "../db/shared";
import { getSellingPriceByStock } from "../utils/utils";
import { findStockById } from "../db/stock";

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

export const getSales = async (req: Request, res: Response) => {
  const { branchId, dateRange, businessId } = (req.body ?? {}) as {
    branchId?: string;
    dateRange?: { from?: string; to?: string };
    businessId?: string;
  };
  const userId = (req as any).userId;

  try {
    let business: any;
    let where: any = {};

    if (businessId) {
      business = getBusinsessById(businessId);

      if (!business) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid business" });
      }

      where = {
        stock: {
          branch: {
            businessId: business.id,
          },
        },
      };
    } else if (branchId) {
      const branch = await getBranchById(branchId);

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: "Branch not found or access denied",
        });
      }

      where = {
        stock: {
          branch: {
            ...(branchId && { id: branchId }),
          },
        },
      };
    }

    if (dateRange?.from && dateRange?.to) {
      where.createdAt = {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      };
    }

    const sales = await getSaleItems(where);

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

export const requestRefund: RequestHandler = async (req, res) => {
  const { saleItemId, reason, quantity } = req.body;
  const userId = (req as any).userId;
  try {
    const refund = await createRefundRequest(
      saleItemId,
      userId,
      reason,
      quantity
    );
    res.status(201).json({ success: true, refund });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const approveRefundHandler: RequestHandler = async (req, res) => {
  const { refundId } = req.body;
  const approverId = (req as any).userId;
  try {
    const result = await approveRefund(refundId, approverId);
    res.status(200).json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const rejectRefundHandler: RequestHandler = async (req, res) => {
  const { refundId, reason } = req.body;
  const approverId = (req as any).userId;
  try {
    const updated = await rejectRefund(refundId, approverId, reason);
    res.status(200).json({ success: true, refund: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

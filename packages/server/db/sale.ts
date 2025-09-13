import prismaClient from "../config/prisma";
import type { PaymentMethod, Sale } from "../generated/prisma";
import { RefundStatus } from "../generated/prisma";
import { PaymentStatus } from "../generated/prisma";
import { getSellingPriceByStock } from "../utils/utils";

export const findStockById = async (stockId: string) =>
  await prismaClient.stock.findUnique({ where: { id: stockId } });

export const recordSale = async (
  stockId: string,
  quantity: number,
  saleType: "retail" | "wholesale",
  userId: string
) => {
  const stock = await findStockById(stockId);

  const sale = await prismaClient.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        saleType: saleType || "retail",
        userId: userId,
      },
    });

    const sellingPrice = getSellingPriceByStock(saleType, stock);

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

  return sale;
};

export const recordPaymentAfterSale = async (
  sellingPrice: number,
  quantity: number,
  paymentMethod: PaymentMethod,
  sale: Sale
) => {
  return await prismaClient.payment.create({
    data: {
      amount: quantity * sellingPrice,
      paymentMethod: paymentMethod,
      status: "paid",
      saleId: sale.id,
    },
  });
};

export const getSaleItems = async (where: any = {}) => {
  return await prismaClient.saleItem.findMany({
    where,
    include: {
      stock: { include: { branch: true } },
      sale: { include: { soldBy: true, payment: true } },
    },
  });
};

export const createRefundRequest = async (
  saleItemId: string,
  requestedById?: string | null,
  reason?: string | null,
  quantity?: number
) => {
  const saleItem = await prismaClient.saleItem.findUnique({
    where: { id: saleItemId },
    include: { stock: true, sale: { include: { payment: true } } },
  });

  if (!saleItem) {
    throw new Error("SaleItem not found");
  }

  const amount = Number(
    (quantity ? quantity : saleItem.quantity * saleItem.price).toFixed(2)
  );

  const refund = await prismaClient.refund.create({
    data: {
      amount,
      quantity: quantity ?? null,
      reason: reason ?? null,
      status: "pending",
      saleItem: { connect: { id: saleItemId } },
      requestedBy: requestedById
        ? { connect: { id: requestedById } }
        : undefined,
    },
    include: {
      saleItem: {
        include: { stock: true, sale: { include: { payment: true } } },
      },
      requestedBy: true,
    },
  });

  return refund;
};

export const approveRefund = async (refundId: string, approverId: string) => {
  return await prismaClient.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      include: {
        saleItem: {
          include: {
            stock: true,
            sale: { include: { payment: true } },
          },
        },
        requestedBy: true,
        processedBy: true,
      },
    });

    if (!refund) throw new Error("Refund request not found");
    if (refund.status !== "pending") throw new Error("Refund is not pending");

    const saleItem = refund.saleItem;
    if (!saleItem) throw new Error("Linked saleItem not found");

    const amountToDeduct = Number(refund.amount.toFixed(2));

    const qtyToRefund = refund.quantity ? refund.quantity : saleItem.quantity;
    const updatedStock = await tx.stock.update({
      where: { id: saleItem.stockId },
      data: { quantity: { increment: qtyToRefund } },
    });

    if (qtyToRefund === saleItem.quantity) {
      await tx.saleItem.delete({ where: { id: saleItem.id } });
    } else {
      await tx.saleItem.update({
        where: { id: saleItem.id },
        data: { quantity: { decrement: qtyToRefund } },
      });
    }

    let updatedPayment = null;
    if (saleItem.sale && saleItem.sale.payment) {
      const payment = saleItem.sale.payment;
      const newAmount = Number((payment.amount - amountToDeduct).toFixed(2));

      if (newAmount > 0) {
        updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            amount: newAmount,
          },
        });
      } else {
        updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            amount: 0,
            status: PaymentStatus.refunded,
          },
        });
      }
    }

    const processedAt = new Date();
    const updatedRefund = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.approved,
        processedBy: { connect: { id: approverId } },
        processedAt,
      },
      include: {
        saleItem: true,
        processedBy: true,
        requestedBy: true,
      },
    });

    return {
      success: true,
      refund: updatedRefund,
      restoredStock: updatedStock,
      updatedPayment,
      amountDeducted: amountToDeduct,
      processedAt,
    };
  });
};

export const rejectRefund = async (
  refundId: string,
  approverId: string,
  reason?: string | null
) => {
  const processedAt = new Date();

  const updated = await prismaClient.refund.update({
    where: { id: refundId },
    data: {
      status: RefundStatus.rejected,
      processedBy: { connect: { id: approverId } },
      processedAt,
      reason: reason ? reason : undefined,
    },
    include: { saleItem: true, requestedBy: true, processedBy: true },
  });

  return updated;
};

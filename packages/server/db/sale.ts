import prismaClient from "../config/prisma";
import type { PaymentMethod, Sale } from "../generated/prisma";
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

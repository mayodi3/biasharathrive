import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const createOrder = async (req: Request, res: Response) => {
  const { cartItems, totalAmount, branchId, businessId } = req.body;
  const userId = (req as any).userId;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business)
      return res
        .status(400)
        .json({ success: false, message: "Invalid business" });

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot create empty order" });
    }

    for (const item of cartItems) {
      const stockItem = await prisma.stock.findUnique({
        where: { id: item.stockId },
      });
      if (!stockItem || stockItem.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.itemName}`,
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: userId,
        status: "pending",
        orderItems: {
          create: cartItems.map((item: any) => ({
            stockId: item.stockId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { orderItems: true },
    });

    res
      .status(201)
      .json({ success: true, message: "Order placed successfully", order });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  const { customerId, status, branchId } = req.body;
  const userId = (req as any).userId;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business)
      return res
        .status(400)
        .json({ success: false, message: "Invalid business" });

    const where: any = {
      businessId: business.id,
      ...(branchId && { branchId }),
      ...(customerId && { customerId }),
      ...(status && status !== "all" && { status }),
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { orderItems: { include: { stock: true } }, sale: true },
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId, newStatus, paymentMethod } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      if (newStatus === "Completed" && !order.saleId) {
        const sale = await tx.sale.create({
          data: {
            userId: (req as any).userId,
            saleType: "retail",
            items: {
              create: order.orderItems.map((item) => ({
                stockId: item.stockId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });

        for (const item of order.orderItems) {
          await tx.stock.update({
            where: { id: item.stockId },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        const totalPayment = order.orderItems.reduce(
          (acc, item) => acc + item.quantity * item.price,
          0
        );

        await tx.payment.create({
          data: {
            amount: totalPayment,
            paymentMethod: paymentMethod || "cash",
            status: "paid",
            saleId: sale.id,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { saleId: sale.id },
        });
      }

      return updated;
    });

    res
      .status(200)
      .json({ success: true, message: "Order updated", order: updatedOrder });
  } catch (error) {
    console.error("Failed to update order:", error);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;

  try {
    await prisma.order.delete({ where: { id: orderId } });
    res.status(200).json({ success: true, message: "Order deleted" });
  } catch (error) {
    console.error("Failed to delete order:", error);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
};

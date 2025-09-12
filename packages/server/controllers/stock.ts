import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";
import {
  deleteFromCloudinary,
  processBufferUploads,
  processUploads,
} from "../utils/upload";
import { getFilterDates } from "../utils/date-helper";

const prisma = new PrismaClient();

export const getBranchStockItems = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id: branchId } = req.params;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("No business found for the user");

    const stockItems = await prisma.stock.findMany({
      where: { branchId: branchId },
    });

    res.status(200).json({ success: true, stockItems });
  } catch (error) {
    console.error("Error fetching stock items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock items",
    });
  }
};

export const getBusinessStockItems = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id: businessId } = req.params;

  try {
    let stockItems;
    if (businessId) {
      stockItems = await prisma.stock.findMany({
        where: { branch: { businessId: businessId } },
      });
    } else {
      const businesses = await prisma.business.findMany({
        where: { ownerId: userId },
        include: {
          branches: {
            include: {
              stocks: true,
            },
          },
        },
      });

      if (!businesses.length) {
        return res.status(404).json({
          success: false,
          message: "No businesses found for this user",
        });
      }
      stockItems = businesses.flatMap((biz) =>
        biz.branches.flatMap((branch) =>
          branch.stocks.map((stock) => ({
            ...stock,
            branchId: branch.id,
            branchName: branch.name,
            businessId: biz.id,
            businessName: biz.name,
          }))
        )
      );
    }

    res.status(200).json({
      success: true,
      stockItems,
    });
  } catch (error) {
    console.error("Error fetching stock items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock items",
    });
  }
};

export const addStock = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;

  const {
    itemName,
    buyingPrice,
    sellingPrice,
    wholesalePrice,
    quantity,
    itemCode,
    lowStockQuantity,
    codeImageUrl,
    supplier,
    branchId,
  } = req.body;

  if (!itemName || !branchId) {
    return res.status(400).json({
      success: false,
      message: "Item name and branch ID are required",
    });
  }

  try {
    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId,
      },
    });

    if (!branch) {
      return res.status(403).json({
        success: false,
        message: "Branch not found or access denied",
      });
    }

    const folderMap: Record<string, string> = {
      image: "stock-images",
    };

    const uploadResults = await processUploads(req.file, folderMap);

    const stock = await prisma.stock.create({
      data: {
        branchId,
        itemName,
        buyingPrice: Number(buyingPrice),
        sellingPrice: Number(sellingPrice),
        wholesalePrice: Number(wholesalePrice),
        quantity: Number(quantity),
        itemCode,
        supplier,
        lowStockQuantity: Number(lowStockQuantity),
        itemCodeImageUrl: codeImageUrl || null,
        itemImageUrl: uploadResults["image"] || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: `'${itemName}' added successfully`,
      data: stock,
    });
  } catch (error: any) {
    console.error("Add stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add stock item",
    });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  const { id: stockId } = req.params;

  const {
    itemName,
    buyingPrice,
    sellingPrice,
    wholesalePrice,
    quantity,
    itemCode,
    lowStockQuantity,
    supplier,
    codeImageUrl,
    branchId,
  } = req.body;

  if (!stockId && !branchId) {
    return res.status(400).json({
      success: false,
      message: "Stock and Branch ID's is required",
    });
  }

  try {
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found or access denied",
      });
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

    let uploadResult;
    if (req.file)
      uploadResult = await processBufferUploads(
        req.file.buffer,
        itemName,
        "stock-images"
      );

    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: {
        itemName: itemName ?? stock.itemName,
        buyingPrice: buyingPrice ? Number(buyingPrice) : stock.buyingPrice,
        sellingPrice: sellingPrice ? Number(sellingPrice) : stock.sellingPrice,
        wholesalePrice: wholesalePrice
          ? Number(wholesalePrice)
          : stock.wholesalePrice,
        quantity: quantity ? Number(quantity) : stock.quantity,
        itemCode: itemCode ?? stock.itemCode,
        supplier: supplier ?? stock.supplier,
        lowStockQuantity: lowStockQuantity
          ? Number(lowStockQuantity)
          : stock.lowStockQuantity,
        itemCodeImageUrl: codeImageUrl ?? stock.itemImageUrl,
        itemImageUrl: uploadResult ?? stock.itemImageUrl,
        branchId: branchId ?? stock.branchId,
      },
    });

    return res.status(200).json({
      success: true,
      message: `'${updatedStock.itemName}' updated successfully`,
      data: updatedStock,
    });
  } catch (error: any) {
    console.error("Update stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update stock item",
    });
  }
};

export const deleteStock = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { stockId } = req.params;
  const { softDelete = "true" } = req.query;

  if (!stockId) {
    return res.status(400).json({
      success: false,
      message: "Stock ID is required",
    });
  }

  try {
    const stock = await prisma.stock.findFirst({
      where: {
        id: stockId,
        branch: {
          business: {
            ownerId: userId,
          },
        },
      },
      include: { branch: true },
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found or access denied",
      });
    }

    if (softDelete === "true") {
      await prisma.stock.update({
        where: { id: stockId },
        data: { isActive: false },
      });

      return res.status(200).json({
        success: true,
        message: `Stock '${stock.itemName}' marked as inactive (soft deleted)`,
      });
    } else {
      await deleteFromCloudinary(stock.itemImageUrl);
      await deleteFromCloudinary(stock.itemCodeImageUrl);

      await prisma.stock.delete({ where: { id: stockId } });

      return res.status(200).json({
        success: true,
        message: `Stock '${stock.itemName}' permanently deleted`,
      });
    }
  } catch (error: any) {
    console.error("Delete stock error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete stock item",
    });
  }
};

export const getStockItemsWithQrCodes = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { filter, startDate, endDate, branchId } = (req.body || {}) as {
    filter?: string;
    startDate?: string;
    endDate?: string;
    branchId?: string;
  };

  try {
    const businesses = await prisma.business.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No businesses found for the user",
      });
    }

    const businessIds = businesses.map((b) => b.id);

    let dateFilter: any = undefined;
    if (filter || startDate || endDate) {
      const { startDate: from, endDate: to } = getFilterDates(
        filter,
        startDate,
        endDate
      );
      dateFilter = { gte: from, lte: to };
    }

    const whereClause: any = {
      isActive: true,
      itemCodeImageUrl: { not: null, notIn: [""] },
      branch: {
        businessId: { in: businessIds },
      },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
    }

    const stockItems = await prisma.stock.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: { itemCodeImageUrl: true },
    });

    return res.status(200).json({
      success: true,
      count: stockItems.length,
      branchFiltered: !!branchId,
      stockItems,
    });
  } catch (error: any) {
    console.error("Failed to fetch stock items with QR codes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stock items with QR codes",
    });
  }
};

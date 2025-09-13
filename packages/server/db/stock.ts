import prismaClient from "../config/prisma";

export const findStockById = async (stockId: string) =>
  await prismaClient.stock.findUnique({ where: { id: stockId } });

export const findStocksByBranchId = async (branchId: string) =>
  await prismaClient.stock.findMany({
    where: { branchId: branchId },
  });

export const findStocksByBusinessId = async (businessId: string) =>
  await prismaClient.stock.findMany({
    where: { branch: { businessId } },
  });

export const getBusinessesesAndStocksByOwnerId = async (ownerId: string) =>
  await prismaClient.business.findMany({
    where: { ownerId: ownerId },
    include: {
      branches: {
        include: {
          stocks: true,
        },
      },
    },
  });

export const recordStock = async (dataToAdd: any = {}) =>
  await prismaClient.stock.create({
    data: dataToAdd,
  });

export const updateStockInDB = async (
  stockId: string,
  dataToUpdate: any = {}
) =>
  await prismaClient.stock.update({
    where: { id: stockId },
    data: dataToUpdate,
  });

export const deleteStockById = async (stockId: string) =>
  await prismaClient.stock.delete({ where: { id: stockId } });

export const performSoftDeleteOnStock = async (stockId: string) =>
  prismaClient.stock.update({
    where: { id: stockId },
    data: { isActive: false },
  });

export const getStockItemsQrCodes = async (where: any = {}) =>
  prismaClient.stock.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { itemCodeImageUrl: true },
  });

import prismaClient from "../config/prisma";

export const getBusinsessById = async (businessId: string) =>
  await prismaClient.business.findUnique({
    where: { id: businessId },
  });

export const getBranchById = async (branchId: string) =>
  prismaClient.branch.findUnique({
    where: { id: branchId },
  });

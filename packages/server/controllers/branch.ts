import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const getBusinessBranches = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;

  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      include: {
        branches: {
          where: { isActive: true },
          include: {
            employees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    return res.json({
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        branches: business.branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          location: branch.location,
          businessShortCode: branch.businessShortCode,
          employeeCount: branch.employees.length,
          employees: branch.employees,
        })),
      },
    });
  } catch (error) {
    console.error("Get branches error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business branches",
    });
  }
};

export const addBranch = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { branchName, branchLocation, businessShortCode } = req.body;

  if (!branchName || !branchLocation) {
    return res.status(400).json({
      success: false,
      message: "Branch name and location are required",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.findFirst({
        where: { ownerId: userId },
      });

      if (!business) {
        throw new Error("Business not found or access denied");
      }

      const branch = await tx.branch.create({
        data: {
          name: branchName,
          location: branchLocation,
          businessShortCode:
            businessShortCode ||
            `${business.id.slice(-3).toUpperCase()}-${Date.now()
              .toString()
              .slice(-3)}`,
          businessId: business.id,
          isActive: true,
        },
      });

      return { branch, business };
    });

    return res.status(201).json({
      success: true,
      message: "Branch added successfully",
      data: {
        branchId: result.branch.id,
        branchName: result.branch.name,
        branchLocation: result.branch.location,
        businessShortCode: result.branch.businessShortCode,
      },
    });
  } catch (error: any) {
    console.error("Add branch error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add branch",
    });
  }
};

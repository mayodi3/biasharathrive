import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const onboardBusiness = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { businessName, branchName, branchLocation, businessShortCode } =
    req.body;

  if (!businessName || !branchLocation) {
    return res.status(400).json({
      success: false,
      message: "Business name and branch location are required",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          onboarded: true,
          ownerId: userId,
        },
      });

      const branch = await tx.branch.create({
        data: {
          name: branchName || businessName,
          location: branchLocation,
          businessShortCode:
            businessShortCode || business.id.slice(-6).toUpperCase(),
          businessId: business.id,
          isActive: true,
        },
      });

      return { business, branch };
    });

    return res.status(201).json({
      success: true,
      message: "Business onboarding completed successfully",
      data: {
        businessId: result.business.id,
        businessName: result.business.name,
        branchId: result.branch.id,
        branchName: result.branch.name,
        businessShortCode: result.branch.businessShortCode,
      },
    });
  } catch (error) {
    console.error("Business onboarding error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create business profile",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

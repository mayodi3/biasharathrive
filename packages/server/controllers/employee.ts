import bcrypt from "bcryptjs";
import { type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { processUploads } from "../utils/upload";

const prisma = new PrismaClient();

export const addEmployee = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    idNumber,
    branchId,
    role = "employee",
  } = req.body;

  if (!email || !password || !branchId) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and branch ID are required",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst({
        where: {
          id: branchId,
          business: {
            ownerId: userId,
          },
        },
        include: {
          business: true,
        },
      });

      if (!branch) {
        throw new Error("Branch not found or access denied");
      }

      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error(`Employee with email '${email}' already exists`);
      }

      const folderMap: Record<string, string> = {
        image: "profiles",
        idImageFront: "national-ids",
        idImageBack: "national-ids",
      };

      const uploadResults = await processUploads(req.files, folderMap);
      const hashedPassword = await bcrypt.hash(password, 10);

      const employee = await tx.user.create({
        data: {
          email,
          hashedPassword,
          role: role as any,
          firstName: firstName || "",
          lastName: lastName || "",
          phoneNumber: phoneNumber || "",
          idNumber: idNumber || "",
          image: uploadResults["image"] || null,
          idImageFront: uploadResults["idImageFront"] || null,
          idImageBack: uploadResults["idImageBack"] || null,
          branchId: branchId,
          isActive: true,
        },
      });

      return { employee, branch };
    });

    return res.status(201).json({
      success: true,
      message: "Employee added successfully",
      data: {
        employeeId: result.employee.id,
        email: result.employee.email,
        name: `${result.employee.firstName} ${result.employee.lastName}`.trim(),
        branchName: result.branch.name,
        role: result.employee.role,
      },
    });
  } catch (error: any) {
    console.error("Add employee error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add employee",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

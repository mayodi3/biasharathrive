import prisma from "../config/prisma";
import bcrypt from "bcryptjs";

export type CustomerData = {
  name: string;
  email: string;
  password?: string;
  customerType: "Regular" | "Wholesale";
};

export async function getCustomersService(userId: string) {
  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found.");

    return prisma.user.findMany({
      where: {
        businessId: business.id,
        role: "CUSTOMER",
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
}

export async function addCustomerService(userId: string, data: CustomerData) {
  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found.");

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return {
        status: "error",
        message: "An account with this email already exists.",
      };
    }

    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "CUSTOMER",
        businessId: business.id,
        customerType: data.customerType,
      },
    });

    return { status: "success", message: "Customer added successfully." };
  } catch (error: any) {
    console.error("Failed to add customer:", error);
    return {
      status: "error",
      message: error.message || "An unexpected error occurred.",
    };
  }
}

export async function deleteCustomerService(
  userId: string,
  customerId: string
) {
  try {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found.");

    const profileToDelete = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!profileToDelete) throw new Error("Customer not found.");
    if (profileToDelete.businessId !== business.id) {
      throw new Error(
        "Permission denied. This customer does not belong to your business."
      );
    }
    if (profileToDelete.role !== "CUSTOMER") {
      throw new Error(
        "Permission denied. Only customers can be deleted this way."
      );
    }

    await prisma.user.delete({ where: { id: customerId } });

    return { status: "success", message: "Customer deleted successfully." };
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    return {
      status: "error",
      message: error.message || "An unexpected error occurred.",
    };
  }
}

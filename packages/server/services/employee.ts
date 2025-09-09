import prismaClient from "../config/prisma";
import bcrypt from "bcryptjs";

export async function getEmployeesService(userId: string) {
  try {
    const business = await prismaClient.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found.");

    return prismaClient.user.findMany({
      where: {
        branchId: business.id,
        role: "employee",
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
}

export async function addEmployeeService(
  userId: string,
  data: { name: string; email: string; password: string }
) {
  try {
    const business = await prismaClient.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found.");

    const existing = await prismaClient.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return {
        status: "error",
        message: "An account with this email already exists.",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prismaClient.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "employee",
        businessId: business.id,
      },
    });

    return { status: "success", message: "Employee added successfully." };
  } catch (error: any) {
    console.error("Failed to add employee:", error);
    return {
      status: "error",
      message: error.message || "An unexpected error occurred.",
    };
  }
}

export async function deleteEmployeeService(
  userId: string,
  employeeId: string
) {
  try {
    const business = await prismaClient.business.findFirst({
      where: { ownerId: userId },
    });
    if (!business) throw new Error("Business not found.");

    const profile = await prismaClient.user.findUnique({
      where: { id: employeeId },
    });
    if (!profile) throw new Error("Employee not found.");
    if (profile.businessId !== business.id)
      throw new Error("Permission denied.");
    if (profile.role !== "EMPLOYEE")
      throw new Error("Only employees can be deleted this way.");

    await prismaClient.user.delete({ where: { id: employeeId } });

    return { status: "success", message: "Employee deleted successfully." };
  } catch (error: any) {
    console.error("Failed to delete employee:", error);
    return {
      status: "error",
      message: error.message || "An unexpected error occurred.",
    };
  }
}

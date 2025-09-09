import prisma from "../config/prisma";
import bcrypt from "bcryptjs";

export async function updateProfileSettingsService(
  userId: string,
  newUserName: string,
  newBusinessName: string
) {
  if (!newUserName || !newBusinessName) {
    throw new Error("User name and business name are required.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
  });
  if (!business) throw new Error("Business not found.");

  // Update user name if changed
  if (user.name !== newUserName) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: newUserName },
    });
  }

  // Update business name if changed
  if (business.name !== newBusinessName) {
    await prisma.business.update({
      where: { id: business.id },
      data: { name: newBusinessName },
    });
  }

  return { status: "success", message: "Settings updated successfully." };
}

export async function updatePasswordService(
  userId: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  if (!oldPassword || !newPassword) {
    throw new Error("Old and new passwords are required.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");
  if (!user.password) throw new Error("Password not set for this account.");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Old password is incorrect.");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { status: "success", message: "Password updated successfully." };
}

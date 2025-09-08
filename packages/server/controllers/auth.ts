import bcrypt from "bcryptjs";
import { type Request, type Response } from "express";
import { UAParser } from "ua-parser-js";
import { PrismaClient, type User } from "../generated/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  deleteAllRefreshTokensForUser,
  deleteRefreshTokenById,
  findMatchingTokenRecord,
  getRefreshTokensForUser,
  handlePossibleTokenReuse,
  rotateRefreshToken,
  saveRefreshToken,
} from "../utils/refreshTokens";
import { processUploads } from "../utils/upload";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password, role, firstName, lastName, phoneNumber, idNumber } =
    req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res
        .status(409)
        .json({ success: false, message: "Email already in use." });

    const folderMap: Record<string, string> = {
      image: "profiles",
      idImageFront: "national-ids",
      idImageBack: "national-ids",
    };

    const uploadResults = await processUploads(req.files, folderMap);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        phoneNumber: phoneNumber ?? "",
        idNumber: idNumber ?? "",
        image: uploadResults["image"] ?? null,
        idImageFront: uploadResults["idImageFront"] ?? null,
        idImageBack: uploadResults["idImageBack"] ?? null,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: newUser.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const matches = await bcrypt.compare(password, user.hashedPassword);
  if (!matches) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const refreshTokenDuration = 7 * 24 * 60 * 60 * 1000;
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenDuration);

  const ua = UAParser(req.headers["user-agent"] || "");
  const device = `${ua.browser.name || "unknown"} on ${
    ua.os.name || "unknown"
  }`;

  await saveRefreshToken(user.id, refreshToken, refreshTokenExpiresAt, device);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: refreshTokenDuration,
  });

  return res.json({
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = verifyRefreshToken(token) as { userId: string };
    const userId = decoded.userId;

    const record = await findMatchingTokenRecord(token);

    if (!record) {
      await handlePossibleTokenReuse(userId);
      return res.status(403).json({
        message: "Refresh token reuse detected. All sessions revoked.",
      });
    }

    if (record.expiresAt < new Date()) {
      await deleteRefreshTokenById(record.id);
      return res.status(403).json({ message: "Refresh token expired" });
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as User;
    const refreshTokenDuration = 7 * 24 * 60 * 60 * 1000;

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const newExpiresAt = new Date(Date.now() + refreshTokenDuration);

    await rotateRefreshToken(token, newRefreshToken, newExpiresAt);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: refreshTokenDuration,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const record = await findMatchingTokenRecord(token);
    if (record) await deleteRefreshTokenById(record.id);
  }

  res.clearCookie("refreshToken", { path: "/" });
  return res.json({ message: "Logged out from this device" });
};

export const logoutAll = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  await deleteAllRefreshTokensForUser(userId);
  res.clearCookie("refreshToken", { path: "/" });
  return res.json({ message: "Logged out from all devices" });
};

export const sessions = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const tokens = await getRefreshTokensForUser(userId);
  const safe = tokens.map((t) => ({
    id: t.id,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
    device: t.device,
  }));
  return res.json(safe);
};

export const revokeSession = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  await prisma.refreshToken.deleteMany({ where: { id, userId } });
  res.clearCookie("refreshToken", { path: "/" });
  return res.json({ message: "Session revoked" });
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        image: true,
        idImageFront: true,
        idImageBack: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (error) {
    console.error("GET /auth/me error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "../generated/prisma";

export const generateAccessToken = (user: User) =>
  jwt.sign(
    { userId: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" }
  );

export const generateRefreshToken = (user: User) =>
  jwt.sign(
    { userId: user.id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "15d" } as SignOptions
  );

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);

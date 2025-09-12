import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const saveRefreshToken = async (
  userId: string,
  plainToken: string,
  expiresAt: Date,
  device?: string
) => {
  const hashed = bcrypt.hashSync(plainToken, 10);
  const rec = await prisma.refreshToken.create({
    data: { token: hashed, userId, expiresAt, device: device ?? "" },
  });
  return rec;
};

export const getRefreshTokensForUser = async (userId: string) =>
  prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const findMatchingTokenRecord = async (plainToken: string) => {
  const refreshTokens = await prisma.refreshToken.findMany(); // small scale: optimize with index / caching (Redis) in prod
  for (const refreshToken of refreshTokens) {
    if (await bcrypt.compare(plainToken, refreshToken.token))
      return refreshToken;
  }
  return null;
};

export const rotateRefreshToken = async (
  oldPlainToken: string,
  newPlainToken: string,
  newExpiresAt: Date
) => {
  const record = await findMatchingTokenRecord(oldPlainToken);
  if (!record) return null;
  const hashed = bcrypt.hashSync(newPlainToken, 10);
  const updated = await prisma.refreshToken.update({
    where: { id: record.id },
    data: { token: hashed, expiresAt: newExpiresAt, lastUsed: new Date() },
  });
  return updated;
};

export const deleteRefreshTokenById = (id: string) =>
  prisma.refreshToken.delete({ where: { id } });

export const deleteAllRefreshTokensForUser = (userId: string) =>
  prisma.refreshToken.deleteMany({ where: { userId } });

export const handlePossibleTokenReuse = async (userId: string) => {
  await deleteAllRefreshTokensForUser(userId);
};

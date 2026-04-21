import { prisma } from "../../config/prisma";
import { randomUUID, createHash, timingSafeEqual } from "crypto";

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  require("crypto").randomFillSync(bytes);
  return `msk_${Buffer.from(bytes).toString("hex")}`;
}

function hashKey(key: string): string {
  const hash = createHash("sha256");
  hash.update(key);
  hash.update(process.env.ENCRYPTION_KEY || "fallback-secret-key");
  return hash.digest("hex");
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function createMcpApiKey(
  userId: string,
  name: string,
  permissions: Record<string, unknown> = {},
  expiresAt?: Date
): Promise<{ key: string; id: string }> {
  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  
  const apiKey = await prisma.mcpApiKey.create({
    data: {
      userId,
      name,
      keyHash,
      permissions: JSON.stringify(permissions),
      expiresAt,
    },
  });
  
  return { key: rawKey, id: apiKey.id };
}

export async function validateMcpApiKey(key: string): Promise<string | null> {
  if (!key.startsWith("msk_") || key.length !== 41) {
    return null;
  }
  
  const keyHash = hashKey(key);
  
  const apiKey = await prisma.mcpApiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
    },
  });
  
  if (!apiKey) {
    return null;
  }
  
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }
  
  await prisma.mcpApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  
  return apiKey.userId;
}

interface ApiKeyInfo {
  id: string;
  name: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export async function listMcpApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  return prisma.mcpApiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteMcpApiKey(userId: string, keyId: string): Promise<boolean> {
  const apiKey = await prisma.mcpApiKey.findFirst({
    where: { id: keyId, userId },
  });
  
  if (!apiKey) {
    return false;
  }
  
  await prisma.mcpApiKey.delete({
    where: { id: keyId },
  });
  
  return true;
}

export async function revokeMcpApiKey(userId: string, keyId: string): Promise<boolean> {
  const apiKey = await prisma.mcpApiKey.findFirst({
    where: { id: keyId, userId },
  });
  
  if (!apiKey) {
    return false;
  }
  
  await prisma.mcpApiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });
  
  return true;
}
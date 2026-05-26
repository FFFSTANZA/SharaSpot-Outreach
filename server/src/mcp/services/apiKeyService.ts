import { createHash, randomFillSync } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { MCPKeyPermissions, MCPToolCategory } from "../types";

export type MCPKeyScope = "personal" | "organization";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const ALL_PERMISSION_AREAS: MCPToolCategory[] = [
  "contacts",
  "contactLists",
  "campaigns",
  "senders",
  "templates",
  "analytics",
  "inbox",
  "prm",
  "validation",
  "calls",
  "settings",
];

const DEFAULT_PERMISSIONS: MCPKeyPermissions = {
  access: "read",
  areas: ALL_PERMISSION_AREAS,
};

export interface CreateMcpApiKeyInput {
  userId: string;
  name: string;
  scope?: MCPKeyScope;
  organizationId?: string | null;
  permissions?: unknown;
  expiresAt?: Date;
}

export interface McpApiKeyMetadata {
  id: string;
  name: string;
  scope: MCPKeyScope;
  permissions: MCPKeyPermissions;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface McpApiKeyAuth {
  id: string;
  userId: string;
  organizationId: string | null;
  permissions: MCPKeyPermissions;
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  randomFillSync(bytes);
  return `msk_${Buffer.from(bytes).toString("hex")}`;
}

function hashKey(key: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }
  const hash = createHash("sha256");
  hash.update(key);
  hash.update(ENCRYPTION_KEY);
  return hash.digest("hex");
}

export function validateMcpEncryptionKey(): void {
  if (!ENCRYPTION_KEY) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required for MCP API key hashing. " +
      "Set it to a 64-character hex string (use: openssl rand -hex 32)."
    );
  }
}

export async function createMcpApiKey(input: CreateMcpApiKeyInput): Promise<McpApiKeyMetadata & { key: string }> {
  const scope = input.scope || "personal";
  const normalizedName = input.name.trim();
  if (!normalizedName) {
    throw new Error("Key name is required");
  }
  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.mcpApiKey.create({
    data: {
      userId: input.userId,
      organizationId: scope === "organization" ? input.organizationId : null,
      name: normalizedName,
      keyHash,
      permissions: normalizePermissions(input.permissions) as unknown as Prisma.InputJsonObject,
      expiresAt: input.expiresAt,
    },
  });

  return { ...serializeKey(apiKey), key: rawKey };
}

export async function validateMcpApiKey(key: string): Promise<McpApiKeyAuth | null> {
  if (!key.startsWith("msk_") || key.length !== 68) {
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

  if (apiKey.organizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: apiKey.organizationId,
          userId: apiKey.userId,
        },
      },
      select: { userId: true },
    });
    if (!membership) {
      return null;
    }
  }

  await prisma.mcpApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: apiKey.id,
    userId: apiKey.userId,
    organizationId: apiKey.organizationId,
    permissions: normalizePermissions(apiKey.permissions),
  };
}

export async function listMcpApiKeys(input: {
  userId: string;
  scope?: MCPKeyScope;
  organizationId?: string | null;
}): Promise<McpApiKeyMetadata[]> {
  const scope = input.scope || "personal";
  const keys = await prisma.mcpApiKey.findMany({
    where: scope === "organization"
      ? { organizationId: input.organizationId || "__missing_org__" }
      : { userId: input.userId, organizationId: null },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((key) => serializeKey(key));
}

export async function deleteMcpApiKey(input: {
  userId: string;
  keyId: string;
  scope?: MCPKeyScope;
  organizationId?: string | null;
}): Promise<boolean> {
  const scope = input.scope || "personal";
  const where = scope === "organization"
    ? { id: input.keyId, organizationId: input.organizationId || "__missing_org__" }
    : { id: input.keyId, userId: input.userId, organizationId: null };

  const result = await prisma.mcpApiKey.deleteMany({ where });
  return result.count > 0;
}

export async function revokeMcpApiKey(input: {
  userId: string;
  keyId: string;
  scope?: MCPKeyScope;
  organizationId?: string | null;
}): Promise<boolean> {
  const scope = input.scope || "personal";
  const where = scope === "organization"
    ? { id: input.keyId, organizationId: input.organizationId || "__missing_org__" }
    : { id: input.keyId, userId: input.userId, organizationId: null };

  const result = await prisma.mcpApiKey.updateMany({
    where,
    data: { isActive: false },
  });
  return result.count > 0;
}

export function normalizePermissions(value: unknown): MCPKeyPermissions {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = {};
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return DEFAULT_PERMISSIONS;
  }

  const candidate = parsed as Record<string, unknown>;
  const access = candidate.access === "write" ? "write" : "read";
  const areas = Array.isArray(candidate.areas)
    ? candidate.areas.filter((area): area is MCPToolCategory =>
        typeof area === "string" && ALL_PERMISSION_AREAS.includes(area as MCPToolCategory)
      )
    : ALL_PERMISSION_AREAS;

  return {
    access,
    areas: areas.length > 0 ? areas : ALL_PERMISSION_AREAS,
  };
}

function serializeKey(apiKey: {
  id: string;
  name: string;
  organizationId: string | null;
  permissions: unknown;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}, rawKey?: string): McpApiKeyMetadata & { key?: string } {
  return {
    id: apiKey.id,
    name: apiKey.name,
    scope: apiKey.organizationId ? "organization" : "personal",
    permissions: normalizePermissions(apiKey.permissions),
    isActive: apiKey.isActive,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
    ...(rawKey ? { key: rawKey } : {}),
  };
}

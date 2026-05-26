import { prisma } from "../config/prisma";
import { MCPContext } from "./types";
import { mcpCreateData, mcpScopeWhere } from "./scope";

export { mcpCreateData, mcpScopeWhere };

export type McpResult<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

export function ok<T>(data: T, message?: string): McpResult<T> {
  return { success: true, data, ...(message ? { message } : {}) };
}

export function fail(message: string): McpResult {
  return { success: false, message };
}

export function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength).replace(/[\x00-\x1F\x7F]/g, "");
}

export function sanitizeEmail(value: unknown): string | null {
  const email = sanitizeString(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function sanitizeDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function clampLimit(value: unknown, defaultValue = 50, maxValue = 100): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(Math.floor(parsed), 1), maxValue);
}

export function sanitizeOffset(value: unknown, defaultValue = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(Math.floor(parsed), 0);
}

export function sanitizePage(value: unknown, defaultValue = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(Math.floor(parsed), 1);
}

export function sanitizeStringArray(value: unknown, maxItems = 100, maxLength = 100): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean);
}

export async function findScopedSender(context: MCPContext, senderId?: string) {
  if (senderId) {
    return prisma.sender.findFirst({
      where: mcpScopeWhere(context, { id: senderId }),
      select: { id: true, email: true, isVerified: true },
    });
  }

  return prisma.sender.findFirst({
    where: mcpScopeWhere(context),
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, isVerified: true },
  });
}

export const confirmSchema = {
  confirm: {
    type: "boolean",
    const: true,
    description: "Required for destructive or externally visible operator actions.",
  },
};

import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type DbClient = Prisma.TransactionClient | PrismaClient;

export interface BounceSuppressionScope {
  userId: string;
  organizationId?: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOrganizationScopedBounce(scope: BounceSuppressionScope): boolean {
  return typeof scope.organizationId === "string" && scope.organizationId.length > 0;
}

export function buildBounceSuppressionUniqueWhere(scope: BounceSuppressionScope, email: string): any {
  const normalizedEmail = normalizeEmail(email);
  if (isOrganizationScopedBounce(scope)) {
    return {
      organizationId_email: {
        organizationId: scope.organizationId!,
        email: normalizedEmail,
      },
    };
  }

  return {
    userId_email: {
      userId: scope.userId,
      email: normalizedEmail,
    },
  };
}

export function buildBounceSuppressionListWhere(scope: BounceSuppressionScope, emails: string[]): any {
  const normalizedEmails = emails.map(normalizeEmail);
  if (isOrganizationScopedBounce(scope)) {
    return {
      organizationId: scope.organizationId!,
      email: { in: normalizedEmails },
    };
  }

  return {
    userId: scope.userId,
    organizationId: null,
    email: { in: normalizedEmails },
  };
}

export async function upsertBounceSuppression(
  scope: BounceSuppressionScope,
  email: string,
  reason: string,
  db: DbClient = prisma,
) {
  const normalizedEmail = normalizeEmail(email);
  const where = buildBounceSuppressionUniqueWhere(scope, normalizedEmail);
  const create = isOrganizationScopedBounce(scope)
    ? {
        userId: null,
        organizationId: scope.organizationId!,
        email: normalizedEmail,
        reason,
      }
    : {
        userId: scope.userId,
        organizationId: null,
        email: normalizedEmail,
        reason,
      };

  return db.bounceList.upsert({
    where,
    update: {
      bouncedAt: new Date(),
      reason,
    },
    create: create as any,
  } as any);
}

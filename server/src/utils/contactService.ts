import { prisma } from "../config/prisma";
import { Prisma, PrismaClient } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaClient;

export const upsertContact = async (
  userId: string,
  email: string,
  data: {
    website?: string | null;
    companyDomain?: string | null;
    firstName?: string;
    lastName?: string;
    company?: string | null;
    phone?: string | null;
    jobTitle?: string;
    techStack?: string[];
    stage?: string;
    nextAction?: string | null;
    nextActionDueAt?: Date | string | null;
    assignedToId?: string | null;
    lastEnrichedAt?: Date | null;
    tags?: string[];
    organizationId?: string | null;
    enrichmentSources?: {
      website?: "direct" | "enriched" | "none";
      companyDomain?: "direct" | "enriched" | "none";
      company?: "direct" | "enriched" | "none";
      phone?: "direct" | "enriched" | "none";
      techStack?: "direct" | "enriched" | "none";
    };
  },
  db: DbClient = prisma
) => {
  const { tags, stage, organizationId, enrichmentSources, ...rest } = data;
  const existing = await db.contact.findUnique({ where: { userId_email: { userId, email } } });

  const mergedRest = existing ? {
    ...rest,
    website: enrichmentSources?.website === "enriched" && existing.website ? existing.website : rest.website,
    companyDomain: enrichmentSources?.companyDomain === "enriched" && existing.companyDomain ? existing.companyDomain : rest.companyDomain,
    company: enrichmentSources?.company === "enriched" && existing.company ? existing.company : rest.company,
    phone: enrichmentSources?.phone === "enriched" && existing.phone ? existing.phone : rest.phone,
    techStack: enrichmentSources?.techStack === "enriched"
      ? Array.from(new Set([...(existing.techStack ?? []), ...(rest.techStack ?? [])]))
      : rest.techStack,
  } : rest;

  if (existing) {
    return db.contact.update({
      where: { id: existing.id },
      data: {
        ...mergedRest,
        stage: stage || undefined,
        ...(organizationId ? { organizationId } : {}),
        tags: tags ? { set: tags.map((tagId: string) => ({ id: tagId })) } : undefined,
      },
      include: { tags: true },
    });
  }

  return db.contact.create({
    data: {
      userId,
      email,
      ...mergedRest,
      stage: stage || "COLD",
      ...(organizationId ? { organizationId } : {}),
      tags: tags ? { connect: tags.map((tagId: string) => ({ id: tagId })) } : undefined,
    },
    include: { tags: true },
  });
};

export const logContactActivity = async (
  contactId: string,
  type: string,
  metadata?: Record<string, unknown>,
  db: DbClient = prisma
) => {
  return db.contactActivity.create({
    data: { contactId, type, metadata: metadata as Prisma.InputJsonValue },
  });
};

export const logContactActivityByEmail = async (
  userId: string,
  email: string,
  type: string,
  metadata?: Record<string, unknown>,
  db: DbClient = prisma
) => {
  const contact = await db.contact.findUnique({ where: { userId_email: { userId, email } } });
  if (contact) return logContactActivity(contact.id, type, metadata, db);
  return null;
};

export const updateContactStage = async (contactId: string, stage: string, db: DbClient = prisma) => {
  const contact = await db.contact.update({ where: { id: contactId }, data: { stage } });
  await logContactActivity(contactId, "STAGE_CHANGED", { stage }, db);
  return contact;
};

export const updateContactStageByEmail = async (
  userId: string,
  email: string,
  stage: string,
  db: DbClient = prisma
) => {
  const contact = await db.contact.findUnique({ where: { userId_email: { userId, email } } });
  if (contact) return updateContactStage(contact.id, stage, db);
  return null;
};

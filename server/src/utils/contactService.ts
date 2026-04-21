import { prisma } from "../config/prisma";
import { Prisma, PrismaClient } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaClient;

export const upsertContact = async (
  userId: string,
  email: string,
  data: {
    firstName?: string;
    lastName?: string;
    company?: string;
    jobTitle?: string;
    stage?: string;
    tags?: string[];
  },
  db: DbClient = prisma
) => {
  const { tags, stage, ...rest } = data;
  return db.contact.upsert({
    where: { userId_email: { userId, email } },
    update: {
      ...rest,
      stage: stage || undefined,
      tags: tags ? { set: tags.map((tagId: string) => ({ id: tagId })) } : undefined,
    },
    create: {
      userId,
      email,
      ...rest,
      stage: stage || "COLD",
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

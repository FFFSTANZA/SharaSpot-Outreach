import { PrismaClient, Prisma } from "@prisma/client";

const defaultPrisma = new PrismaClient();

export const upsertContact = async (
  userId: string, 
  email: string, 
  data: {
    firstName?: string;
    lastName?: string;
    company?: string;
    jobTitle?: string;
  },
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  return await (prisma as any).contact.upsert({
    where: {
      userId_email: {
        userId,
        email,
      },
    },
    update: {
      ...data,
    },
    create: {
      userId,
      email,
      ...data,
      stage: "LEAD",
    },
  });
};

export const logContactActivity = async (
  contactId: string, 
  type: string, 
  metadata?: any,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  return await (prisma as any).contactActivity.create({
    data: {
      contactId,
      type,
      metadata,
    },
  });
};

export const logContactActivityByEmail = async (
  userId: string, 
  email: string, 
  type: string, 
  metadata?: any,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  const contact = await (prisma as any).contact.findUnique({
    where: {
      userId_email: {
        userId,
        email,
      },
    },
  });

  if (contact) {
    return await logContactActivity(contact.id, type, metadata, prisma);
  }
  return null;
};

export const updateContactStage = async (
  contactId: string, 
  stage: string,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  const contact = await (prisma as any).contact.update({
    where: { id: contactId },
    data: { stage },
  });

  await logContactActivity(contactId, "STAGE_CHANGED", { stage }, prisma);
  return contact;
};

export const updateContactStageByEmail = async (
  userId: string, 
  email: string, 
  stage: string,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  const contact = await (prisma as any).contact.findUnique({
    where: {
      userId_email: {
        userId,
        email,
      },
    },
  });

  if (contact) {
    return await updateContactStage(contact.id, stage, prisma);
  }
  return null;
};

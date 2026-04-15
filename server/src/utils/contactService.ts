import { PrismaClient, ContactStage, ActivityType, Prisma } from "@prisma/client";

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
  return await prisma.contact.upsert({
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
      stage: ContactStage.LEAD,
    },
  });
};

export const logContactActivity = async (
  contactId: string, 
  type: ActivityType, 
  metadata?: any,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  return await prisma.contactActivity.create({
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
  type: ActivityType, 
  metadata?: any,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  const contact = await prisma.contact.findUnique({
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
  stage: ContactStage,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: { stage },
  });

  await logContactActivity(contactId, ActivityType.STAGE_CHANGED, { stage }, prisma);
  return contact;
};

export const updateContactStageByEmail = async (
  userId: string, 
  email: string, 
  stage: ContactStage,
  prisma: Prisma.TransactionClient | PrismaClient = defaultPrisma
) => {
  const contact = await prisma.contact.findUnique({
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

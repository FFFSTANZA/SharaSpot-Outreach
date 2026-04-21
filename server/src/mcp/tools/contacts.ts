import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";

function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength).replace(/[\x00-\x1F\x7F]/g, "");
}

function sanitizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.toLowerCase().trim().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function sanitizeLimit(value: unknown, defaultVal = 50, maxVal = 100): number {
  const num = Number(value) || defaultVal;
  return Math.min(Math.max(num, 1), maxVal);
}

function sanitizeOffset(value: unknown, defaultVal = 0): number {
  return Math.max(Number(value) || defaultVal, 0);
}

const contactInputSchema = {
  type: "object" as const,
  properties: {
    email: { type: "string", description: "Contact email address" },
    firstName: { type: "string", description: "Contact first name" },
    lastName: { type: "string", description: "Contact last name" },
    company: { type: "string", description: "Contact company name" },
    tags: { type: "array", items: { type: "string" }, description: "Tags to apply" },
  },
  required: ["email"],
};

const contactListInputSchema = {
  type: "object" as const,
  properties: {
    search: { type: "string", description: "Search query" },
    limit: { type: "number", description: "Max results" },
    offset: { type: "number", description: "Results offset" },
  },
};

async function createContact(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const email = sanitizeEmail(args.email);
  if (!email) {
    return { success: false, message: "Invalid email address" };
  }

  const existing = await prisma.contact.findFirst({
    where: { userId: context.userId, email },
    select: { id: true },
  });

  if (existing) {
    return { success: false, message: "Contact already exists", contactId: existing.id };
  }

  const contact = await prisma.contact.create({
    data: {
      userId: context.userId,
      email,
      firstName: sanitizeString(args.firstName, 100),
      lastName: sanitizeString(args.lastName, 100),
      company: sanitizeString(args.company, 200),
    },
  });

  const tags = args.tags;
  if (Array.isArray(tags)) {
    for (const tagName of tags.slice(0, 10)) {
      const name = sanitizeString(tagName, 50);
      if (!name) continue;
      
      let tag = await prisma.tag.findFirst({
        where: { userId: context.userId, name },
        select: { id: true },
      });
      
      if (!tag) {
        tag = await prisma.tag.create({
          data: { userId: context.userId, name, color: "#6366f1" },
          select: { id: true },
        });
      }
      
      await prisma.contact.update({
        where: { id: contact.id },
        data: { tags: { connect: { id: tag.id } } },
      });
    }
  }

  return { success: true, contactId: contact.id, email: contact.email };
}

async function listContacts(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const search = sanitizeString(args.search, 200);
  const limit = sanitizeLimit(args.limit, 50, 100);
  const offset = sanitizeOffset(args.offset);

  const where: Record<string, unknown> = { userId: context.userId };

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { company: { contains: search } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts: contacts.map((c) => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      company: c.company,
    })),
    total,
    limit,
    offset,
  };
}

async function getContact(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const contactId = sanitizeString(args.contactId, 50);
  if (!contactId) {
    return { success: false, message: "Invalid contact ID" };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: context.userId },
  });

  if (!contact) {
    return { success: false, message: "Contact not found" };
  }

  return {
    id: contact.id,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
  };
}

async function updateContact(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const contactId = sanitizeString(args.contactId, 50);
  if (!contactId) {
    return { success: false, message: "Invalid contact ID" };
  }

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, userId: context.userId },
  });

  if (!existing) {
    return { success: false, message: "Contact not found" };
  }

  const updateData: Record<string, unknown> = {};
  if (args.firstName !== undefined) updateData.firstName = sanitizeString(args.firstName, 100);
  if (args.lastName !== undefined) updateData.lastName = sanitizeString(args.lastName, 100);
  if (args.company !== undefined) updateData.company = sanitizeString(args.company, 200);

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: updateData,
  });

  return { success: true, contactId: updated.id };
}

async function deleteContact(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const contactId = sanitizeString(args.contactId, 50);
  if (!contactId) {
    return { success: false, message: "Invalid contact ID" };
  }

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, userId: context.userId },
  });

  if (!existing) {
    return { success: false, message: "Contact not found" };
  }

  await prisma.contact.delete({
    where: { id: contactId },
  });

  return { success: true, message: "Contact deleted" };
}

export function registerContactTools() {
  toolRegistry.register(
    {
      name: "contact_create",
      description: "Create a new contact",
      inputSchema: contactInputSchema,
      handler: createToolHandler({ name: "contact_create", description: "", inputSchema: contactInputSchema, handler: createContact }),
    },
    "contacts"
  );

  toolRegistry.register(
    {
      name: "contact_list",
      description: "List contacts",
      inputSchema: contactListInputSchema,
      handler: createToolHandler({ name: "contact_list", description: "", inputSchema: contactListInputSchema, handler: listContacts }),
    },
    "contacts"
  );

  toolRegistry.register(
    {
      name: "contact_get",
      description: "Get contact",
      inputSchema: {
        type: "object" as const,
        properties: { contactId: { type: "string", description: "Contact ID" } },
        required: ["contactId"],
      },
      handler: createToolHandler({ name: "contact_get", description: "", inputSchema: {} as never, handler: getContact }),
    },
    "contacts"
  );

  toolRegistry.register(
    {
      name: "contact_update",
      description: "Update contact",
      inputSchema: {
        type: "object" as const,
        properties: {
          contactId: { type: "string", description: "Contact ID" },
          firstName: { type: "string", description: "First name" },
          lastName: { type: "string", description: "Last name" },
          company: { type: "string", description: "Company" },
        },
        required: ["contactId"],
      },
      handler: createToolHandler({ name: "contact_update", description: "", inputSchema: {} as never, handler: updateContact }),
    },
    "contacts"
  );

  toolRegistry.register(
    {
      name: "contact_delete",
      description: "Delete contact",
      inputSchema: {
        type: "object" as const,
        properties: { contactId: { type: "string", description: "Contact ID" } },
        required: ["contactId"],
      },
      handler: createToolHandler({ name: "contact_delete", description: "", inputSchema: {} as never, handler: deleteContact }),
    },
    "contacts"
  );
}
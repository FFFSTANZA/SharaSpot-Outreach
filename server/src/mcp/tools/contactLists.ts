import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";

async function listContactLists(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { limit = 20, offset = 0 } = args;

  const lists = await prisma.contactList.findMany({
    where: { userId: context.userId },
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: "desc" },
  });

  const listsWithCount = await Promise.all(
    lists.map(async (list) => {
      const count = await prisma.contact.count({
        where: { lists: { some: { id: list.id } } },
      });
      return { ...list, contactCount: count };
    })
  );

  return {
    lists: listsWithCount.map((l) => ({
      id: l.id,
      name: l.name,
      contactCount: l.contactCount,
      createdAt: l.createdAt,
    })),
    total: lists.length,
  };
}

async function getContactList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId } = args;

  const list = await prisma.contactList.findFirst({
    where: { id: String(listId), userId: context.userId },
  });

  if (!list) {
    return { success: false, message: "Contact list not found" };
  }

  const contacts = await prisma.contact.findMany({
    where: { lists: { some: { id: list.id } } },
  });

  return {
    id: list.id,
    name: list.name,
    contacts: contacts.map((c) => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
    })),
    createdAt: list.createdAt,
  };
}

async function createContactList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { name } = args;

  const list = await prisma.contactList.create({
    data: {
      userId: context.userId,
      name: String(name),
    },
  });

  return { success: true, listId: list.id, name: list.name };
}

async function addContactsToList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId, contactIds } = args;

  const list = await prisma.contactList.findFirst({
    where: { id: String(listId), userId: context.userId },
  });

  if (!list) {
    return { success: false, message: "Contact list not found" };
  }

  if (!contactIds || !Array.isArray(contactIds)) {
    return { success: false, message: "contactIds array required" };
  }

  for (const contactId of contactIds) {
    const contact = await prisma.contact.findFirst({
      where: { id: String(contactId), userId: context.userId },
    });
    if (contact) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { lists: { connect: { id: list.id } } },
      });
    }
  }

  return { success: true, message: `Added ${contactIds.length} contacts` };
}

async function removeContactsFromList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId, contactIds } = args;

  const list = await prisma.contactList.findFirst({
    where: { id: String(listId), userId: context.userId },
  });

  if (!list) {
    return { success: false, message: "Contact list not found" };
  }

  if (!contactIds || !Array.isArray(contactIds)) {
    return { success: false, message: "contactIds array required" };
  }

  for (const contactId of contactIds) {
    await prisma.contact.update({
      where: { id: String(contactId) },
      data: { lists: { disconnect: { id: list.id } } },
    });
  }

  return { success: true, message: `Removed ${contactIds.length} contacts` };
}

async function deleteContactList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId } = args;

  const list = await prisma.contactList.findFirst({
    where: { id: String(listId), userId: context.userId },
  });

  if (!list) {
    return { success: false, message: "Contact list not found" };
  }

  await prisma.contactList.delete({
    where: { id: String(listId) },
  });

  return { success: true, message: "Contact list deleted" };
}

export function registerContactListTools() {
  toolRegistry.register(
    {
      name: "contact_list_list",
      description: "List contact lists",
inputSchema: {
        type: "object" as const,
        properties: {
          listId: { type: "string", description: "List ID" },
          contactIds: { type: "array", items: { type: "string" }, description: "Contact IDs" },
        },
        required: ["listId", "contactIds"],
      },
      handler: createToolHandler({
        name: "contact_list_add_contacts",
        description: "",
        inputSchema: {} as never,
        handler: addContactsToList,
      }),
    },
    "contacts"
  );

  toolRegistry.register(
    {
      name: "contact_list_remove_contacts",
      description: "Remove contacts from list",
      inputSchema: {
        type: "object" as const,
        properties: {
          listId: { type: "string", description: "List ID" },
          contactIds: { type: "array", items: { type: "string" }, description: "Contact IDs" },
        },
        required: ["listId", "contactIds"],
      },
      handler: createToolHandler({
        name: "contact_list_remove_contacts",
        description: "",
        inputSchema: {} as never,
        handler: removeContactsFromList,
      }),
    },
    "contacts"
  );

  toolRegistry.register(
    {
      name: "contact_list_delete",
      description: "Delete contact list",
      inputSchema: {
        type: "object" as const,
        properties: {
          listId: { type: "string", description: "List ID" },
        },
        required: ["listId"],
      },
      handler: createToolHandler({
        name: "contact_list_delete",
        description: "",
        inputSchema: {} as never,
        handler: deleteContactList,
      }),
    },
    "contacts"
  );
}
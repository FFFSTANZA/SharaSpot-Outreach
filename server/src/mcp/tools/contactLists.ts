import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { mcpCreateData, mcpScopeWhere } from "../scope";

async function listContactLists(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { limit = 20, offset = 0 } = args;

  const lists = await prisma.contactList.findMany({
    where: mcpScopeWhere(context),
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
    where: mcpScopeWhere(context, { id: String(listId) }),
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
    data: mcpCreateData(context, {
      name: String(name),
    }),
  });

  return { success: true, listId: list.id, name: list.name };
}

async function addContactsToList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId, contactIds } = args;

  const list = await prisma.contactList.findFirst({
    where: mcpScopeWhere(context, { id: String(listId) }),
  });

  if (!list) {
    return { success: false, message: "Contact list not found" };
  }

  if (!contactIds || !Array.isArray(contactIds)) {
    return { success: false, message: "contactIds array required" };
  }

  const validContacts = await prisma.contact.findMany({
    where: mcpScopeWhere(context, { id: { in: contactIds.map(String) } }),
    select: { id: true },
  });

  if (validContacts.length > 0) {
    await prisma.$transaction(
      validContacts.map((contact) =>
        prisma.contact.update({
          where: { id: contact.id },
          data: { lists: { connect: { id: list.id } } },
        })
      )
    );
  }

  return { success: true, message: `Added ${validContacts.length} contacts` };
}

async function removeContactsFromList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId, contactIds } = args;

  const list = await prisma.contactList.findFirst({
    where: mcpScopeWhere(context, { id: String(listId) }),
  });

  if (!list) {
    return { success: false, message: "Contact list not found" };
  }

  if (!contactIds || !Array.isArray(contactIds)) {
    return { success: false, message: "contactIds array required" };
  }

  const validContacts = await prisma.contact.findMany({
    where: mcpScopeWhere(context, { id: { in: contactIds.map(String) } }),
    select: { id: true },
  });

  if (validContacts.length > 0) {
    await prisma.$transaction(
      validContacts.map((contact) =>
        prisma.contact.update({
          where: { id: contact.id },
          data: { lists: { disconnect: { id: list.id } } },
        })
      )
    );
  }

  return { success: true, message: `Removed ${validContacts.length} contacts` };
}

async function deleteContactList(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { listId } = args;

  const list = await prisma.contactList.findFirst({
    where: mcpScopeWhere(context, { id: String(listId) }),
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
          limit: { type: "number", description: "Max results" },
          offset: { type: "number", description: "Results offset" },
        },
      },
      handler: createToolHandler({
        name: "contact_list_list",
        description: "",
        inputSchema: {} as never,
        handler: listContactLists,
      }),
    },
    "contactLists"
  );

  toolRegistry.register(
    {
      name: "contact_list_get",
      description: "Get contact list details",
      inputSchema: {
        type: "object" as const,
        properties: {
          listId: { type: "string", description: "List ID" },
        },
        required: ["listId"],
      },
      handler: createToolHandler({
        name: "contact_list_get",
        description: "",
        inputSchema: {} as never,
        handler: getContactList,
      }),
    },
    "contactLists"
  );

  toolRegistry.register(
    {
      name: "contact_list_create",
      description: "Create contact list",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: { type: "string", description: "List name" },
        },
        required: ["name"],
      },
      handler: createToolHandler({
        name: "contact_list_create",
        description: "",
        inputSchema: {} as never,
        handler: createContactList,
      }),
    },
    "contactLists"
  );

  toolRegistry.register(
    {
      name: "contact_list_add_contacts",
      description: "Add contacts to list",
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
    "contactLists"
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
    "contactLists"
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
    "contactLists"
  );
}

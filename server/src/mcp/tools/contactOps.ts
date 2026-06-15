import { prisma } from "../../config/prisma";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { MCPContext } from "../types";
import {
  clampLimit,
  fail,
  mcpCreateData,
  mcpScopeWhere,
  ok,
  sanitizeEmail,
  sanitizeOffset,
  sanitizeString,
  sanitizeStringArray,
} from "../helpers";

const CONTACT_FIELDS = {
  email: { type: "string", description: "Email address" },
  firstName: { type: "string", description: "First name" },
  lastName: { type: "string", description: "Last name" },
  company: { type: "string", description: "Company" },
  phone: { type: "string", description: "Phone number" },
  jobTitle: { type: "string", description: "Job title" },
  stage: { type: "string", description: "Pipeline stage" },
  tags: { type: "array", items: { type: "string" }, description: "Tag names" },
  listIds: { type: "array", items: { type: "string" }, description: "Contact list IDs" },
};

const ALLOWED_STAGES = new Set(["NEW", "CONTACTED", "REPLIED", "INTERESTED", "MEETING_BOOKED", "CONVERTED", "NOT_A_FIT", "BOUNCED", "COLD", "WARM", "HOT"]);

async function upsertTags(context: MCPContext, names: string[]) {
  const tags = [];
  for (const name of names) {
    const existing = await prisma.tag.findFirst({
      where: mcpScopeWhere(context, { name }),
      select: { id: true, name: true },
    });
    if (existing) {
      tags.push(existing);
      continue;
    }
    tags.push(await prisma.tag.create({
      data: mcpCreateData(context, { name, color: "#6366f1" }),
      select: { id: true, name: true },
    }));
  }
  return tags;
}

async function createStructuredContact(context: MCPContext, args: Record<string, unknown>) {
  const email = sanitizeEmail(args.email);
  if (!email) return fail("Invalid email address");

  const existing = await prisma.contact.findFirst({
    where: mcpScopeWhere(context, { email }),
    select: { id: true },
  });
  if (existing) return fail("Contact already exists");

  const stage = sanitizeString(args.stage, 40).toUpperCase();
  const tagNames = sanitizeStringArray(args.tags, 20, 50);
  const listIds = sanitizeStringArray(args.listIds, 50, 80);
  const tags = await upsertTags(context, tagNames);
  const lists = listIds.length
    ? await prisma.contactList.findMany({ where: mcpScopeWhere(context, { id: { in: listIds } }), select: { id: true } })
    : [];

  const contact = await prisma.contact.create({
    data: mcpCreateData(context, {
      email,
      firstName: sanitizeString(args.firstName, 100) || null,
      lastName: sanitizeString(args.lastName, 100) || null,
      company: sanitizeString(args.company, 200) || null,
      phone: sanitizeString(args.phone, 60) || null,
      jobTitle: sanitizeString(args.jobTitle, 120) || null,
      stage: ALLOWED_STAGES.has(stage) ? stage : "COLD",
      tags: tags.length ? { connect: tags.map((tag) => ({ id: tag.id })) } : undefined,
      lists: lists.length ? { connect: lists.map((list) => ({ id: list.id })) } : undefined,
    }),
    include: { tags: true, lists: true },
  });

  return ok({ contact }, "Contact created");
}

async function bulkUpdateContacts(context: MCPContext, args: Record<string, unknown>) {
  const contactIds = sanitizeStringArray(args.contactIds, 500, 80);
  if (!contactIds.length) return fail("contactIds array is required");

  const updateData: Record<string, unknown> = {};
  if (args.company !== undefined) updateData.company = sanitizeString(args.company, 200) || null;
  if (args.jobTitle !== undefined) updateData.jobTitle = sanitizeString(args.jobTitle, 120) || null;
  if (args.stage !== undefined) {
    const stage = sanitizeString(args.stage, 40).toUpperCase();
    if (!ALLOWED_STAGES.has(stage)) return fail("Invalid stage value");
    updateData.stage = stage;
  }

  const tags = await upsertTags(context, sanitizeStringArray(args.addTags, 20, 50));
  const validContacts = await prisma.contact.findMany({
    where: mcpScopeWhere(context, { id: { in: contactIds } }),
    select: { id: true },
  });
  const ids = validContacts.map((contact) => contact.id);
  if (!ids.length) return fail("No scoped contacts found");

  await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length) {
      await tx.contact.updateMany({ where: mcpScopeWhere(context, { id: { in: ids } }), data: updateData });
    }
    if (tags.length) {
      await Promise.all(ids.map((id) => tx.contact.update({
        where: { id },
        data: { tags: { connect: tags.map((tag) => ({ id: tag.id })) } },
      })));
    }
  });

  return ok({ affectedCount: ids.length }, "Contacts updated");
}

async function bulkDeleteContacts(context: MCPContext, args: Record<string, unknown>) {
  const contactIds = sanitizeStringArray(args.contactIds, 1000, 80);
  if (!contactIds.length) return fail("contactIds array is required");

  const result = await prisma.contact.deleteMany({
    where: mcpScopeWhere(context, { id: { in: contactIds } }),
  });
  return ok({ deletedCount: result.count }, "Contacts deleted");
}

async function listTags(context: MCPContext, args: Record<string, unknown>) {
  const limit = clampLimit(args.limit, 50, 200);
  const offset = sanitizeOffset(args.offset);
  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      where: mcpScopeWhere(context),
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.tag.count({ where: mcpScopeWhere(context) }),
  ]);
  return ok({ tags, total, limit, offset });
}

async function createTag(context: MCPContext, args: Record<string, unknown>) {
  const name = sanitizeString(args.name, 50);
  if (!name) return fail("name is required");
  const color = sanitizeString(args.color, 20) || "#6366f1";
  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId: context.userId, name } },
    create: mcpCreateData(context, { name, color }),
    update: { color },
  });
  return ok({ tag }, "Tag saved");
}

async function applyTag(context: MCPContext, args: Record<string, unknown>) {
  const contactIds = sanitizeStringArray(args.contactIds, 500, 80);
  const tagId = sanitizeString(args.tagId, 80);
  if (!contactIds.length || !tagId) return fail("tagId and contactIds are required");
  const tag = await prisma.tag.findFirst({ where: mcpScopeWhere(context, { id: tagId }), select: { id: true } });
  if (!tag) return fail("Tag not found");
  const contacts = await prisma.contact.findMany({ where: mcpScopeWhere(context, { id: { in: contactIds } }), select: { id: true } });
  await Promise.all(contacts.map((contact) => prisma.contact.update({
    where: { id: contact.id },
    data: { tags: { connect: { id: tag.id } } },
  })));
  return ok({ affectedCount: contacts.length }, "Tag applied");
}

async function removeTag(context: MCPContext, args: Record<string, unknown>) {
  const contactIds = sanitizeStringArray(args.contactIds, 500, 80);
  const tagId = sanitizeString(args.tagId, 80);
  if (!contactIds.length || !tagId) return fail("tagId and contactIds are required");
  const tag = await prisma.tag.findFirst({ where: mcpScopeWhere(context, { id: tagId }), select: { id: true } });
  if (!tag) return fail("Tag not found");
  const contacts = await prisma.contact.findMany({ where: mcpScopeWhere(context, { id: { in: contactIds } }), select: { id: true } });
  await Promise.all(contacts.map((contact) => prisma.contact.update({
    where: { id: contact.id },
    data: { tags: { disconnect: { id: tag.id } } },
  })));
  return ok({ affectedCount: contacts.length }, "Tag removed");
}

async function listNotes(context: MCPContext, args: Record<string, unknown>) {
  const contactId = sanitizeString(args.contactId, 80);
  if (!contactId) return fail("contactId is required");
  const contact = await prisma.contact.findFirst({ where: mcpScopeWhere(context, { id: contactId }), select: { id: true } });
  if (!contact) return fail("Contact not found");
  const notes = await prisma.note.findMany({ where: { contactId }, orderBy: { createdAt: "desc" }, take: clampLimit(args.limit, 50, 100) });
  return ok({ notes });
}

async function createNote(context: MCPContext, args: Record<string, unknown>) {
  const contactId = sanitizeString(args.contactId, 80);
  const content = sanitizeString(args.content, 5000);
  if (!contactId || !content) return fail("contactId and content are required");
  const contact = await prisma.contact.findFirst({ where: mcpScopeWhere(context, { id: contactId }), select: { id: true } });
  if (!contact) return fail("Contact not found");
  const note = await prisma.note.create({ data: { contactId, content } });
  return ok({ note }, "Note created");
}

export function registerContactOperatorTools() {
  toolRegistry.register({
    name: "contact_structured_create",
    description: "Create a contact using the same structured fields accepted by contact imports",
    category: "contacts",
    access: "write",
    inputSchema: { type: "object", properties: CONTACT_FIELDS, required: ["email"] },
    handler: createToolHandler({ name: "contact_structured_create", description: "", inputSchema: {}, handler: createStructuredContact }),
  });
  toolRegistry.register({
    name: "contact_bulk_update",
    description: "Bulk update scoped contacts and optionally apply tags",
    category: "contacts",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        contactIds: { type: "array", items: { type: "string" } },
        company: { type: "string" },
        jobTitle: { type: "string" },
        stage: { type: "string" },
        addTags: { type: "array", items: { type: "string" } },
      },
      required: ["contactIds"],
    },
    handler: createToolHandler({ name: "contact_bulk_update", description: "", inputSchema: {}, handler: bulkUpdateContacts }),
  });
  toolRegistry.register({
    name: "contact_bulk_delete",
    description: "Delete many scoped contacts",
    category: "contacts",
    access: "write",
    destructive: true,
    inputSchema: { type: "object", properties: { contactIds: { type: "array", items: { type: "string" } } }, required: ["contactIds"] },
    handler: createToolHandler({ name: "contact_bulk_delete", description: "", inputSchema: {}, handler: bulkDeleteContacts }),
  });
  toolRegistry.register({ name: "contact_tag_list", description: "List contact tags", category: "contacts", access: "read", inputSchema: { type: "object", properties: { limit: { type: "number" }, offset: { type: "number" } } }, handler: createToolHandler({ name: "contact_tag_list", description: "", inputSchema: {}, handler: listTags }) });
  toolRegistry.register({ name: "contact_tag_create", description: "Create or update a tag", category: "contacts", access: "write", inputSchema: { type: "object", properties: { name: { type: "string" }, color: { type: "string" } }, required: ["name"] }, handler: createToolHandler({ name: "contact_tag_create", description: "", inputSchema: {}, handler: createTag }) });
  toolRegistry.register({ name: "contact_tag_apply", description: "Apply a tag to contacts", category: "contacts", access: "write", inputSchema: { type: "object", properties: { tagId: { type: "string" }, contactIds: { type: "array", items: { type: "string" } } }, required: ["tagId", "contactIds"] }, handler: createToolHandler({ name: "contact_tag_apply", description: "", inputSchema: {}, handler: applyTag }) });
  toolRegistry.register({ name: "contact_tag_remove", description: "Remove a tag from contacts", category: "contacts", access: "write", destructive: true, inputSchema: { type: "object", properties: { tagId: { type: "string" }, contactIds: { type: "array", items: { type: "string" } } }, required: ["tagId", "contactIds"] }, handler: createToolHandler({ name: "contact_tag_remove", description: "", inputSchema: {}, handler: removeTag }) });
  toolRegistry.register({ name: "contact_note_list", description: "List notes for a contact", category: "contacts", access: "read", inputSchema: { type: "object", properties: { contactId: { type: "string" }, limit: { type: "number" } }, required: ["contactId"] }, handler: createToolHandler({ name: "contact_note_list", description: "", inputSchema: {}, handler: listNotes }) });
  toolRegistry.register({ name: "contact_note_create", description: "Create a contact note", category: "contacts", access: "write", inputSchema: { type: "object", properties: { contactId: { type: "string" }, content: { type: "string" } }, required: ["contactId", "content"] }, handler: createToolHandler({ name: "contact_note_create", description: "", inputSchema: {}, handler: createNote }) });
}

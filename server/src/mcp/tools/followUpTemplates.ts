import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { MCPContext } from "../types";
import { mcpCreateData, mcpScopeWhere } from "../scope";
import { clampLimit, fail, ok, sanitizeString } from "../helpers";

async function createFollowUpTemplate(context: MCPContext, args: Record<string, unknown>) {
  const name = sanitizeString(args.name, 200);
  if (!name) return fail("name is required");

  const description = sanitizeString(args.description, 1000) || null;
  const steps = Array.isArray(args.steps) ? args.steps : [];

  const template = await prisma.followUpTemplate.create({
    data: mcpCreateData(context, {
      name,
      description,
      steps: steps as Prisma.InputJsonValue,
    }),
  });

  return ok({ template }, "Follow-up template created");
}

async function listFollowUpTemplates(context: MCPContext, args: Record<string, unknown>) {
  const limit = clampLimit(args.limit, 20, 100);
  const offset = Math.max(Number(args.offset) || 0, 0);

  const [templates, total] = await Promise.all([
    prisma.followUpTemplate.findMany({
      where: mcpScopeWhere(context),
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.followUpTemplate.count({ where: mcpScopeWhere(context) }),
  ]);

  return ok({ templates, total, limit, offset });
}

async function getFollowUpTemplate(context: MCPContext, args: Record<string, unknown>) {
  const templateId = sanitizeString(args.templateId, 80);
  if (!templateId) return fail("templateId is required");

  const template = await prisma.followUpTemplate.findFirst({
    where: mcpScopeWhere(context, { id: templateId }),
  });

  if (!template) return fail("Follow-up template not found");
  return ok({ template });
}

async function updateFollowUpTemplate(context: MCPContext, args: Record<string, unknown>) {
  const templateId = sanitizeString(args.templateId, 80);
  if (!templateId) return fail("templateId is required");

  const existing = await prisma.followUpTemplate.findFirst({
    where: mcpScopeWhere(context, { id: templateId }),
  });
  if (!existing) return fail("Follow-up template not found");

  const updateData: Record<string, unknown> = {};
  if (args.name !== undefined) {
    const name = sanitizeString(args.name, 200);
    if (!name) return fail("name cannot be empty");
    updateData.name = name;
  }
  if (args.description !== undefined) {
    updateData.description = typeof args.description === "string" ? args.description : null;
  }
  if (args.steps !== undefined) {
    if (!Array.isArray(args.steps)) return fail("steps must be an array");
    updateData.steps = args.steps as Prisma.InputJsonValue;
  }

  const template = await prisma.followUpTemplate.update({
    where: { id: templateId },
    data: updateData,
  });

  return ok({ template }, "Follow-up template updated");
}

async function deleteFollowUpTemplate(context: MCPContext, args: Record<string, unknown>) {
  const templateId = sanitizeString(args.templateId, 80);
  if (!templateId) return fail("templateId is required");

  const existing = await prisma.followUpTemplate.findFirst({
    where: mcpScopeWhere(context, { id: templateId }),
  });
  if (!existing) return fail("Follow-up template not found");

  await prisma.followUpTemplate.delete({ where: { id: templateId } });
  return ok({ deleted: true }, "Follow-up template deleted");
}

export function registerFollowUpTemplateTools() {
  toolRegistry.register({
    name: "follow_up_template_create",
    description: "Create a follow-up template with named steps",
    category: "templates",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Template name" },
        description: { type: "string", description: "Template description" },
        steps: { type: "array", description: "Follow-up step definitions" },
      },
      required: ["name", "steps"],
    },
    handler: createToolHandler({ name: "follow_up_template_create", description: "", inputSchema: {}, handler: createFollowUpTemplate }),
  });

  toolRegistry.register({
    name: "follow_up_template_list",
    description: "List follow-up templates",
    category: "templates",
    access: "read",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results" },
        offset: { type: "number", description: "Results offset" },
      },
    },
    handler: createToolHandler({ name: "follow_up_template_list", description: "", inputSchema: {}, handler: listFollowUpTemplates }),
  });

  toolRegistry.register({
    name: "follow_up_template_get",
    description: "Get a follow-up template by ID",
    category: "templates",
    access: "read",
    inputSchema: {
      type: "object",
      properties: {
        templateId: { type: "string", description: "Template ID" },
      },
      required: ["templateId"],
    },
    handler: createToolHandler({ name: "follow_up_template_get", description: "", inputSchema: {}, handler: getFollowUpTemplate }),
  });

  toolRegistry.register({
    name: "follow_up_template_update",
    description: "Update a follow-up template",
    category: "templates",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        templateId: { type: "string", description: "Template ID" },
        name: { type: "string", description: "Template name" },
        description: { type: "string", description: "Template description" },
        steps: { type: "array", description: "Follow-up step definitions" },
      },
      required: ["templateId"],
    },
    handler: createToolHandler({ name: "follow_up_template_update", description: "", inputSchema: {}, handler: updateFollowUpTemplate }),
  });

  toolRegistry.register({
    name: "follow_up_template_delete",
    description: "Delete a follow-up template",
    category: "templates",
    access: "write",
    destructive: true,
    inputSchema: {
      type: "object",
      properties: {
        templateId: { type: "string", description: "Template ID" },
      },
      required: ["templateId"],
    },
    handler: createToolHandler({ name: "follow_up_template_delete", description: "", inputSchema: {}, handler: deleteFollowUpTemplate }),
  });
}

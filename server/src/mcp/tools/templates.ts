import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";

async function listTemplates(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { limit = 20, offset = 0 } = args;

  const templates = await prisma.emailTemplate.findMany({
    where: { userId: context.userId },
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: "desc" },
  });

  return {
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      createdAt: t.createdAt,
    })),
    total: templates.length,
  };
}

async function getTemplate(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { templateId } = args;

  const template = await prisma.emailTemplate.findFirst({
    where: { id: String(templateId), userId: context.userId },
  });

  if (!template) {
    return { success: false, message: "Template not found" };
  }

  return {
    id: template.id,
    name: template.name,
    subject: template.subject,
    body: template.body,
    createdAt: template.createdAt,
  };
}

async function createTemplate(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { name, subject, body } = args;

  const template = await prisma.emailTemplate.create({
    data: {
      userId: context.userId,
      name: String(name),
      subject: String(subject),
      body: String(body),
    },
  });

  return {
    success: true,
    templateId: template.id,
    name: template.name,
  };
}

async function updateTemplate(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { templateId, name, subject, body } = args;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id: String(templateId), userId: context.userId },
  });

  if (!existing) {
    return { success: false, message: "Template not found" };
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (subject) updateData.subject = subject;
  if (body) updateData.body = body;

  const updated = await prisma.emailTemplate.update({
    where: { id: String(templateId) },
    data: updateData,
  });

  return { success: true, templateId: updated.id };
}

async function deleteTemplate(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { templateId } = args;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id: String(templateId), userId: context.userId },
  });

  if (!existing) {
    return { success: false, message: "Template not found" };
  }

  await prisma.emailTemplate.delete({
    where: { id: String(templateId) },
  });

  return { success: true, message: "Template deleted" };
}

export function registerTemplateTools() {
  toolRegistry.register(
    {
      name: "template_list",
      description: "List email templates",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: { type: "number", description: "Max results" },
          offset: { type: "number", description: "Results offset" },
        },
      },
      handler: createToolHandler({ name: "template_list", description: "", inputSchema: {} as never, handler: listTemplates }),
    },
    "templates"
  );

  toolRegistry.register(
    {
      name: "template_get",
      description: "Get template details",
      inputSchema: {
        type: "object" as const,
        properties: {
          templateId: { type: "string", description: "Template ID" },
        },
        required: ["templateId"],
      },
      handler: createToolHandler({ name: "template_get", description: "", inputSchema: {} as never, handler: getTemplate }),
    },
    "templates"
  );

  toolRegistry.register(
    {
      name: "template_create",
      description: "Create email template",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: { type: "string", description: "Template name" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body" },
        },
        required: ["name", "subject", "body"],
      },
      handler: createToolHandler({ name: "template_create", description: "", inputSchema: {} as never, handler: createTemplate }),
    },
    "templates"
  );

  toolRegistry.register(
    {
      name: "template_update",
      description: "Update template",
      inputSchema: {
        type: "object" as const,
        properties: {
          templateId: { type: "string", description: "Template ID" },
          name: { type: "string", description: "Template name" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body" },
        },
        required: ["templateId"],
      },
      handler: createToolHandler({ name: "template_update", description: "", inputSchema: {} as never, handler: updateTemplate }),
    },
    "templates"
  );

  toolRegistry.register(
    {
      name: "template_delete",
      description: "Delete template",
      inputSchema: {
        type: "object" as const,
        properties: {
          templateId: { type: "string", description: "Template ID" },
        },
        required: ["templateId"],
      },
      handler: createToolHandler({ name: "template_delete", description: "", inputSchema: {} as never, handler: deleteTemplate }),
    },
    "templates"
  );
}
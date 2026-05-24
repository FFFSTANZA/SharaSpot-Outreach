import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getOrgScope, orgCreateData } from "../utils/orgScope";

/**
 * POST /api/templates — Create a new email template for the authenticated user.
 */
export const createTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { requirePremium } = await import("../utils/premiumCheck");
    const globalCheck = await requirePremium(req.user!.id);
    if (!globalCheck.allowed) {
      res.status(403).json({
        message: globalCheck.message,
        upgradeRequired: true,
      });
      return;
    }
    const { name, subject, body } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    if (!subject || typeof subject !== "string") {
      res.status(400).json({ message: "Missing required fields: subject" });
      return;
    }

    if (!body || typeof body !== "string") {
      res.status(400).json({ message: "Missing required fields: body" });
      return;
    }

    const template = await prisma.emailTemplate.create({
      data: orgCreateData(req, {
        userId: req.user!.id,
        name: name.trim(),
        subject,
        body,
      }),
    });

    res.status(201).json({ ...template, isSystem: false });
  } catch (error: any) {
    if (error?.code === "P2002") {
      res
        .status(409)
        .json({ message: "A template with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Error processing template request" });
  }
};


/**
 * GET /api/templates — List all templates for the authenticated user,
 * plus system templates available to all users.
 * System templates are read-only and shown with isSystem: true.
 */
export const getTemplates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const [userTemplates, systemTemplates] = await Promise.all([
      prisma.emailTemplate.findMany({
        where: { ...scope },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.emailTemplate.findMany({
        where: { userId: null },
        orderBy: { name: "asc" },
      }),
    ]);

    const templates = [
      ...systemTemplates.map((t) => ({ ...t, isSystem: true })),
      ...userTemplates.map((t) => ({ ...t, isSystem: false })),
    ];

    res.status(200).json(templates);
  } catch (error: any) {
    res.status(500).json({ message: "Error processing template request" });
  }
};

/**
 * PUT /api/templates/:id — Update an existing template.
 * Validates ownership (403) and existence (404).
 */
export const updateTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, subject, body } = req.body;
    const scope = getOrgScope(req);

    const existing = await prisma.emailTemplate.findFirst({ where: { id, ...scope } });

    if (!existing) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
      },
    });

    res.status(200).json({ ...template, isSystem: false });
  } catch (error: any) {
    if (error?.code === "P2002") {
      res
        .status(409)
        .json({ message: "A template with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Error processing template request" });
  }
};

/**
 * DELETE /api/templates/:id — Delete a template.
 * Validates existence (404), ownership (403), and prevents deleting system templates.
 */
export const deleteTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const scope = getOrgScope(req);

    const existing = await prisma.emailTemplate.findFirst({ where: { id, ...scope } });

    if (!existing) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (existing.userId === null) {
      res.status(403).json({ message: "System templates cannot be deleted" });
      return;
    }

    await prisma.emailTemplate.delete({ where: { id } });

    res.status(200).json({ message: "Template deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Error processing template request" });
  }
};

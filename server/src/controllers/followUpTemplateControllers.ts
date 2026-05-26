import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getOrgScope, orgCreateData } from "../utils/orgScope";

function isValidSteps(steps: unknown): boolean {
  return Array.isArray(steps);
}

export const createFollowUpTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, steps } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    if (!isValidSteps(steps)) {
      res.status(400).json({ message: "steps must be an array" });
      return;
    }

    const template = await prisma.followUpTemplate.create({
      data: orgCreateData(req, {
        userId: req.user!.id,
        name: name.trim(),
        description: typeof description === "string" ? description : null,
        steps,
      }),
    });

    res.status(201).json(template);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({ message: "A follow-up template with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Error processing follow-up template request" });
  }
};

export const listFollowUpTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const templates = await prisma.followUpTemplate.findMany({
      where: { ...scope },
      orderBy: { updatedAt: "desc" },
    });
    res.status(200).json(templates);
  } catch {
    res.status(500).json({ message: "Error processing follow-up template request" });
  }
};

export const getFollowUpTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const scope = getOrgScope(req);

    const template = await prisma.followUpTemplate.findFirst({ where: { id, ...scope } });
    if (!template) {
      res.status(404).json({ message: "Follow-up template not found" });
      return;
    }

    res.status(200).json(template);
  } catch {
    res.status(500).json({ message: "Error processing follow-up template request" });
  }
};

export const updateFollowUpTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, steps } = req.body;
    const scope = getOrgScope(req);

    const existing = await prisma.followUpTemplate.findFirst({ where: { id, ...scope } });
    if (!existing) {
      res.status(404).json({ message: "Follow-up template not found" });
      return;
    }

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    if (steps !== undefined && !isValidSteps(steps)) {
      res.status(400).json({ message: "steps must be an array" });
      return;
    }

    const template = await prisma.followUpTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: typeof description === "string" ? description : null } : {}),
        ...(steps !== undefined ? { steps } : {}),
      },
    });

    res.status(200).json(template);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({ message: "A follow-up template with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Error processing follow-up template request" });
  }
};

export const deleteFollowUpTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const scope = getOrgScope(req);

    const existing = await prisma.followUpTemplate.findFirst({ where: { id, ...scope } });
    if (!existing) {
      res.status(404).json({ message: "Follow-up template not found" });
      return;
    }

    await prisma.followUpTemplate.delete({ where: { id } });
    res.status(200).json({ message: "Follow-up template deleted" });
  } catch {
    res.status(500).json({ message: "Error processing follow-up template request" });
  }
};

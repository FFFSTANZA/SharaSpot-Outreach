import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  createMcpApiKey,
  deleteMcpApiKey,
  listMcpApiKeys,
  MCPKeyScope,
  revokeMcpApiKey,
} from "../mcp/services/apiKeyService";
import { logger } from "../utils/logger";

const router = Router();

const MANAGER_ROLES = new Set(["OWNER", "ADMIN"]);

function getScope(req: Request): MCPKeyScope {
  return req.query.scope === "organization" || req.body?.scope === "organization"
    ? "organization"
    : "personal";
}

async function ensureOrganizationAccess(req: Request, res: Response, requireManager: boolean): Promise<string | null> {
  const userId = req.user!.id;
  const organizationId = req.user?.activeOrganizationId;

  if (!organizationId) {
    res.status(400).json({ message: "No active organization selected" });
    return null;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });

  if (!membership) {
    res.status(403).json({ message: "Access denied to this organization" });
    return null;
  }

  if (requireManager && !MANAGER_ROLES.has(membership.role)) {
    res.status(403).json({ message: "Only workspace owners and admins can manage organization MCP keys" });
    return null;
  }

  return organizationId;
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, permissions, expiresAt } = req.body;
    const scope = getScope(req);

    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Key name is required" });
      return;
    }

    const organizationId = scope === "organization"
      ? await ensureOrganizationAccess(req, res, true)
      : null;
    if (scope === "organization" && !organizationId) return;

    let parsedExpiresAt: Date | undefined;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (Number.isNaN(parsedExpiresAt.getTime())) {
        res.status(400).json({ message: "expiresAt must be a valid date" });
        return;
      }
    }

    const result = await createMcpApiKey({
      userId,
      name,
      scope,
      organizationId,
      permissions,
      expiresAt: parsedExpiresAt,
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error({ error }, "Error creating MCP API key:");
    if (error instanceof Error && error.message === "Key name is required") {
      res.status(400).json({ message: error.message });
      return;
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      res.status(409).json({ message: "An API key with this name already exists for your account" });
      return;
    }
    res.status(500).json({ message: "Failed to create API key" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const scope = getScope(req);
    const organizationId = scope === "organization"
      ? await ensureOrganizationAccess(req, res, false)
      : null;
    if (scope === "organization" && !organizationId) return;

    const keys = await listMcpApiKeys({
      userId: req.user!.id,
      scope,
      organizationId,
    });
    res.json(keys);
  } catch (error) {
    logger.error({ error }, "Error listing MCP API keys:");
    res.status(500).json({ message: "Failed to list API keys" });
  }
});

router.patch("/:id/revoke", async (req: Request, res: Response) => {
  try {
    const scope = getScope(req);
    const organizationId = scope === "organization"
      ? await ensureOrganizationAccess(req, res, true)
      : null;
    if (scope === "organization" && !organizationId) return;

    const success = await revokeMcpApiKey({
      userId: req.user!.id,
      keyId: String(req.params.id),
      scope,
      organizationId,
    });

    if (success) {
      res.json({ message: "API key revoked" });
    } else {
      res.status(404).json({ message: "API key not found" });
    }
  } catch (error) {
    logger.error({ error }, "Error revoking MCP API key:");
    res.status(500).json({ message: "Failed to revoke API key" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const scope = getScope(req);
    const organizationId = scope === "organization"
      ? await ensureOrganizationAccess(req, res, true)
      : null;
    if (scope === "organization" && !organizationId) return;

    const success = await deleteMcpApiKey({
      userId: req.user!.id,
      keyId: String(req.params.id),
      scope,
      organizationId,
    });

    if (success) {
      res.json({ message: "API key deleted" });
    } else {
      res.status(404).json({ message: "API key not found" });
    }
  } catch (error) {
    logger.error({ error }, "Error deleting MCP API key:");
    res.status(500).json({ message: "Failed to delete API key" });
  }
});

export default router;

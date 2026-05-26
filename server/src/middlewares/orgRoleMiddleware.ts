import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Routes under /organizations need to stay accessible for switch/leave/create flows.
const ORG_ROUTE_PREFIX = "/organizations";
const ROUTES_WITH_OWN_ROLE_CHECKS = new Set(["/mcp-keys"]);

export const requireOrgWriteAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (READ_METHODS.has(req.method)) {
    next();
    return;
  }

  if (req.path.startsWith(ORG_ROUTE_PREFIX)) {
    next();
    return;
  }

  if (Array.from(ROUTES_WITH_OWN_ROLE_CHECKS).some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }

  const userId = req.user?.id;
  const organizationId = req.user?.activeOrganizationId;

  if (!userId || !organizationId) {
    next();
    return;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });

  if (!membership) {
    res.status(403).json({ message: "Access denied to this organization" });
    return;
  }

  if (membership.role === "VIEWER") {
    res.status(403).json({ message: "Viewer role has read-only access" });
    return;
  }

  next();
};

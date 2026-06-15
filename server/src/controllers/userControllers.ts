import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { checkPremiumStatus } from "../utils/premiumCheck";
import {
  buildTrackingDomain,
  getExpectedTrackingCnameTarget,
  getTrackingDomainScope,
  normalizeRootDomain,
  normalizeSubdomain,
  resolveTrackingCname,
} from "../utils/trackingDomain";

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { isPremium } = await checkPremiumStatus(userId);

    res.json({
      ...user,
      isPremium,
      activeOrganizationId: user.activeOrganizationId,
    });
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred while retrieving user" });
  }
};

export const getUserEmails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const take = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const skip = parseInt(req.query.offset as string) || 0;

    const rows = await prisma.emailJob.findMany({
      where: {
        campaign: {
          userId,
        },
      },
      include: {
        campaign: {
          select: {
            subject: true,
            body: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    const emails = rows.map(({ campaign, ...email }) => ({
      email,
      campaign,
    }));

    res.status(200).json(emails);
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while fetching emails",
    });
  }
};

export const updateUserSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const allowedFields = ["name", "avatarUrl"];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { isPremium } = await checkPremiumStatus(userId);
    res.json({ ...user, isPremium, activeOrganizationId: user.activeOrganizationId });
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred while updating user settings" });
  }
};

export const updateUserName = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const trimmed = name.trim().slice(0, 100);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: trimmed },
    });

    const { isPremium } = await checkPremiumStatus(userId);
    res.json({ ...user, isPremium, activeOrganizationId: user.activeOrganizationId });
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred while updating name" });
  }
};

export const getTrackingDomainSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getTrackingDomainScope(req);
    const setting = await prisma.trackingDomainSetting.findUnique({
      where: { scopeKey: scope.scopeKey },
    });

    res.json({
      trackingDomain: setting,
      expectedCnameTarget: getExpectedTrackingCnameTarget(),
      scope: {
        organizationId: scope.organizationId,
        userId: scope.userId,
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to load tracking domain settings" });
  }
};

export const upsertTrackingDomainSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getTrackingDomainScope(req);
    const rootDomain = normalizeRootDomain(String(req.body.rootDomain || ""));
    const subdomain = normalizeSubdomain(String(req.body.subdomain || ""));

    if (!rootDomain || !subdomain) {
      res.status(400).json({ message: "Root domain and subdomain are required" });
      return;
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(rootDomain)) {
      res.status(400).json({ message: "Invalid root domain" });
      return;
    }

    if (!/^[a-z0-9-]+$/i.test(subdomain)) {
      res.status(400).json({ message: "Invalid tracking subdomain" });
      return;
    }

    const fullDomain = buildTrackingDomain(rootDomain, subdomain);
    const cnameTarget = getExpectedTrackingCnameTarget();

    const setting = await prisma.trackingDomainSetting.upsert({
      where: { scopeKey: scope.scopeKey },
      update: {
        rootDomain,
        subdomain,
        fullDomain,
        cnameTarget,
        status: "PENDING",
        lastCheckedAt: null,
        lastCheckedValue: null,
        verifiedAt: null,
      },
      create: {
        scopeKey: scope.scopeKey,
        userId: scope.userId,
        organizationId: scope.organizationId,
        rootDomain,
        subdomain,
        fullDomain,
        cnameTarget,
        status: "PENDING",
      },
    });

    res.json({
      trackingDomain: setting,
      expectedCnameTarget: cnameTarget,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({ message: "This tracking domain is already in use" });
      return;
    }
    res.status(500).json({ message: "Failed to save tracking domain settings" });
  }
};

export const verifyTrackingDomainSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getTrackingDomainScope(req);
    const existing = await prisma.trackingDomainSetting.findUnique({
      where: { scopeKey: scope.scopeKey },
    });

    if (!existing) {
      res.status(404).json({ message: "Tracking domain settings not found" });
      return;
    }

    const expectedTarget = getExpectedTrackingCnameTarget();
    const resolved = await resolveTrackingCname(existing.fullDomain);
    const matched = resolved.find((value) => value === expectedTarget);
    const status = matched
      ? "VERIFIED"
      : resolved.length > 0
        ? "MISMATCH"
        : "MISSING";

    const updated = await prisma.trackingDomainSetting.update({
      where: { id: existing.id },
      data: {
        cnameTarget: expectedTarget,
        status,
        lastCheckedAt: new Date(),
        lastCheckedValue: resolved[0] || null,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
      },
    });

    res.json({
      trackingDomain: updated,
      expectedCnameTarget: expectedTarget,
      resolvedValues: resolved,
    });
  } catch {
    try {
      const scope = getTrackingDomainScope(req);
      const existing = await prisma.trackingDomainSetting.findUnique({
        where: { scopeKey: scope.scopeKey },
      });

      if (existing) {
        await prisma.trackingDomainSetting.update({
          where: { id: existing.id },
          data: {
            status: "ERROR",
            lastCheckedAt: new Date(),
            lastCheckedValue: null,
            verifiedAt: null,
          },
        });
      }
    } catch {
      // Best-effort: DB may be unavailable during error recovery
    }

    res.status(500).json({ message: "Failed to verify tracking domain" });
  }
};

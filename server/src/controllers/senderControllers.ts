import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { prisma } from "../config/prisma";
import { getOrgScope, orgCreateData } from "../utils/orgScope";
import { encrypt } from "../utils/encryption";
import { detectProvider } from "../utils/providerProfile";
import { DEFAULT_WARMUP_DAILY_LIMITS, isInWarmup } from "../utils/warmupEvaluator";
import { getEffectiveLimits } from "../utils/throttleEngine";
import { getAdaptiveState } from "../utils/adaptiveThrottle";
import { getSentCountToday } from "../utils/dailyLimitTracker";
import {
  classifySmtpError,
  inferProviderKeyFromHost,
  isSenderProviderKey,
  resolveProviderSmtp,
} from "../utils/senderProvider";

// ---------------------------------------------------------------------------
// WHY SMTP verify before save: Verifying credentials upfront prevents storing
// invalid SMTP configs that would silently fail at email-send time, wasting
// campaign jobs and confusing users.
//
// WHY encrypt at rest: App Passwords are sensitive credentials — storing them
// in plain text would expose them if the database is compromised.
//
// WHY per-user scoping: Data isolation ensures users can only access their own
// senders, preventing cross-account data leaks.
//
// WHY connection timeout: Prevents the API from hanging indefinitely when the
// SMTP server is unreachable (e.g., firewall, DNS failure).
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const createSender = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // --- Step 0: Global Premium Check ---
    const { requirePremium } = await import("../utils/premiumCheck");
    const globalCheck = await requirePremium(req.user!.id);
    if (!globalCheck.allowed) {
      res.status(403).json({
        message: globalCheck.message,
        upgradeRequired: true,
      });
      return;
    }
    // Require authenticated user
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { name, email, appPassword, smtpHost, smtpPort, replyTo } = req.body;
    const providerKey = isSenderProviderKey(req.body.providerKey) ? req.body.providerKey : undefined;

    // Validate all required fields are present and non-empty
    const missingFields: string[] = [];
    if (!name || (typeof name === "string" && name.trim() === "")) missingFields.push("name");
    if (!email || (typeof email === "string" && email.trim() === "")) missingFields.push("email");
    if (!appPassword || (typeof appPassword === "string" && appPassword.trim() === "")) missingFields.push("appPassword");

    if (missingFields.length > 0) {
      res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    // Validate email format
    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // Use explicit settings or provider presets with Gmail fallback.
    const { smtpHost: host, smtpPort: port } = resolveProviderSmtp(providerKey, smtpHost, smtpPort);
    const isSecure = port === 465;

    // Create SMTP transporter and verify credentials before saving
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user: normalizedEmail,
        pass: appPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
    } catch (err: any) {
      res.status(400).json({
        message: classifySmtpError(err),
      });
      return;
    }

    // Encrypt the app password before storing
    const profile = await detectProvider(host);
    const encryptedPassword = encrypt(appPassword);
    const optedOut = req.body.skipWarmup === true;
    const sender = await prisma.$transaction(async (tx) => {
      const createdSender = await tx.sender.create({
        data: orgCreateData(req, {
          userId: req.user!.id,
          name: String(name).trim(),
          email: normalizedEmail,
          appPassword: encryptedPassword,
          smtpHost: host,
          smtpPort: port,
          replyTo: typeof replyTo === "string" && replyTo.trim() ? replyTo.trim() : null,
          isVerified: true,
          providerProfileId: profile?.id ?? null,
        }),
      });

      await tx.warmupSchedule.create({
        data: {
          senderId: createdSender.id,
          startDate: new Date(),
          durationDays: 14,
          dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
          isActive: true,
          optedOut,
        },
      });

      return createdSender;
    });

    // Strip appPassword from the response
    const { appPassword: _, ...senderResponse } = sender;
    res.status(201).json(senderResponse);
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({
        message: "A sender with this email already exists for your account",
      });
      return;
    }
    res.status(500).json({
      message: "An error occurred while creating the sender",
    });
  }
};
/**
 * PATCH /senders/:id/verify
 *
 * Updates an existing unverified sender with SMTP credentials.
 * WHY separate from createSender: OAuth-created senders already exist in the DB
 * but lack SMTP credentials. Users need a way to "verify" them without hitting
 * the unique constraint error that createSender would throw.
 */
export const verifySender = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const id = req.params.id as string;
    const { name, appPassword, smtpHost, smtpPort, replyTo } = req.body;
    const providerKey = isSenderProviderKey(req.body.providerKey) ? req.body.providerKey : undefined;

    if (!appPassword || (typeof appPassword === "string" && appPassword.trim() === "")) {
      res.status(400).json({ message: "App password is required" });
      return;
    }

    const scope = getOrgScope(req);
    const existingSender = await prisma.sender.findFirst({
      where: { id, ...scope },
    });

    if (!existingSender) {
      res.status(404).json({ message: "Sender not found" });
      return;
    }

    // Use explicit settings or provider presets, with existing sender as fallback.
    const { smtpHost: host, smtpPort: port } = resolveProviderSmtp(
      providerKey,
      smtpHost,
      smtpPort,
      existingSender.smtpHost || "smtp.gmail.com",
      existingSender.smtpPort || 465
    );
    const isSecure = port === 465;

    // Test SMTP connection with the provided credentials
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user: existingSender.email,
        pass: appPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
    } catch (err: any) {
      res.status(400).json({
        message: classifySmtpError(err),
      });
      return;
    }

    // Encrypt and update the sender
    const profile = await detectProvider(host);
    const encryptedPassword = encrypt(appPassword);
    const hasReplyTo = Object.prototype.hasOwnProperty.call(req.body, "replyTo");
    const replyToValue = hasReplyTo
      ? (typeof replyTo === "string" && replyTo.trim() ? replyTo.trim() : null)
      : existingSender.replyTo;

    const updatedSender = await prisma.$transaction(async (tx) => {
      const sender = await tx.sender.update({
        where: { id },
        data: {
          appPassword: encryptedPassword,
          smtpHost: host,
          smtpPort: port,
          replyTo: replyToValue,
          isVerified: true,
          providerProfileId: profile?.id ?? null,
          ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
        },
      });

      if (!existingSender.isVerified) {
        const existingWarmup = await tx.warmupSchedule.findUnique({
          where: { senderId: id },
        });

        if (!existingWarmup) {
          const optedOut = req.body.skipWarmup === true;
          await tx.warmupSchedule.create({
            data: {
              senderId: id,
              startDate: new Date(),
              durationDays: 14,
              dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
              isActive: true,
              optedOut,
            },
          });
        }
      }

      return sender;
    });

    const { appPassword: _, ...senderResponse } = updatedSender;
    res.status(200).json(senderResponse);
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while verifying the sender",
    });
  }
};

export const getSenders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const senders = await prisma.sender.findMany({
      where: { ...scope },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        smtpHost: true,
        smtpPort: true,
        isVerified: true,
        dailyLimit: true,
        hourlyLimit: true,
        replyTo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch live daily sent counts for all senders in parallel
    const sendersWithStats = await Promise.all(
      senders.map(async (sender) => {
        const currentDailyCount = await getSentCountToday(sender.id);
        return {
          ...sender,
          providerKey: inferProviderKeyFromHost(sender.smtpHost),
          currentDailyCount,
        };
      })
    );

    res.status(200).json(sendersWithStats);
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while fetching senders",
    });
  }
};

export const getSenderEmails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const senders = await prisma.sender.findMany({
      where: { ...scope },
      select: { email: true },
    });

    // Fix: `if (senders)` was always truthy for an empty array.
    // Just map and return directly — empty array returns 200 [].
    const senderEmails = senders.map((sender) => sender.email);

    res.status(200).json(senderEmails);
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while fetching sender emails",
    });
  }
};

/**
 * GET /senders/:id — Get sender detail with throttle information.
 * Includes current hourly count, daily count, daily limit, warmup status,
 * and active cooldown state.
 */
export const getSenderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id, ...scope },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        smtpHost: true,
        smtpPort: true,
        isVerified: true,
        dailyLimit: true,
        hourlyLimit: true,
        replyTo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!sender) {
      res.status(404).json({ message: "Sender not found" });
      return;
    }

    // Compute throttle details
    const now = new Date();
    const hourWindow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0)
    );
    const hourlyAggregate = await prisma.rateLimitCounter.aggregate({
      where: { senderId: id, hourWindow },
      _sum: { count: true },
    });
    const currentHourlyCount = hourlyAggregate._sum.count ?? 0;

    const dailyCount = await getSentCountToday(id);
    const warmupActive = await isInWarmup(id);
    const adaptiveState = await getAdaptiveState(id);
    const limits = await getEffectiveLimits(id);

    // Determine warmup status
    const warmupSchedule = await prisma.warmupSchedule.findUnique({
      where: { senderId: id },
    });
    let warmupStatus: string;
    if (warmupSchedule?.optedOut) {
      warmupStatus = "opted-out";
    } else if (warmupActive) {
      warmupStatus = "active";
    } else {
      warmupStatus = "inactive";
    }

    res.status(200).json({
      ...sender,
      providerKey: inferProviderKeyFromHost(sender.smtpHost),
      currentHourlyCount,
      currentDailyCount: dailyCount,
      effectiveDailyLimit: limits.perDay,
      warmupStatus,
      cooldownState: {
        status: adaptiveState.isCooldown ? "active" : "inactive",
        expiresAt: adaptiveState.cooldownExpiresAt ?? null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while fetching sender",
    });
  }
};

/**
 * PUT /senders/:id — Update sender configuration (name, replyTo, dailyLimit, hourlyLimit, warmup).
 */
export const updateSender = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const scope = getOrgScope(req);
    const existing = await prisma.sender.findFirst({
      where: { id, ...scope },
    });

    if (!existing) {
      res.status(404).json({ message: "Sender not found" });
      return;
    }

    const { name, replyTo, dailyLimit, hourlyLimit, skipWarmup } = req.body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        res.status(400).json({ message: "Name cannot be empty" });
        return;
      }
      data.name = name.trim();
    }

    if (replyTo !== undefined) {
      data.replyTo = typeof replyTo === "string" && replyTo.trim() ? replyTo.trim() : null;
    }

    if (dailyLimit !== undefined) {
      const limit = Number(dailyLimit);
      if (isNaN(limit) || limit < 0 || limit > 10000) {
        res.status(400).json({ message: "Daily limit must be between 0 and 10000" });
        return;
      }
      data.dailyLimit = limit;
    }

    if (hourlyLimit !== undefined) {
      const limit = Number(hourlyLimit);
      if (isNaN(limit) || limit < 0 || limit > 1000) {
        res.status(400).json({ message: "Hourly limit must be between 0 and 1000" });
        return;
      }
      data.hourlyLimit = limit;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sender = await tx.sender.update({
        where: { id },
        data,
        select: {
          id: true,
          userId: true,
          email: true,
          name: true,
          smtpHost: true,
          smtpPort: true,
          isVerified: true,
          dailyLimit: true,
          hourlyLimit: true,
          replyTo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (skipWarmup !== undefined) {
        const existingWarmup = await tx.warmupSchedule.findUnique({
          where: { senderId: id },
        });
        if (existingWarmup) {
          await tx.warmupSchedule.update({
            where: { senderId: id },
            data: { optedOut: skipWarmup === true },
          });
        }
      }

      return sender;
    });

    res.status(200).json({
      ...updated,
      providerKey: inferProviderKeyFromHost(updated.smtpHost),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while updating the sender",
    });
  }
};

/**
 * DELETE /senders/:id — Delete a sender account.
 */
export const deleteSender = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id, ...scope }
    });

    if (!sender) {
      res.status(404).json({ message: "Sender not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.emailCampaign.updateMany({
        where: {
          OR: [
            { senderId: id },
            { campaignSenders: { some: { senderId: id } } },
          ],
          status: { in: ["SCHEDULED", "SENDING"] },
          ...scope,
        },
        data: {
          status: "PAUSED",
          pauseReason: `Sender ${sender.email} removed`,
        },
      });

      await tx.emailCampaign.updateMany({
        where: { senderId: id, ...scope },
        data: { senderId: null },
      });

      await tx.emailJob.updateMany({
        where: { senderId: id, campaign: { ...scope } },
        data: { senderId: null },
      });

      await tx.campaignSender.deleteMany({
        where: { senderId: id, campaign: { ...scope } },
      });

      await tx.warmupSchedule.deleteMany({ where: { senderId: id } });
      await tx.senderCooldown.deleteMany({ where: { senderId: id } });

      await tx.sender.delete({ where: { id } });
    });

    res.status(200).json({ message: "Sender deleted successfully" });
  } catch (error: any) {
    if (error?.code === "P2003") {
      res.status(409).json({
        message: "Sender is still linked to historical records and cannot be deleted yet.",
      });
      return;
    }
    res.status(500).json({
      message: "An error occurred while deleting sender",
    });
  }
};

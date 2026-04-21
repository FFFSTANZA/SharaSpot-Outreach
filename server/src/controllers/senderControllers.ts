import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { prisma } from "../config/prisma";
import { encrypt } from "../utils/encryption";
import { detectProvider } from "../utils/providerProfile";
import { DEFAULT_WARMUP_DAILY_LIMITS, isInWarmup } from "../utils/warmupEvaluator";
import { getEffectiveLimits } from "../utils/throttleEngine";
import { getAdaptiveState } from "../utils/adaptiveThrottle";
import { getSentCountToday } from "../utils/dailyLimitTracker";

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
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // Use provided SMTP settings or default to Gmail
    const host = smtpHost || "smtp.gmail.com";
    const port = smtpPort || 465;
    const isSecure = port === 465;

    // Create SMTP transporter and verify credentials before saving
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user: email,
        pass: appPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
    } catch (err: any) {
      res.status(400).json({
        message: `SMTP Verification failed: ${err.message || "Invalid credentials"}`,
      });
      return;
    }

    // Encrypt the app password before storing
    const encryptedPassword = encrypt(appPassword);

    const sender = await prisma.sender.create({
      data: {
        name,
        email,
        appPassword: encryptedPassword,
        smtpHost: host,
        smtpPort: port,
        replyTo: replyTo || null,
        isVerified: true,
        userId: req.user.id,
      },
    });

    // Auto-detect provider from SMTP host and associate the profile
    const profile = await detectProvider(host);
    if (profile) {
      await prisma.sender.update({
        where: { id: sender.id },
        data: { providerProfileId: profile.id },
      });
      sender.providerProfileId = profile.id;
    }

    // Create WarmupSchedule for newly verified sender
    const optedOut = req.body.skipWarmup === true;
    await prisma.warmupSchedule.create({
      data: {
        senderId: sender.id,
        startDate: new Date(),
        durationDays: 14,
        dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
        isActive: true,
        optedOut,
      },
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

    if (!appPassword || (typeof appPassword === "string" && appPassword.trim() === "")) {
      res.status(400).json({ message: "App password is required" });
      return;
    }

    // Verify the sender belongs to the authenticated user
    const existingSender = await prisma.sender.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingSender) {
      res.status(404).json({ message: "Sender not found" });
      return;
    }

    // Use provided SMTP settings, fall back to existing stored values, or default to Gmail
    const host = smtpHost || existingSender.smtpHost || "smtp.gmail.com";
    const port = smtpPort || existingSender.smtpPort || 465;
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
        message: `SMTP Verification failed: ${err.message || "Invalid credentials"}`,
      });
      return;
    }

    // Encrypt and update the sender
    const encryptedPassword = encrypt(appPassword);

    const updatedSender = await prisma.sender.update({
      where: { id },
      data: {
        appPassword: encryptedPassword,
        smtpHost: host,
        smtpPort: port,
        replyTo: replyTo || existingSender.replyTo,
        isVerified: true,
        ...(name ? { name } : {}),
      },
    });

    // Auto-detect provider from SMTP host and associate the profile
    const profile = await detectProvider(host);
    if (profile) {
      await prisma.sender.update({
        where: { id },
        data: { providerProfileId: profile.id },
      });
      updatedSender.providerProfileId = profile.id;
    }

    // Create WarmupSchedule when isVerified transitions to true
    if (!existingSender.isVerified) {
      const existingWarmup = await prisma.warmupSchedule.findUnique({
        where: { senderId: id },
      });

      if (!existingWarmup) {
        const optedOut = req.body.skipWarmup === true;
        await prisma.warmupSchedule.create({
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
    const senders = await prisma.sender.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        smtpHost: true,
        smtpPort: true,
        isVerified: true,
        dailyLimit: true,
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
    // Only select the email field — no appPassword leak possible
    const senders = await prisma.sender.findMany({
      where: { userId: req.user!.id },
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

    const sender = await prisma.sender.findFirst({
      where: { id, userId: req.user.id },
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

    // Check if sender exists and belongs to user
    const sender = await prisma.sender.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!sender) {
      res.status(404).json({ message: "Sender not found" });
      return;
    }

    // Delete sender (cascades or manual depending on schema settings)
    await prisma.sender.delete({
      where: { id }
    });

    res.status(200).json({ message: "Sender deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while deleting sender",
    });
  }
};

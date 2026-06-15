import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getOrgScope } from "../utils/orgScope";
import {
  syncInboxForSender as syncService,
  getInboxEmails as getEmailsService,
  getInboxThreads as getThreadsService,
  sendInboxReply as replyService,
  markInboxEmailRead as markReadService,
  toggleInboxEmailStar as toggleStarService,
  archiveInboxEmail as archiveService,
  deleteInboxEmail as deleteService,
} from "../utils/inboxService";
import { logger } from "../utils/logger";

function extractString(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val[0] || "";
  return String(val);
}

function extractBoolean(val: any): boolean {
  const str = extractString(val).toLowerCase();
  return str === "1" || str === "true" || str === "yes";
}

function extractPositiveInt(val: any, fallback: number): number {
  const parsed = parseInt(extractString(val), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export const getInboxThreads = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const query = req.query as any;
    let senderId = extractString(query.senderId);

    if (!senderId) {
      const senders = await prisma.sender.findMany({
        where: { ...scope },
        select: { id: true },
        take: 1,
      });
      
      if (senders.length === 0) {
        res.status(200).json({ threads: [], total: 0 });
        return;
      }
      senderId = senders[0].id;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: senderId, ...scope },
      select: { userId: true },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const page = extractPositiveInt(query.page, 1);
    const limit = Math.min(extractPositiveInt(query.limit, 20), 100);
    const unreadOnly = extractBoolean(query.unreadOnly);
    const starredOnly = extractBoolean(query.starredOnly);
    const archivedOnly = extractBoolean(query.archivedOnly);
    const search = extractString(query.search);
    const result = await getThreadsService(senderId, {
      page,
      limit,
      unreadOnly,
      starredOnly,
      archivedOnly,
      search,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, "[Inbox] getInboxThreads error");
    res.status(500).json({ message: "Error fetching inbox threads" });
  }
};

export const getInboxEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const query = req.query as any;
    let senderId = extractString(query.senderId);

    if (!senderId) {
      const senders = await prisma.sender.findMany({
        where: { ...scope },
        select: { id: true },
        take: 1,
      });
      
      if (senders.length === 0) {
        res.status(200).json({ emails: [], total: 0 });
        return;
      }
      senderId = senders[0].id;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: senderId, ...scope },
      select: { userId: true },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const folder = extractString(query.folder) || "INBOX";
    const page = extractPositiveInt(query.page, 1);
    const limit = Math.min(extractPositiveInt(query.limit, 20), 100);
    const unreadOnly = extractBoolean(query.unreadOnly);
    const starredOnly = extractBoolean(query.starredOnly);
    const archivedOnly = extractBoolean(query.archivedOnly);
    const threadId = extractString(query.threadId);
    const search = extractString(query.search);
    const result = await getEmailsService(senderId, {
      folder,
      page,
      limit,
      unreadOnly,
      starredOnly,
      archivedOnly,
      threadId: threadId || undefined,
      search,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, "[Inbox] getInboxEmails error");
    res.status(500).json({ message: "Error fetching inbox emails" });
  }
};

export const syncInboxForSender = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as any;
    const senderId = extractString(body.senderId);

    if (!senderId) {
      res.status(400).json({ message: "senderId is required" });
      return;
    }

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id: senderId, ...scope },
      select: { email: true, appPassword: true, connectionType: true, smtpHost: true },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Debug: Return sender info (without password)
    const result = await syncService(senderId);
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, "[Inbox] syncInboxForSender error");
    res.status(500).json({ message: "Error syncing inbox" });
  }
};

export const sendInboxReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as any;
    const senderId = extractString(body.senderId);
    const toEmail = extractString(body.toEmail);
    const subject = extractString(body.subject);
    const bodyText = extractString(body.body);
    const inReplyToMessageId = extractString(body.inReplyToMessageId);
    const threadId = extractString(body.threadId);

    if (!senderId || !toEmail || !subject || !bodyText) {
      res.status(400).json({ message: "senderId, toEmail, subject, and body are required" });
      return;
    }

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id: senderId, ...scope },
      select: { userId: true },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = await replyService(senderId, toEmail, subject, bodyText, inReplyToMessageId, threadId);
    if (!result.success) {
      res.status(400).json({ message: result.error || "Failed to send reply" });
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error }, "[Inbox] sendInboxReply error");
    res.status(500).json({ message: "Error sending reply" });
  }
};

export const markInboxEmailRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, ...scope },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await markReadService(emailId);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, "[Inbox] markInboxEmailRead error");
    res.status(500).json({ message: "Error marking email as read" });
  }
};

export const toggleInboxEmailStar = async (req: Request, res: Response): Promise<void> => {
  try {
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, ...scope },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const isStarred = await toggleStarService(emailId);
    res.status(200).json({ isStarred });
  } catch (error) {
    logger.error({ error }, "[Inbox] toggleInboxEmailStar error");
    res.status(500).json({ message: "Error toggling star" });
  }
};

export const archiveInboxEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, ...scope },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await archiveService(emailId);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, "[Inbox] archiveInboxEmail error");
    res.status(500).json({ message: "Error archiving email" });
  }
};

export const deleteInboxEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const scope = getOrgScope(req);
    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, ...scope },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await deleteService(emailId);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, "[Inbox] deleteInboxEmail error");
    res.status(500).json({ message: "Error deleting email" });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = getOrgScope(req);
    const query = req.query as any;
    let senderId = extractString(query.senderId);

    if (!senderId) {
      const senders = await prisma.sender.findMany({
        where: { ...scope },
        select: { id: true },
        take: 1,
      });
      
      if (senders.length === 0) {
        res.status(200).json({ unreadCount: 0 });
        return;
      }
      senderId = senders[0].id;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: senderId, ...scope },
      select: { userId: true },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const unreadCount = await prisma.inboxEmail.count({
      where: { senderId, isRead: false, isDeleted: false },
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    logger.error({ error }, "[Inbox] getUnreadCount error");
    res.status(500).json({ message: "Error fetching unread count" });
  }
};

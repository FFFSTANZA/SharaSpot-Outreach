import { Request, Response } from "express";
import { prisma } from "../config/prisma";
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

function extractString(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val[0] || "";
  return String(val);
}

export const getInboxThreads = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query as any;
    let senderId = extractString(query.senderId);

    if (!senderId) {
      const senders = await prisma.sender.findMany({
        where: { userId },
        select: { id: true },
        take: 1,
      });
      
      if (senders.length === 0) {
        res.status(200).json({ threads: [], total: 0 });
        return;
      }
      senderId = senders[0].id;
    }

    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      select: { userId: true },
    });

    if (!sender || sender.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const page = parseInt(extractString(query.page)) || 1;
    const limit = parseInt(extractString(query.limit)) || 20;
    const result = await getThreadsService(senderId, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    console.error("[Inbox] getInboxThreads error:", error);
    res.status(500).json({ message: "Error fetching inbox threads" });
  }
};

export const getInboxEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query as any;
    let senderId = extractString(query.senderId);

    if (!senderId) {
      const senders = await prisma.sender.findMany({
        where: { userId },
        select: { id: true },
        take: 1,
      });
      
      if (senders.length === 0) {
        res.status(200).json({ emails: [], total: 0 });
        return;
      }
      senderId = senders[0].id;
    }

    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      select: { userId: true },
    });

    if (!sender || sender.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const folder = extractString(query.folder) || "INBOX";
    const page = parseInt(extractString(query.page)) || 1;
    const limit = parseInt(extractString(query.limit)) || 20;
    const result = await getEmailsService(senderId, { folder, page, limit });
    res.status(200).json(result);
  } catch (error) {
    console.error("[Inbox] getInboxEmails error:", error);
    res.status(500).json({ message: "Error fetching inbox emails" });
  }
};

export const syncInboxForSender = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const body = req.body as any;
    const senderId = extractString(body.senderId);

    if (!senderId) {
      res.status(400).json({ message: "senderId is required" });
      return;
    }

    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      select: { userId: true, email: true, appPassword: true, connectionType: true, smtpHost: true },
    });

    if (!sender || sender.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Debug: Return sender info (without password)
    const result = await syncService(senderId);
    res.status(200).json(result);
  } catch (error) {
    console.error("[Inbox] syncInboxForSender error:", error);
    res.status(500).json({ message: "Error syncing inbox" });
  }
};

export const sendInboxReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
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

    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      select: { userId: true },
    });

    if (!sender || sender.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = await replyService(senderId, toEmail, subject, bodyText, inReplyToMessageId, threadId);
    res.status(200).json(result);
  } catch (error) {
    console.error("[Inbox] sendInboxReply error:", error);
    res.status(500).json({ message: "Error sending reply" });
  }
};

export const markInboxEmailRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, userId },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await markReadService(emailId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Inbox] markInboxEmailRead error:", error);
    res.status(500).json({ message: "Error marking email as read" });
  }
};

export const toggleInboxEmailStar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, userId },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const isStarred = await toggleStarService(emailId);
    res.status(200).json({ isStarred });
  } catch (error) {
    console.error("[Inbox] toggleInboxEmailStar error:", error);
    res.status(500).json({ message: "Error toggling star" });
  }
};

export const archiveInboxEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, userId },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await archiveService(emailId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Inbox] archiveInboxEmail error:", error);
    res.status(500).json({ message: "Error archiving email" });
  }
};

export const deleteInboxEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const emailId = extractString(req.params.emailId);

    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    const sender = await prisma.sender.findFirst({
      where: { id: email.senderId, userId },
    });

    if (!sender) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await deleteService(emailId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Inbox] deleteInboxEmail error:", error);
    res.status(500).json({ message: "Error deleting email" });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query as any;
    let senderId = extractString(query.senderId);

    if (!senderId) {
      const senders = await prisma.sender.findMany({
        where: { userId },
        select: { id: true },
        take: 1,
      });
      
      if (senders.length === 0) {
        res.status(200).json({ unreadCount: 0 });
        return;
      }
      senderId = senders[0].id;
    }

    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      select: { userId: true },
    });

    if (!sender || sender.userId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const unreadCount = await prisma.inboxEmail.count({
      where: { senderId, isRead: false, isDeleted: false },
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("[Inbox] getUnreadCount error:", error);
    res.status(500).json({ message: "Error fetching unread count" });
  }
};
import { prisma } from "../config/prisma";
import { decrypt } from "./encryption";
import { InboxConnectionType } from "@prisma/client";
import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import nodemailer from "nodemailer";

function decodeQuotedPrintable(str: string): string {
  if (!str) return "";
  // 1. Remove soft line breaks (standard QP)
  let result = str.replace(/=\r?\n/g, "").replace(/=\n/g, "");
  // 2. Decode hex octets
  result = result.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  return result;
}

const IMAP_CONFIGS: Record<string, { host: string; port: number; tls: boolean }> = {
  "smtp.gmail.com": { host: "imap.gmail.com", port: 993, tls: true },
  "smtp.office365.com": { host: "outlook.office365.com", port: 993, tls: true },
  "smtp-mail.outlook.com": { host: "outlook.office365.com", port: 993, tls: true },
  "smtp.zoho.com": { host: "imap.zoho.com", port: 993, tls: true },
  "smtp.mail.yahoo.com": { host: "imap.mail.yahoo.com", port: 993, tls: true },
};

function getImapConfig(smtpHost: string): { host: string; port: number; tls: boolean } {
  return IMAP_CONFIGS[smtpHost] ?? { host: `imap.${smtpHost.replace("smtp.", "")}`, port: 993, tls: true };
}

export interface ParsedInboxEmail {
  messageId: string;
  inReplyTo: string | null;
  references: string | null;
  threadId: string | null;
  fromName: string | null;
  fromEmail: string;
  toName: string | null;
  toEmail: string;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string;
  receivedAt: Date;
  folder: string;
}

export async function syncInboxForSender(senderId: string): Promise<{ synced: number; errors: string[] }> {
  console.log("[InboxSync] Starting for senderId:", senderId);
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
    include: { user: true },
  });

  console.log("[InboxSync] Sender found:", sender?.email, "connectionType:", sender?.connectionType);

  if (!sender) {
    return { synced: 0, errors: ["Sender not found"] };
  }

  if (sender.connectionType === InboxConnectionType.GMAIL_API) {
    return syncViaGmailApi(sender);
  }

  if (sender.connectionType === InboxConnectionType.MICROSOFT_GRAPH) {
    return syncViaMicrosoftGraph(sender);
  }

  return syncViaImap(sender);
}

async function syncViaImap(sender: any): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    console.log("[InboxSync] Attempting IMAP sync...");
    const decryptedPassword = decrypt(sender.appPassword);
    console.log("[InboxSync] Password decrypted successfully");

    const imapConfig = getImapConfig(sender.smtpHost);
    console.log("[InboxSync] IMAP config:", imapConfig);

    const emails = await fetchRecentInboxMessages(
      imapConfig,
      sender.email,
      decryptedPassword,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days instead of 7
    );
    console.log("[InboxSync] Fetched", emails.length, "emails from IMAP");

    for (const email of emails) {
      try {
        if (!email.messageId || email.messageId.includes("@local>")) {
          const existingEmail = await prisma.inboxEmail.findFirst({
            where: {
              senderId: sender.id,
              subject: email.subject || "",
              fromEmail: email.fromEmail || "",
            },
            orderBy: { receivedAt: "desc" },
            take: 1,
          });
          if (existingEmail) {
            continue;
          }
        }

        await prisma.inboxEmail.upsert({
          where: { senderId_messageId: { senderId: sender.id, messageId: email.messageId } },
          create: {
            senderId: sender.id,
            messageId: email.messageId,
            inReplyTo: email.inReplyTo,
            references: email.references,
            threadId: email.threadId,
            fromName: email.fromName,
            fromEmail: email.fromEmail,
            toName: email.toName,
            toEmail: email.toEmail,
            subject: email.subject,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            snippet: email.snippet,
            folder: email.folder,
            receivedAt: email.receivedAt,
          },
          update: {
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            snippet: email.snippet,
          },
        });
        syncedCount++;
      } catch (upsertErr) {
        errors.push(`Failed to upsert ${email.messageId}: ${upsertErr}`);
      }
    }

    await prisma.inboxThread.updateMany({
      where: { senderId: sender.id },
      data: { lastMessageAt: new Date() },
    });
  } catch (err: any) {
    errors.push(`IMAP sync failed: ${err.message || err}`);
    console.log("[InboxSync] IMAP ERROR:", err.message);
  }

  return { synced: syncedCount, errors };
}

async function syncViaGmailApi(sender: any): Promise<{ synced: number; errors: string[] }> {
  return { synced: 0, errors: ["Gmail API not yet implemented"] };
}

async function syncViaMicrosoftGraph(sender: any): Promise<{ synced: number; errors: string[] }> {
  return { synced: 0, errors: ["Microsoft Graph not yet implemented"] };
}

async function fetchRecentInboxMessages(
  imapConfig: { host: string; port: number; tls: boolean },
  email: string,
  password: string,
  since: Date
): Promise<ParsedInboxEmail[]> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password,
      host: imapConfig.host,
      port: imapConfig.port,
      tls: imapConfig.tls,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 15000,
    });

    const messages: ParsedInboxEmail[] = [];

    imap.once("error", (err: Error) => {
      reject(err);
    });

    imap.once("ready", () => {
      console.log("[InboxSync] IMAP connected, opening INBOX...");
      imap.openBox("INBOX", true, (err: Error | null, box: any) => {
        if (err) {
          console.log("[InboxSync] Error opening INBOX:", err.message);
          imap.end();
          reject(err);
          return;
        }
        console.log("[InboxSync] INBOX opened, messages:", box.messages.total);

        const sinceStr = since.toISOString().split("T")[0];
        imap.search([["SINCE", sinceStr]], (err: Error | null, results: number[]) => {
          if (err || !results || results.length === 0) {
            console.log("[InboxSync] No emails found since", sinceStr);
            imap.end();
            resolve(messages);
            return;
          }

          console.log("[InboxSync] Found", results.length, "emails");
          const toFetch = results.slice(-100);
          const fetch = imap.fetch(toFetch, { bodies: "", struct: true });
          const parsePromises: Promise<void>[] = [];

          fetch.on("message", (msg: Imap.ImapMessage) => {
            const seqNo = (msg as any).seqno || 0;

            msg.on("body", (stream: NodeJS.ReadableStream) => {
              const parsePromise = simpleParser(stream).then(async (parsed: ParsedMail) => {
                try {
                  const fromValue = (parsed.from as any)?.value;
                  const fromParts = Array.isArray(fromValue) ? fromValue[0] : fromValue;
                  const toValue = (parsed.to as any)?.value;
                  const toParts = Array.isArray(toValue) ? toValue[0] : toValue;

                  // Get text content - prefer plain text
                  let bodyText = parsed.text || "";
                  let bodyHtml = parsed.html || null;

                  // If no text but have HTML, create a text fallback
                  if (!bodyText && bodyHtml) {
                    bodyText = (bodyHtml as string).replace(/<[^>]*>/g, " ").substring(0, 50000);
                  }

                  // Safety check: if content still looks like Quoted-Printable (very common with some providers)
                  if (bodyText.includes("=3D") || bodyText.includes("=20")) {
                    bodyText = decodeQuotedPrintable(bodyText);
                  }
                  if (bodyHtml && (bodyHtml as string).includes("=3D")) {
                    bodyHtml = decodeQuotedPrintable(bodyHtml as string);
                  }

                  messages.push({
                    messageId: parsed.messageId || `<${Date.now()}-${seqNo}@local>`,
                    inReplyTo: Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo.join(" ") : (parsed.inReplyTo ?? null),
                    references: Array.isArray(parsed.references) ? parsed.references.join(" ") : (parsed.references ?? null),
                    threadId: null,
                    fromName: fromParts?.name || null,
                    fromEmail: fromParts?.address || "",
                    toName: toParts?.name || null,
                    toEmail: toParts?.address || "",
                    subject: parsed.subject || "",
                    bodyText: bodyText,
                    bodyHtml: bodyHtml as string | null,
                    snippet: bodyText ? bodyText.substring(0, 250).replace(/\s+/g, " ").trim() : "",
                    receivedAt: parsed.date ? new Date(parsed.date) : new Date(),
                    folder: "INBOX",
                  });
                } catch (parseErr) {
                  console.error("[InboxService] Failed to process parsed email:", parseErr);
                }
              }).catch(err => {
                console.error("[InboxService] simpleParser failed:", err);
              });

              parsePromises.push(parsePromise);
            });
          });

          fetch.once("error", (err: Error) => {
            imap.end();
            reject(err);
          });

          fetch.once("end", async () => {
            await Promise.all(parsePromises);
            imap.end();
            resolve(messages);
          });
        });
      });
    });

    imap.connect();
  });
}

export async function sendInboxReply(
  senderId: string,
  toEmail: string,
  subject: string,
  body: string,
  inReplyToMessageId?: string,
  threadId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
  });

  if (!sender) {
    return { success: false, error: "Sender not found" };
  }

  try {
    const decryptedPassword = decrypt(sender.appPassword);

    const transporter = nodemailer.createTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      secure: sender.smtpPort === 465,
      auth: {
        user: sender.email,
        pass: decryptedPassword,
      },
    });

    const mailOptions: any = {
      from: sender.name ? `"${sender.name}" <${sender.email}>` : sender.email,
      to: toEmail,
      subject: subject,
      text: body,
    };

    if (inReplyToMessageId) {
      mailOptions.inReplyTo = inReplyToMessageId;
    }

    if (threadId) {
      mailOptions.headers = {
        "Thread-Id": threadId,
      };
    }

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to send email",
    };
  }
}

export async function getInboxEmails(
  senderId: string,
  options: {
    folder?: string;
    unreadOnly?: boolean;
    starredOnly?: boolean;
    archivedOnly?: boolean;
    threadId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ emails: any[]; total: number }> {
  const {
    folder = "INBOX",
    unreadOnly = false,
    starredOnly = false,
    archivedOnly = false,
    threadId,
    search,
    page = 1,
    limit = 20,
  } = options;

  const where: any = {
    senderId,
    isDeleted: false,
  };

  if (threadId) {
    where.threadId = threadId;
  } else if (!archivedOnly) {
    where.folder = folder;
  }

  if (unreadOnly) {
    where.isRead = false;
  }
  if (starredOnly) {
    where.isStarred = true;
  }
  if (archivedOnly) {
    where.isArchived = true;
  } else {
    where.isArchived = false;
  }
  if (search && search.trim().length > 0) {
    const q = search.trim();
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { fromName: { contains: q, mode: "insensitive" } },
      { fromEmail: { contains: q, mode: "insensitive" } },
      { toEmail: { contains: q, mode: "insensitive" } },
      { snippet: { contains: q, mode: "insensitive" } },
      { bodyText: { contains: q, mode: "insensitive" } },
    ];
  }

  const [emails, total] = await Promise.all([
    prisma.inboxEmail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inboxEmail.count({ where }),
  ]);

  return { emails, total };
}

export async function getInboxThreads(
  senderId: string,
  options: {
    unreadOnly?: boolean;
    starredOnly?: boolean;
    archivedOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ threads: any[]; total: number }> {
  const {
    unreadOnly = false,
    starredOnly = false,
    archivedOnly = false,
    search,
    page = 1,
    limit = 20,
  } = options;

  const emailWhere: any = {
    senderId,
    isDeleted: false,
    isArchived: archivedOnly ? true : false,
  };

  if (unreadOnly) {
    emailWhere.isRead = false;
  }
  if (starredOnly) {
    emailWhere.isStarred = true;
  }
  if (search && search.trim().length > 0) {
    const q = search.trim();
    emailWhere.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { fromName: { contains: q, mode: "insensitive" } },
      { fromEmail: { contains: q, mode: "insensitive" } },
      { toEmail: { contains: q, mode: "insensitive" } },
      { snippet: { contains: q, mode: "insensitive" } },
    ];
  }

  const emails = await prisma.inboxEmail.findMany({
    where: emailWhere,
    orderBy: { receivedAt: "desc" },
    take: 300,
  });

  const grouped = new Map<string, any[]>();
  for (const email of emails) {
    const key = email.threadId || `${email.fromEmail.toLowerCase()}::${(email.subject || "").trim().toLowerCase()}` || email.id;
    const bucket = grouped.get(key) || [];
    bucket.push(email);
    grouped.set(key, bucket);
  }

  const computedThreads = Array.from(grouped.entries()).map(([key, bucket]) => {
    const sorted = bucket.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
    const latest = sorted[0];
    const participants = Array.from(new Set(sorted.flatMap((e) => [e.fromEmail, e.toEmail]).filter(Boolean)));
    return {
      id: key,
      senderId,
      threadId: latest.threadId || key,
      subject: latest.subject || "No subject",
      participants,
      lastMessageAt: latest.receivedAt,
      lastSnippet: latest.snippet || latest.bodyText || "",
      lastSenderEmail: latest.fromEmail || null,
      unreadCount: sorted.filter((e) => !e.isRead).length,
      hasAttachments: false,
      isStarred: sorted.some((e) => e.isStarred),
      fromName: latest.fromName,
      fromEmail: latest.fromEmail,
      snippet: latest.snippet || "",
      status: latest.isArchived ? "ARCHIVED" : "ACTIVE",
    };
  });

  computedThreads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  const total = computedThreads.length;
  const threads = computedThreads.slice((page - 1) * limit, (page - 1) * limit + limit);
  return { threads, total };
}

export async function markInboxEmailRead(emailId: string): Promise<void> {
  await prisma.inboxEmail.update({
    where: { id: emailId },
    data: { isRead: true },
  });
}

export async function toggleInboxEmailStar(emailId: string): Promise<boolean> {
  const email = await prisma.inboxEmail.findUnique({
    where: { id: emailId },
    select: { isStarred: true },
  });

  if (!email) return false;

  await prisma.inboxEmail.update({
    where: { id: emailId },
    data: { isStarred: !email.isStarred },
  });

  return !email.isStarred;
}

export async function archiveInboxEmail(emailId: string): Promise<void> {
  await prisma.inboxEmail.update({
    where: { id: emailId },
    data: { isArchived: true },
  });
}

export async function deleteInboxEmail(emailId: string): Promise<void> {
  await prisma.inboxEmail.update({
    where: { id: emailId },
    data: { isDeleted: true },
  });
}

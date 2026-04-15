/**
 * IMAP Reply Detector — Optimized
 *
 * Three-tier optimization:
 *
 * 1. HEADER-ONLY FETCH: Only downloads email headers first. Body is fetched
 *    conditionally only if headers indicate a real reply (In-Reply-To/References
 *    or Re: subject matching a sent campaign). Reduces RAM by ~80%.
 *
 * 2. IMAP IDLE (PUSH): Instead of polling every 5 minutes, keeps persistent
 *    IMAP connections open with IDLE command. Mail servers push new mail
 *    notifications in real-time. Near-zero CPU when idle, instant reply detection.
 *
 * 3. ADAPTIVE CONNECTIONS: Only maintains IDLE connections for senders who
 *    have had emails sent in the last ADAPTIVE_POLL_WINDOW_HOURS (default 48h).
 *    Idle senders are disconnected to conserve resources.
 *
 * Matching strategy:
 * - Primary: Match by Message-ID in In-Reply-To or References headers
 * - Secondary: Match by recipient email + subject similarity
 * - Fallback: Match by recipient email + date proximity
 *
 * The detector runs on a configurable interval (default: every 5 minutes)
 * via a repeatable BullMQ job for fallback scanning. IMAP IDLE provides
 * real-time detection between polls.
 */

import { prisma } from "../config/prisma";
import { decrypt } from "../utils/encryption";
import { logContactActivityByEmail, updateContactStageByEmail } from "../utils/contactService";
import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

const REPLY_CHECK_INTERVAL_MS = parseInt(
  process.env.REPLY_CHECK_INTERVAL_MS || "300000",
  10,
);

const REPLY_LOOKBACK_HOURS = parseInt(
  process.env.REPLY_LOOKBACK_HOURS || "24",
  10,
);

const ADAPTIVE_POLL_WINDOW_HOURS = parseInt(
  process.env.ADAPTIVE_POLL_WINDOW_HOURS || "48",
  10,
);

const POOL_REUSE_MS = parseInt(
  process.env.IMAP_POOL_REUSE_MS || "45000",
  10,
);

const IDLE_TIMEOUT_MS = parseInt(
  process.env.IMAP_IDLE_TIMEOUT_MS || "1740000",
  10,
);

interface ParsedMessage {
  messageId: string;
  inReplyTo: string;
  references: string;
  from: string;
  subject: string;
  date: Date;
  bodyPreview: string;
}

interface HeaderOnly {
  messageId: string;
  inReplyTo: string;
  references: string;
  from: string;
  subject: string;
  date: Date;
  seqNo: number;
}

interface SentJobInfo {
  id: string;
  toEmail: string;
  messageId: string | null;
  subject: string;
  campaignId: string;
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

// ---------------------------------------------------------------------------
// IMAP Connection Pool
// ---------------------------------------------------------------------------

interface PoolEntry {
  imap: Imap;
  expiresAt: number;
  inUse: boolean;
}

const imapPool = new Map<string, PoolEntry>();

function getPoolKey(email: string): string {
  return email.toLowerCase();
}

function acquireConnection(
  imapConfig: { host: string; port: number; tls: boolean },
  email: string,
  password: string,
): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const key = getPoolKey(email);
    const existing = imapPool.get(key);

    if (existing && !existing.inUse && Date.now() < existing.expiresAt) {
      existing.inUse = true;
      resolve(existing.imap);
      return;
    }

    if (existing) {
      existing.imap.end();
      imapPool.delete(key);
    }

    const imap = new Imap({
      user: email,
      password,
      host: imapConfig.host,
      port: imapConfig.port,
      tls: imapConfig.tls,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 15000,
    });

    imap.once("error", (err: Error) => {
      imapPool.delete(key);
      reject(err);
    });

    imap.once("end", () => {
      imapPool.delete(key);
    });

    imap.connect();

    imap.once("ready", () => {
      imapPool.set(key, {
        imap,
        expiresAt: Date.now() + POOL_REUSE_MS,
        inUse: true,
      });
      resolve(imap);
    });
  });
}

function releaseConnection(email: string): void {
  const key = getPoolKey(email);
  const entry = imapPool.get(key);
  if (entry) {
    entry.inUse = false;
  }
}

function evictExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of imapPool.entries()) {
    if (!entry.inUse && now >= entry.expiresAt) {
      entry.imap.end();
      imapPool.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Two-Phase Fetch: Headers First, Body Only If Reply Candidate
// ---------------------------------------------------------------------------
// Phase 1: Fetch ONLY headers (tiny, ~2-5KB each). Parse and check if the
// message looks like a reply (In-Reply-To, References, or Re: subject).
// Phase 2: For reply candidates only, fetch the body text for the preview.
// This reduces RAM by ~80% since most unread emails are newsletters/spam.
// ---------------------------------------------------------------------------

function fetchRecentMessages(
  imapConfig: { host: string; port: number; tls: boolean },
  email: string,
  password: string,
  since: Date,
  sentJobs: SentJobInfo[],
): Promise<ParsedMessage[]> {
  return new Promise(async (resolve, reject) => {
    let imap: Imap;
    try {
      imap = await acquireConnection(imapConfig, email, password);
    } catch (err) {
      reject(err);
      return;
    }

    const messages: ParsedMessage[] = [];

    const cleanup = () => {
      releaseConnection(email);
      evictExpiredEntries();
    };

    imap.openBox("INBOX", true, (err: Error | null) => {
      if (err) {
        cleanup();
        reject(err);
        return;
      }

      const sinceStr = since.toISOString().split("T")[0];
      imap.search([["SINCE", sinceStr], ["UNSEEN"]], (err: Error | null, results: number[]) => {
        if (err || !results || results.length === 0) {
          cleanup();
          resolve(messages);
          return;
        }

        const toFetch = results.slice(-50);

        // Phase 1: Fetch headers ONLY
        const fetch = imap.fetch(toFetch, { bodies: ["HEADER"], struct: true });

        const headerCache: { headerBuffer: Buffer; seqNo: number }[] = [];
        let headersProcessed = 0;

        fetch.on("message", (msg: Imap.ImapMessage) => {
          let headerBuffer = Buffer.alloc(0);
          const seqNo = (msg as any).attributes?.uid ?? (msg as any).attributes?.seqno ?? 0;

          msg.on("body", (stream: NodeJS.ReadableStream, info: { which: string }) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.once("end", () => {
              if (info.which === "HEADER") {
                headerBuffer = Buffer.concat(chunks);
              }
            });
          });

          msg.once("end", () => {
            headerCache.push({ headerBuffer, seqNo });
            headersProcessed++;

            if (headersProcessed === toFetch.length) {
              processHeadersAndFetchBodies(imap, headerCache, since, sentJobs, messages, cleanup, resolve, reject);
            }
          });
        });

        fetch.once("error", (err: Error) => {
          cleanup();
          reject(err);
        });

        fetch.once("end", () => {
          // All headers fetched — processing happens in processHeadersAndFetchBodies
        });
      });
    });
  });
}

async function processHeadersAndFetchBodies(
  imap: Imap,
  headerCache: { headerBuffer: Buffer; seqNo: number }[],
  since: Date,
  sentJobs: SentJobInfo[],
  messages: ParsedMessage[],
  cleanup: () => void,
  resolve: (value: ParsedMessage[]) => void,
  reject: (reason?: any) => void,
): Promise<void> {
  const replyCandidates: { headerBuffer: Buffer; seqNo: number }[] = [];

  for (const { headerBuffer, seqNo } of headerCache) {
    try {
      const parsed: ParsedMail = await simpleParser(headerBuffer);
      const msgDate = parsed.date ? new Date(parsed.date) : new Date();

      if (msgDate < since) continue;

      const inReplyTo = Array.isArray(parsed.inReplyTo)
        ? parsed.inReplyTo.join(" ")
        : (parsed.inReplyTo ?? "");
      const references = Array.isArray(parsed.references)
        ? parsed.references.join(" ")
        : (parsed.references ?? "");

      const hasReplyHeaders = !!(inReplyTo || references);

      if (hasReplyHeaders) {
        replyCandidates.push({ headerBuffer, seqNo });
        continue;
      }

      const subject = parsed.subject ?? "";
      const isReply = /^Re:/i.test(subject);

      if (isReply) {
        const fromEmailMatch = (parsed.from?.text ?? "").match(/<?([^<>\s]+@[^<>\s]+)>?/);
        if (fromEmailMatch) {
          const replyingEmail = fromEmailMatch[1].toLowerCase();
          const hasMatchingRecipient = sentJobs.some(
            (job) => job.toEmail.toLowerCase() === replyingEmail
          );
          if (hasMatchingRecipient) {
            replyCandidates.push({ headerBuffer, seqNo });
            continue;
          }
        }
      }
    } catch (parseErr) {
      console.error("[ReplyDetector] Failed to parse header:", parseErr);
    }
  }

  if (replyCandidates.length === 0) {
    cleanup();
    resolve(messages);
    return;
  }

  // Phase 2: Fetch bodies ONLY for reply candidates
  const seqNos = replyCandidates.map((c) => c.seqNo);
  const bodyFetch = imap.fetch(seqNos, { bodies: ["TEXT"], struct: true });

  const bodyMap = new Map<number, string>();
  let bodiesProcessed = 0;

      bodyFetch.on("message", (msg: Imap.ImapMessage) => {
        const seqNo = (msg as any).attributes?.uid ?? (msg as any).attributes?.seqno ?? 0;
    let bodyText = "";

    msg.on("body", (stream: NodeJS.ReadableStream, info: { which: string }) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.once("end", () => {
        if (info.which === "TEXT") {
          bodyText = Buffer.concat(chunks).toString("utf-8");
        }
      });
    });

    msg.once("end", () => {
      bodyMap.set(seqNo, bodyText.substring(0, 500));
      bodiesProcessed++;

      if (bodiesProcessed === replyCandidates.length) {
        buildMessagesFromCache(headerCache, replyCandidates, bodyMap, since, messages);
        cleanup();
        resolve(messages);
      }
    });
  });

  bodyFetch.once("error", (err: Error) => {
    cleanup();
    reject(err);
  });

  bodyFetch.once("end", () => {
    if (bodiesProcessed === 0) {
      buildMessagesFromCache(headerCache, replyCandidates, bodyMap, since, messages);
      cleanup();
      resolve(messages);
    }
  });
}

async function buildMessagesFromCache(
  headerCache: { headerBuffer: Buffer; seqNo: number }[],
  replyCandidates: { headerBuffer: Buffer; seqNo: number }[],
  bodyMap: Map<number, string>,
  since: Date,
  messages: ParsedMessage[],
): Promise<void> {
  const candidateSeqSet = new Set(replyCandidates.map((c) => c.seqNo));

  for (const { headerBuffer, seqNo } of headerCache) {
    if (!candidateSeqSet.has(seqNo)) continue;

    try {
      const parsed: ParsedMail = await simpleParser(headerBuffer);
      const msgDate = parsed.date ? new Date(parsed.date) : new Date();
      if (msgDate < since) continue;

      const messageId = parsed.messageId ?? "";
      const inReplyTo = Array.isArray(parsed.inReplyTo)
        ? parsed.inReplyTo.join(" ")
        : (parsed.inReplyTo ?? "");
      const references = Array.isArray(parsed.references)
        ? parsed.references.join(" ")
        : (parsed.references ?? "");
      const from = parsed.from?.text ?? "";
      const subject = parsed.subject ?? "";
      const bodyPreview = bodyMap.get(seqNo) ?? "";

      messages.push({
        messageId,
        inReplyTo,
        references,
        from,
        subject,
        date: msgDate,
        bodyPreview,
      });
    } catch (parseErr) {
      console.error("[ReplyDetector] Failed to parse candidate header:", parseErr);
    }
  }
}

// ---------------------------------------------------------------------------
// IMAP IDLE — Push-Based Reply Detection
// ---------------------------------------------------------------------------
// Instead of polling every 5 minutes, maintains persistent IMAP connections
// that receive real-time notifications when new mail arrives. Each sender
// gets its own IDLE connection that auto-reconnects on failure.
//
// IDLE sessions are limited to IDLE_TIMEOUT_MS (default 29 min) to comply
// with RFC 2177 — servers may drop connections after 30 minutes.
// ---------------------------------------------------------------------------

interface IdleSession {
  senderId: string;
  email: string;
  running: boolean;
}

const idleSessions = new Map<string, IdleSession>();

export function startIdleSessions(): void {
  console.log("[ReplyDetector] IMAP IDLE: Starting push-based detection");
  refreshIdleSessions();
  setInterval(refreshIdleSessions, 60000);
}

async function refreshIdleSessions(): Promise<void> {
  const activeSince = new Date(Date.now() - ADAPTIVE_POLL_WINDOW_HOURS * 60 * 60 * 1000);

  const activeSenderIds = await prisma.emailJob.findMany({
    where: {
      status: "SENT",
      sentAt: { gte: activeSince },
      senderId: { not: null },
    },
    select: { senderId: true },
    distinct: ["senderId"],
  });

  const activeIds = activeSenderIds
    .map((j) => j.senderId)
    .filter((id): id is string => id !== null);

  const senders = await prisma.sender.findMany({
    where: {
      isVerified: true,
      appPassword: { not: "" },
      id: { in: activeIds },
    },
    select: { id: true, email: true, appPassword: true, smtpHost: true },
  });

  const activeEmails = new Set(senders.map((s) => s.email.toLowerCase()));

  for (const [email, session] of idleSessions.entries()) {
    if (!activeEmails.has(email)) {
      session.running = false;
      idleSessions.delete(email);
    }
  }

  for (const sender of senders) {
    const emailKey = sender.email.toLowerCase();
    if (!idleSessions.has(emailKey)) {
      const session: IdleSession = {
        senderId: sender.id,
        email: sender.email,
        running: true,
      };
      idleSessions.set(emailKey, session);
      runIdleSession(sender, session).catch((err) => {
        console.error(`[ReplyDetector] IDLE session error for ${sender.email}:`, err.message);
        idleSessions.delete(emailKey);
      });
    }
  }

  console.log(`[ReplyDetector] IMAP IDLE: ${idleSessions.size} active sessions`);
}

async function runIdleSession(
  sender: { id: string; email: string; appPassword: string; smtpHost: string },
  session: IdleSession,
): Promise<void> {
  let decryptedPassword: string;
  try {
    decryptedPassword = decrypt(sender.appPassword);
  } catch {
    console.warn(`[ReplyDetector] Failed to decrypt credentials for sender ${sender.email}`);
    return;
  }

  const imapConfig = getImapConfig(sender.smtpHost);

  while (session.running) {
    await new Promise<void>((resolve) => {
      const imap = new Imap({
        user: sender.email,
        password: decryptedPassword,
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.tls,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 15000,
      });

      const timeout = setTimeout(() => {
        if (imap.state === "authenticated") {
          imap.end();
        }
      }, IDLE_TIMEOUT_MS);

      imap.once("ready", () => {
          imap.openBox("INBOX", false, (err: Error | null) => {
            if (err) {
              clearTimeout(timeout);
              imap.end();
              resolve();
              return;
            }

            (imap as any).idle();
        });
      });

      imap.on("mail", async () => {
        if (!session.running) {
          imap.end();
          resolve();
          return;
        }

        try {
          const count = await processSenderRepliesWithImap(imap, sender);
          if (count > 0) {
            console.log(`[ReplyDetector] IDLE: Found ${count} reply(ies) for ${sender.email}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[ReplyDetector] IDLE reply check error for ${sender.email}:`, msg);
        }
      });

      imap.once("error", () => {
        clearTimeout(timeout);
        resolve();
      });

      imap.once("end", () => {
        clearTimeout(timeout);
        resolve();
      });

      imap.connect();
    });

    if (!session.running) break;

    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function processSenderRepliesWithImap(
  imap: Imap,
  sender: { id: string; email: string },
): Promise<number> {
  const since = new Date(Date.now() - REPLY_LOOKBACK_HOURS * 60 * 60 * 1000);

  return new Promise((resolve, reject) => {
    imap.search([["SINCE", since.toISOString().split("T")[0]], ["UNSEEN"]], (err: Error | null, results: number[]) => {
      if (err || !results || results.length === 0) {
        resolve(0);
        return;
      }

      const toFetch = results.slice(-50);
      const fetch = imap.fetch(toFetch, { bodies: ["HEADER"], struct: true });

      const headers: { buffer: Buffer; seqNo: number }[] = [];
      let done = 0;

      fetch.on("message", (msg: Imap.ImapMessage) => {
        let buf = Buffer.alloc(0);
        const seqNo = (msg as any).attributes?.uid ?? (msg as any).attributes?.seqno ?? 0;

        msg.on("body", (stream: NodeJS.ReadableStream, info: { which: string }) => {
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.once("end", () => {
            if (info.which === "HEADER") buf = Buffer.concat(chunks);
          });
        });

        msg.once("end", () => {
          headers.push({ buffer: buf, seqNo });
          done++;
          if (done === toFetch.length) {
            matchHeadersAndResolve(headers, sender, since, resolve, reject);
          }
        });
      });

      fetch.once("error", reject);
    });
  });
}

async function matchHeadersAndResolve(
  headers: { buffer: Buffer; seqNo: number }[],
  sender: { id: string; email: string },
  since: Date,
  resolve: (count: number) => void,
  reject: (err: Error) => void,
): Promise<void> {
  const candidates: number[] = [];

  for (const { buffer, seqNo } of headers) {
    try {
      const parsed = await simpleParser(buffer);
      const inReplyTo = Array.isArray(parsed.inReplyTo)
        ? parsed.inReplyTo.join(" ")
        : (parsed.inReplyTo ?? "");
      const references = Array.isArray(parsed.references)
        ? parsed.references.join(" ")
        : (parsed.references ?? "");

      if (inReplyTo || references || /^Re:/i.test(parsed.subject ?? "")) {
        candidates.push(seqNo);
      }
    } catch {
      // skip unparseable
    }
  }

  if (candidates.length === 0) {
    resolve(0);
    return;
  }

  const sentJobs = await prisma.emailJob.findMany({
    where: {
      senderId: sender.id,
      status: "SENT",
      isReplied: false,
      sentAt: { gte: since },
    },
    select: {
      id: true,
      toEmail: true,
      messageId: true,
      campaignId: true,
      campaign: { select: { subject: true } },
    },
  });

  if (sentJobs.length === 0) {
    resolve(0);
    return;
  }

  const flatJobs: SentJobInfo[] = sentJobs.map((job) => ({
    id: job.id,
    toEmail: job.toEmail,
    messageId: job.messageId,
    subject: job.campaign.subject,
    campaignId: job.campaignId,
  }));

  let replyCount = 0;

  for (const { buffer } of headers) {
    try {
      const parsed = await simpleParser(buffer);
      const msgDate = parsed.date ? new Date(parsed.date) : new Date();
      if (msgDate < since) continue;

      const message: ParsedMessage = {
        messageId: parsed.messageId ?? "",
        inReplyTo: Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo.join(" ") : (parsed.inReplyTo ?? ""),
        references: Array.isArray(parsed.references) ? parsed.references.join(" ") : (parsed.references ?? ""),
        from: parsed.from?.text ?? "",
        subject: parsed.subject ?? "",
        date: msgDate,
        bodyPreview: "",
      };

      const match = await matchMessageToJob(message, flatJobs);
      if (!match) continue;

      await prisma.emailJob.update({
        where: { id: match.id },
        data: { isReplied: true },
      });

      await prisma.trackingEvent.create({
        data: {
          emailJobId: match.id,
          eventType: "REPLY",
        },
      });

      const matchedJob = sentJobs.find((j) => j.id === match.id);
      if (matchedJob) {
        // Log contact activity for reply
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id: match.campaignId },
          select: { userId: true },
        });
        if (campaign) {
          await logContactActivityByEmail(campaign.userId, matchedJob.toEmail, "EMAIL_REPLIED", {
            emailJobId: match.id,
            campaignId: match.campaignId,
          });
          await updateContactStageByEmail(campaign.userId, matchedJob.toEmail, "REPLIED");
        }

        await prisma.recipientSequenceState.updateMany({
          where: {
            campaignId: match.campaignId,
            recipientEmail: matchedJob.toEmail,
            replied: false,
          },
          data: { replied: true },
        });
      }

      replyCount++;
    } catch (err) {
      console.error("[ReplyDetector] IDLE: Failed to process message:", err);
    }
  }

  resolve(replyCount);
}

function stopIdleSessions(): void {
  for (const [, session] of idleSessions.entries()) {
    session.running = false;
  }
  idleSessions.clear();
  for (const [key, entry] of imapPool.entries()) {
    entry.imap.end();
    imapPool.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Message-to-Job Matching
// ---------------------------------------------------------------------------

async function matchMessageToJob(
  message: ParsedMessage,
  sentJobs: SentJobInfo[],
): Promise<{ id: string; campaignId: string } | null> {
  if (message.inReplyTo || message.references) {
    const referencedIds = [
      ...(message.inReplyTo ? message.inReplyTo.split(/\s+/).filter(Boolean) : []),
      ...(message.references ? message.references.split(/\s+/).filter(Boolean) : []),
    ];

    for (const refId of referencedIds) {
      const match = sentJobs.find((job) => job.messageId === refId);
      if (match) return { id: match.id, campaignId: match.campaignId };
    }
  }

  const fromEmailMatch = message.from.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  if (!fromEmailMatch) return null;

  const replyingEmail = fromEmailMatch[1].toLowerCase();

  const candidateJobs = sentJobs.filter(
    (job) => job.toEmail.toLowerCase() === replyingEmail
  );

  if (candidateJobs.length === 0) return null;

  if (candidateJobs.length === 1) return { id: candidateJobs[0].id, campaignId: candidateJobs[0].campaignId };

  const cleanSubject = (s: string) =>
    s.replace(/^Re:\s*/i, "").replace(/^Fwd:\s*/i, "").trim().toLowerCase();

  const incomingClean = cleanSubject(message.subject);

  for (const job of candidateJobs) {
    if (cleanSubject(job.subject) === incomingClean) {
      return { id: job.id, campaignId: job.campaignId };
    }
  }

  return { id: candidateJobs[0].id, campaignId: candidateJobs[0].campaignId };
}

// ---------------------------------------------------------------------------
// Per-Sender Reply Processing (used by poll-based fallback)
// ---------------------------------------------------------------------------

async function processSenderReplies(sender: {
  id: string;
  email: string;
  appPassword: string;
  smtpHost: string;
}): Promise<number> {
  if (!sender.appPassword) return 0;

  let decryptedPassword: string;
  try {
    decryptedPassword = decrypt(sender.appPassword);
  } catch {
    console.warn(`[ReplyDetector] Failed to decrypt credentials for sender ${sender.email}`);
    return 0;
  }

  const imapConfig = getImapConfig(sender.smtpHost);
  const since = new Date(Date.now() - REPLY_LOOKBACK_HOURS * 60 * 60 * 1000);

  const sentJobs = await prisma.emailJob.findMany({
    where: {
      senderId: sender.id,
      status: "SENT",
      isReplied: false,
      sentAt: { gte: since },
    },
    select: {
      id: true,
      toEmail: true,
      messageId: true,
      campaignId: true,
      campaign: { select: { subject: true } },
    },
  });

  if (sentJobs.length === 0) return 0;

  const flatJobs: SentJobInfo[] = sentJobs.map((job) => ({
    id: job.id,
    toEmail: job.toEmail,
    messageId: job.messageId,
    subject: job.campaign.subject,
    campaignId: job.campaignId,
  }));

  let messages: ParsedMessage[];
  try {
    messages = await fetchRecentMessages(imapConfig, sender.email, decryptedPassword, since, flatJobs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ReplyDetector] IMAP connection error for ${sender.email}:`, msg);
    return 0;
  }

  if (messages.length === 0) return 0;

  let replyCount = 0;

  for (const message of messages) {
    const match = await matchMessageToJob(message, flatJobs);
    if (!match) continue;

    await prisma.emailJob.update({
      where: { id: match.id },
      data: { isReplied: true },
    });

    await prisma.trackingEvent.create({
      data: {
        emailJobId: match.id,
        eventType: "REPLY",
      },
    });

    const matchedJob = sentJobs.find((j) => j.id === match.id);
    if (matchedJob) {
      // Log contact activity for reply
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: match.campaignId },
        select: { userId: true },
      });
      if (campaign) {
        await logContactActivityByEmail(campaign.userId, matchedJob.toEmail, "EMAIL_REPLIED", {
          emailJobId: match.id,
          campaignId: match.campaignId,
        });
        await updateContactStageByEmail(campaign.userId, matchedJob.toEmail, "REPLIED");
      }

      await prisma.recipientSequenceState.updateMany({
        where: {
          campaignId: match.campaignId,
          recipientEmail: matchedJob.toEmail,
          replied: false,
        },
        data: { replied: true },
      });
    }

    replyCount++;
  }

  if (replyCount > 0) {
    console.log(`[ReplyDetector] Found ${replyCount} new reply(ies) for sender ${sender.email}`);
  }

  return replyCount;
}

// ---------------------------------------------------------------------------
// Poll-Based Fallback (runs on configurable interval)
// ---------------------------------------------------------------------------

export async function processReplyDetectionJob(): Promise<void> {
  console.log("[ReplyDetector] Running reply detection scan (fallback)...");

  const activeSince = new Date(Date.now() - ADAPTIVE_POLL_WINDOW_HOURS * 60 * 60 * 1000);

  const activeSenderIds = await prisma.emailJob.findMany({
    where: {
      status: "SENT",
      sentAt: { gte: activeSince },
      senderId: { not: null },
    },
    select: { senderId: true },
    distinct: ["senderId"],
  });

  const activeIds = activeSenderIds
    .map((j) => j.senderId)
    .filter((id): id is string => id !== null);

  const senders = await prisma.sender.findMany({
    where: {
      isVerified: true,
      appPassword: { not: "" },
      id: { in: [...activeIds] },
    },
    select: {
      id: true,
      email: true,
      appPassword: true,
      smtpHost: true,
    },
  });

  const totalSenders = await prisma.sender.count({
    where: { isVerified: true, appPassword: { not: "" } },
  });

  if (senders.length === 0) {
    console.log("[ReplyDetector] No active senders to scan (all senders idle)");
    return;
  }

  console.log(`[ReplyDetector] Polling ${senders.length} of ${totalSenders} active senders`);

  let totalReplies = 0;

  for (const sender of senders) {
    try {
      const count = await processSenderReplies(sender);
      totalReplies += count;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ReplyDetector] Error processing sender ${sender.email}:`, msg);
    }
  }

  console.log(`[ReplyDetector] Scan complete. Found ${totalReplies} new reply(ies) across ${senders.length} sender(s)`);
}

export { stopIdleSessions };

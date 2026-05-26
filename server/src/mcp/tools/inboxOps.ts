import { prisma } from "../../config/prisma";
import {
  archiveInboxEmail,
  deleteInboxEmail,
  getInboxEmails,
  getInboxThreads,
  markInboxEmailRead,
  sendInboxReply,
  syncInboxForSender,
  toggleInboxEmailStar,
} from "../../utils/inboxService";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { MCPContext } from "../types";
import { clampLimit, fail, findScopedSender, mcpScopeWhere, ok, sanitizePage, sanitizeString } from "../helpers";

async function resolveSender(context: MCPContext, senderIdArg: unknown) {
  const senderId = sanitizeString(senderIdArg, 80);
  const sender = await findScopedSender(context, senderId || undefined);
  return sender;
}

async function listThreads(context: MCPContext, args: Record<string, unknown>) {
  const sender = await resolveSender(context, args.senderId);
  if (!sender) return ok({ threads: [], total: 0, page: 1, limit: 20 });
  const page = sanitizePage(args.page);
  const limit = clampLimit(args.limit, 20, 100);
  const result = await getInboxThreads(sender.id, {
    page,
    limit,
    unreadOnly: args.unreadOnly === true,
    starredOnly: args.starredOnly === true,
    archivedOnly: args.archivedOnly === true,
    search: sanitizeString(args.search, 200) || undefined,
  });
  return ok({ ...result, senderId: sender.id, page, limit });
}

async function listEmails(context: MCPContext, args: Record<string, unknown>) {
  const sender = await resolveSender(context, args.senderId);
  if (!sender) return ok({ emails: [], total: 0, page: 1, limit: 20 });
  const page = sanitizePage(args.page);
  const limit = clampLimit(args.limit, 20, 100);
  const result = await getInboxEmails(sender.id, {
    page,
    limit,
    folder: sanitizeString(args.folder, 80) || "INBOX",
    unreadOnly: args.unreadOnly === true,
    starredOnly: args.starredOnly === true,
    archivedOnly: args.archivedOnly === true,
    threadId: sanitizeString(args.threadId, 200) || undefined,
    search: sanitizeString(args.search, 200) || undefined,
  });
  return ok({ ...result, senderId: sender.id, page, limit });
}

async function unreadCount(context: MCPContext, args: Record<string, unknown>) {
  const sender = await resolveSender(context, args.senderId);
  if (!sender) return ok({ unreadCount: 0 });
  const unread = await prisma.inboxEmail.count({ where: { senderId: sender.id, isRead: false, isDeleted: false } });
  return ok({ unreadCount: unread, senderId: sender.id });
}

async function syncInbox(context: MCPContext, args: Record<string, unknown>) {
  const sender = await resolveSender(context, args.senderId);
  if (!sender) return fail("Sender not found");
  const result = await syncInboxForSender(sender.id);
  return ok({ ...result, senderId: sender.id }, "Inbox sync completed");
}

async function getScopedEmail(context: MCPContext, emailId: unknown) {
  const id = sanitizeString(emailId, 80);
  if (!id) return null;
  return prisma.inboxEmail.findFirst({
    where: {
      id,
      sender: mcpScopeWhere(context),
    },
    select: { id: true, senderId: true, fromEmail: true, subject: true, messageId: true, threadId: true },
  });
}

async function markRead(context: MCPContext, args: Record<string, unknown>) {
  const email = await getScopedEmail(context, args.emailId);
  if (!email) return fail("Email not found");
  await markInboxEmailRead(email.id);
  return ok({ emailId: email.id }, "Email marked read");
}

async function starEmail(context: MCPContext, args: Record<string, unknown>) {
  const email = await getScopedEmail(context, args.emailId);
  if (!email) return fail("Email not found");
  const isStarred = await toggleInboxEmailStar(email.id);
  return ok({ emailId: email.id, isStarred }, "Star updated");
}

async function archiveEmail(context: MCPContext, args: Record<string, unknown>) {
  const email = await getScopedEmail(context, args.emailId);
  if (!email) return fail("Email not found");
  await archiveInboxEmail(email.id);
  return ok({ emailId: email.id }, "Email archived");
}

async function deleteEmail(context: MCPContext, args: Record<string, unknown>) {
  const email = await getScopedEmail(context, args.emailId);
  if (!email) return fail("Email not found");
  await deleteInboxEmail(email.id);
  return ok({ emailId: email.id }, "Email deleted");
}

async function reply(context: MCPContext, args: Record<string, unknown>) {
  const sender = await resolveSender(context, args.senderId);
  if (!sender) return fail("Sender not found");
  const toEmail = sanitizeString(args.toEmail, 254).toLowerCase();
  const subject = sanitizeString(args.subject, 300);
  const body = sanitizeString(args.body, 20000);
  if (!toEmail || !subject || !body) return fail("toEmail, subject, and body are required");
  const result = await sendInboxReply(
    sender.id,
    toEmail,
    subject,
    body,
    sanitizeString(args.inReplyToMessageId, 300) || undefined,
    sanitizeString(args.threadId, 300) || undefined
  );
  if (!result.success) return fail(result.error || "Failed to send reply");
  return ok({ ...result, senderId: sender.id }, "Reply sent");
}

export function registerInboxTools() {
  const listSchema = {
    type: "object" as const,
    properties: {
      senderId: { type: "string" },
      page: { type: "number" },
      limit: { type: "number" },
      unreadOnly: { type: "boolean" },
      starredOnly: { type: "boolean" },
      archivedOnly: { type: "boolean" },
      search: { type: "string" },
    },
  };
  toolRegistry.register({ name: "inbox_thread_list", description: "List inbox threads", category: "inbox", access: "read", inputSchema: listSchema, handler: createToolHandler({ name: "inbox_thread_list", description: "", inputSchema: {}, handler: listThreads }) });
  toolRegistry.register({ name: "inbox_email_list", description: "List inbox emails", category: "inbox", access: "read", inputSchema: { ...listSchema, properties: { ...listSchema.properties, folder: { type: "string" }, threadId: { type: "string" } } }, handler: createToolHandler({ name: "inbox_email_list", description: "", inputSchema: {}, handler: listEmails }) });
  toolRegistry.register({ name: "inbox_unread_count", description: "Get unread inbox count", category: "inbox", access: "read", inputSchema: { type: "object", properties: { senderId: { type: "string" } } }, handler: createToolHandler({ name: "inbox_unread_count", description: "", inputSchema: {}, handler: unreadCount }) });
  toolRegistry.register({ name: "inbox_sync", description: "Sync a sender inbox", category: "inbox", access: "write", inputSchema: { type: "object", properties: { senderId: { type: "string" } } }, handler: createToolHandler({ name: "inbox_sync", description: "", inputSchema: {}, handler: syncInbox }) });
  toolRegistry.register({ name: "inbox_email_read", description: "Mark an inbox email as read", category: "inbox", access: "write", inputSchema: { type: "object", properties: { emailId: { type: "string" } }, required: ["emailId"] }, handler: createToolHandler({ name: "inbox_email_read", description: "", inputSchema: {}, handler: markRead }) });
  toolRegistry.register({ name: "inbox_email_star", description: "Toggle an inbox email star", category: "inbox", access: "write", inputSchema: { type: "object", properties: { emailId: { type: "string" } }, required: ["emailId"] }, handler: createToolHandler({ name: "inbox_email_star", description: "", inputSchema: {}, handler: starEmail }) });
  toolRegistry.register({ name: "inbox_email_archive", description: "Archive an inbox email", category: "inbox", access: "write", destructive: true, inputSchema: { type: "object", properties: { emailId: { type: "string" } }, required: ["emailId"] }, handler: createToolHandler({ name: "inbox_email_archive", description: "", inputSchema: {}, handler: archiveEmail }) });
  toolRegistry.register({ name: "inbox_email_delete", description: "Delete an inbox email", category: "inbox", access: "write", destructive: true, inputSchema: { type: "object", properties: { emailId: { type: "string" } }, required: ["emailId"] }, handler: createToolHandler({ name: "inbox_email_delete", description: "", inputSchema: {}, handler: deleteEmail }) });
  toolRegistry.register({ name: "inbox_reply_send", description: "Send a reply from a connected sender", category: "inbox", access: "write", inputSchema: { type: "object", properties: { senderId: { type: "string" }, toEmail: { type: "string" }, subject: { type: "string" }, body: { type: "string" }, inReplyToMessageId: { type: "string" }, threadId: { type: "string" } }, required: ["toEmail", "subject", "body"] }, handler: createToolHandler({ name: "inbox_reply_send", description: "", inputSchema: {}, handler: reply }) });
}

import api from "../axios";
import type { InboxThread, InboxEmail } from "@/types";

interface InboxQueryOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  archivedOnly?: boolean;
  search?: string;
}

interface InboxEmailQueryOptions extends InboxQueryOptions {
  folder?: string;
  threadId?: string;
}

export const getInboxThreads = async (
  senderId?: string,
  options: InboxQueryOptions = {}
): Promise<{ threads: InboxThread[]; total: number }> => {
  const qs = new URLSearchParams({
    ...(senderId && { senderId }),
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
    ...(options.unreadOnly ? { unreadOnly: "true" } : {}),
    ...(options.starredOnly ? { starredOnly: "true" } : {}),
    ...(options.archivedOnly ? { archivedOnly: "true" } : {}),
    ...(options.search ? { search: options.search } : {}),
  }).toString();
  const res = await api.get(`/api/inbox/threads?${qs}`);
  return res.data;
};

export const getInboxEmails = async (
  senderId?: string,
  options: InboxEmailQueryOptions = {}
): Promise<{ emails: InboxEmail[]; total: number }> => {
  const qs = new URLSearchParams({
    ...(senderId && { senderId }),
    folder: options.folder ?? "INBOX",
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
    ...(options.threadId ? { threadId: options.threadId } : {}),
    ...(options.unreadOnly ? { unreadOnly: "true" } : {}),
    ...(options.starredOnly ? { starredOnly: "true" } : {}),
    ...(options.archivedOnly ? { archivedOnly: "true" } : {}),
    ...(options.search ? { search: options.search } : {}),
  }).toString();
  const res = await api.get(`/api/inbox/emails?${qs}`);
  return res.data;
};

export const syncInbox = async (senderId: string): Promise<{ success: boolean; messagesProcessed: number }> => {
  const res = await api.post("/api/inbox/sync", { senderId });
  return res.data;
};

export const getUnreadCount = async (senderId?: string): Promise<{ unreadCount: number }> => {
  const qs = senderId ? `?senderId=${senderId}` : "";
  const res = await api.get(`/api/inbox/unread-count${qs}`);
  return res.data;
};

export const sendInboxReply = async (data: { senderId: string; toEmail: string; subject: string; body: string; inReplyToMessageId?: string; threadId?: string; }): Promise<{ success: boolean; messageId: string }> => {
  const res = await api.post("/api/inbox/reply", data);
  return res.data;
};

export const markInboxRead = async (emailId: string): Promise<{ success: boolean }> => {
  const res = await api.patch(`/api/inbox/emails/${emailId}/read`);
  return res.data;
};

export const toggleInboxStar = async (emailId: string): Promise<{ isStarred: boolean }> => {
  const res = await api.patch(`/api/inbox/emails/${emailId}/star`);
  return res.data;
};

export const archiveInboxEmail = async (emailId: string): Promise<{ success: boolean }> => {
  const res = await api.patch(`/api/inbox/emails/${emailId}/archive`);
  return res.data;
};

export const deleteInboxEmail = async (emailId: string): Promise<{ success: boolean }> => {
  const res = await api.patch(`/api/inbox/emails/${emailId}/delete`);
  return res.data;
};

import api from "../axios";
import type { InboxThread, InboxEmail } from "@/types";

export const getInboxThreads = async (senderId?: string, page = 1, limit = 20): Promise<{ threads: InboxThread[]; total: number }> => {
  const qs = new URLSearchParams({ ...(senderId && { senderId }), page: page.toString(), limit: limit.toString() }).toString();
  const res = await api.get(`/api/inbox/threads?${qs}`);
  return res.data;
};

export const getInboxEmails = async (senderId?: string, folder = "INBOX", page = 1, limit = 20): Promise<{ emails: InboxEmail[]; total: number }> => {
  const qs = new URLSearchParams({ ...(senderId && { senderId }), folder, page: page.toString(), limit: limit.toString() }).toString();
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

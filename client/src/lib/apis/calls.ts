import api from "../axios";
import type { CallQueueResponse, CallTask, LogCallPayload } from "@/types";

export const getCallQueue = async (params: {
  status?: "ALL" | "PENDING" | "COMPLETED" | "SKIPPED";
  due?: "all" | "today" | "overdue";
  search?: string;
  listId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<CallQueueResponse> => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.due) qs.set("due", params.due);
  if (params.search) qs.set("search", params.search);
  if (params.listId) qs.set("listId", params.listId);
  if (params.assignedToId) qs.set("assignedToId", params.assignedToId);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await api.get(`/api/calls/queue${suffix}`);
  return res.data;
};

export const createCallTask = async (payload: { contactId: string; dueAt: string; priority?: number; contactListId?: string; assignedToId?: string | null }): Promise<CallTask> => {
  const res = await api.post("/api/calls/tasks", payload);
  return res.data;
};

export const updateCallTask = async (id: string, payload: { assignedToId?: string | null }): Promise<CallTask> => {
  const res = await api.patch(`/api/calls/tasks/${id}`, payload);
  return res.data;
};

export const logCall = async (payload: LogCallPayload): Promise<{ success: boolean; followUpTaskId?: string | null }> => {
  const res = await api.post("/api/calls/log", payload);
  return res.data;
};

export const submitCallDisposition = async (payload: {
  sessionId?: string;
  taskId?: string;
  contactId: string;
  outcome: string;
  note?: string;
  nextAction?: string;
  nextCallAt?: string;
}) => {
  const res = await api.post("/api/calls/disposition", payload);
  return res.data;
};

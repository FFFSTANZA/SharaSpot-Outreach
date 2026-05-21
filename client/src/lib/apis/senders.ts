import api from "../axios";
import type { CreateSenderPayload, SenderResponse } from "@/types";

export const getSenders = async (): Promise<SenderResponse[]> => {
  const res = await api.get("/api/senders");
  return res.data;
};

export const createSender = async (data: CreateSenderPayload): Promise<SenderResponse> => {
  const res = await api.post("/api/senders", data);
  return res.data;
};

export const verifySender = async (senderId: string, data: { name?: string; appPassword: string; skipWarmup?: boolean }): Promise<SenderResponse> => {
  const res = await api.patch(`/api/senders/${senderId}/verify`, data);
  return res.data;
};

export const getSenderById = async (senderId: string): Promise<SenderResponse & { currentHourlyCount: number; currentDailyCount: number; effectiveDailyLimit: number; warmupStatus: string; cooldownState: { status: string; expiresAt: string | null }; }> => {
  const res = await api.get(`/api/senders/${senderId}`);
  return res.data;
};

export const deleteSender = async (senderId: string): Promise<void> => {
  await api.delete(`/api/senders/${senderId}`);
};

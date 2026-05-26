import api from "../axios";
import type { CreateCampaignPayload, Campaign, CampaignDetail, EmailJob, SequenceResponse } from "@/types";

export const createCampaign = async (data: CreateCampaignPayload): Promise<{ campaignId: string; message: string }> => {
  const res = await api.post("/api/campaigns", data);
  return res.data;
};


export const getCampaignById = async (id: string): Promise<CampaignDetail> => {
  const res = await api.get(`/api/campaigns/${id}`);
  return res.data;
};

export const pauseCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.patch(`/api/campaigns/${id}/pause`);
  return res.data;
};

export const resumeCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.patch(`/api/campaigns/${id}/resume`);
  return res.data;
};

export const cancelCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.patch(`/api/campaigns/${id}/cancel`);
  return res.data;
};

export const getCampaignThrottleStatus = async (id: string): Promise<{
  campaignId: string;
  senders: { senderId: string; email: string; name: string | null; currentHourlyCount: number; currentDailyCount: number; effectiveLimits: { perMinute: number; perHour: number; perDay: number }; warmupStatus: string; cooldownState: { status: string; expiresAt: string | null }; }[];
}> => {
  const res = await api.get(`/api/campaigns/${id}/throttle-status`);
  return res.data;
};

export const searchCampaigns = async (params: Record<string, string>): Promise<{ results: any[]; total: number; filters: Record<string, string> }> => {
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/api/campaigns/search?${qs}`);
  return res.data;
};

export const searchEmails = async (params: Record<string, string>): Promise<{ results: any[]; total: number; filters: Record<string, string> }> => {
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/api/emails/search?${qs}`);
  return res.data;
};

export const toggleEmailStar = async (emailId: string): Promise<EmailJob> => {
  const res = await api.patch(`/api/emails/${emailId}/star`);
  return res.data;
};

export const toggleReplied = async (emailId: string): Promise<EmailJob> => {
  const res = await api.patch(`/api/emails/${emailId}/replied`);
  return res.data;
};

export const getSequence = async (campaignId: string): Promise<SequenceResponse> => {
  const res = await api.get(`/api/campaigns/${campaignId}/sequence`);
  return res.data;
};

export const pauseRecipientSequence = async (campaignId: string, recipientId: string): Promise<void> => {
  await api.patch(`/api/campaigns/${campaignId}/sequence/recipients/${recipientId}/pause`);
};

export const resumeRecipientSequence = async (campaignId: string, recipientId: string): Promise<void> => {
  await api.patch(`/api/campaigns/${campaignId}/sequence/recipients/${recipientId}/resume`);
};

export const stopRecipientSequence = async (campaignId: string, recipientId: string): Promise<void> => {
  await api.patch(`/api/campaigns/${campaignId}/sequence/recipients/${recipientId}/stop`);
};

export const pauseAllSequence = async (campaignId: string): Promise<void> => {
  await api.patch(`/api/campaigns/${campaignId}/sequence/pause`);
};

export const resumeAllSequence = async (campaignId: string): Promise<void> => {
  await api.patch(`/api/campaigns/${campaignId}/sequence/resume`);
};

export const stopAllSequence = async (campaignId: string): Promise<void> => {
  await api.patch(`/api/campaigns/${campaignId}/sequence/stop`);
};

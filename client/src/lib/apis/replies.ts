import api from "../axios";
import type { ReplyMetrics, RepliedEmailDetail, UnrepliedEmailDetail } from "@/types";

export const getReplyMetrics = async (campaignId: string): Promise<ReplyMetrics> => {
  const res = await api.get(`/api/replies/campaigns/${campaignId}`);
  return res.data;
};

export const getRepliedEmails = async (campaignId: string): Promise<{ emails: RepliedEmailDetail[] }> => {
  const res = await api.get(`/api/replies/campaigns/${campaignId}/replied-emails`);
  return res.data;
};

export const getUnrepliedEmails = async (campaignId: string): Promise<{ emails: UnrepliedEmailDetail[] }> => {
  const res = await api.get(`/api/replies/campaigns/${campaignId}/unreplied-emails`);
  return res.data;
};

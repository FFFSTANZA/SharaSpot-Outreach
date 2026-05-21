import api from "../axios";
import type { TrackingMetrics, TrackingEmailDetail, TrackingLinkDetail, LinkAnalyticsDetail } from "@/types";

export const getTrackingMetrics = async (campaignId: string): Promise<TrackingMetrics> => {
  const res = await api.get(`/api/tracking/campaigns/${campaignId}`);
  return res.data;
};

export const getTrackingEmails = async (campaignId: string): Promise<{ emails: TrackingEmailDetail[] }> => {
  const res = await api.get(`/api/tracking/campaigns/${campaignId}/emails`);
  return res.data;
};

export const getTrackingLinks = async (campaignId: string): Promise<{ links: TrackingLinkDetail[] }> => {
  const res = await api.get(`/api/tracking/campaigns/${campaignId}/links`);
  return res.data;
};

export const getLinkAnalytics = async (campaignId: string): Promise<{ links: LinkAnalyticsDetail[] }> => {
  const res = await api.get(`/api/tracking/campaigns/${campaignId}/link-analytics`);
  return res.data;
};

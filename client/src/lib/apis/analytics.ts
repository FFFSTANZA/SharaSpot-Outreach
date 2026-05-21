import api from "../axios";
import type { AnalyticsOverview, AnalyticsLinksResponse, SenderHealthRecord, ActivityLogsResponse } from "@/types";
import type { DashboardStats } from "./subscription";

export const getAnalyticsOverview = async (days?: number): Promise<AnalyticsOverview> => {
  const qs = days ? `?days=${days}` : "";
  const res = await api.get(`/api/analytics/overview${qs}`);
  return res.data;
};

export const getAnalyticsLinks = async (): Promise<AnalyticsLinksResponse> => {
  const res = await api.get("/api/analytics/links");
  return res.data;
};

export const getSenderHealth = async (): Promise<{ health: SenderHealthRecord[] }> => {
  const res = await api.get("/api/analytics/sender-health");
  return res.data;
};

export const getActivityLogs = async (page = 1, limit = 50): Promise<ActivityLogsResponse> => {
  const res = await api.get(`/api/analytics/activity-logs?page=${page}&limit=${limit}`);
  return res.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/api/analytics/dashboard-stats");
  return res.data;
};

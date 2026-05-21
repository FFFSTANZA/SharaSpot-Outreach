import api from "../axios";
import type { PriorityQuota, PriorityCampaignStatus } from "@/types";

export interface SpamAnalysisResult { score: number; level: "safe" | "warning" | "high_risk" | "very_high_risk"; checks: Array<{ check: string; passed: boolean; details: string; penalty: number; }>; suggestions: string[]; }
export interface CalendlyGenerateParams { username: string; eventType?: string; prefill?: { name?: string; email?: string; company?: string; }; }
export interface CalendlyGenerateResult { url: string; button: { html: string; text: string; }; }

export const analyzeSpamScore = async (subject: string, body: string, html?: string): Promise<SpamAnalysisResult> => {
  const res = await api.post("/api/premium/analyze-spam", { subject, body, html });
  return res.data;
};

export const generateCalendlyLink = async (params: CalendlyGenerateParams): Promise<CalendlyGenerateResult> => {
  const res = await api.post("/api/premium/calendly/generate", params);
  return res.data;
};

export const verifyCalendlyLink = async (calendlyUrl: string, apiToken?: string): Promise<{ valid: boolean; username?: string; eventType?: string }> => {
  const res = await api.post("/api/premium/calendly/verify", { calendlyUrl, apiToken });
  return res.data;
};

export const getPriorityQuota = async (): Promise<PriorityQuota> => {
  const res = await api.get("/api/premium/priority/quota");
  return res.data;
};

export const getPriorityStatus = async (campaignId: string): Promise<PriorityCampaignStatus> => {
  const res = await api.get(`/api/premium/priority/status/${campaignId}`);
  return res.data;
};

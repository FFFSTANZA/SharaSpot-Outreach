import api from "./axios";
import type {
  CreateSenderPayload,
  CreateCampaignPayload,
  SenderResponse,
  Campaign,
  CampaignDetail,
  EmailJob,
  User,
  UploadedAttachment,
  EmailTemplate,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  SequenceResponse,
  Contact,
  Tag,
  ContactNote,
  ContactActivity,
  CreateContactPayload,
  UpdateContactPayload,
  CreateTagPayload,
  CreateNotePayload,
} from "@/types";

// ─── Auth ───

export const loginWithGoogle = async (idToken: string) => {
  const res = await api.post("/auth/google", { idToken });
  return res.data;
};

export const refreshAccessToken = async () => {
  const res = await api.post("/auth/refresh");
  return res.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};

// ─── Users ───

export const getUser = async (): Promise<User> => {
  const res = await api.get("/users");
  return res.data;
};

// ─── Senders ───

export const getSenders = async (): Promise<SenderResponse[]> => {
  const res = await api.get("/senders");
  return res.data;
};

// FIX: Was sending empty POST — now accepts CreateSenderPayload
export const createSender = async (
  data: CreateSenderPayload
): Promise<SenderResponse> => {
  const res = await api.post("/senders", data);
  return res.data;
};

// Verify an existing unverified sender by adding SMTP credentials
export const verifySender = async (
  senderId: string,
  data: { name?: string; appPassword: string; skipWarmup?: boolean }
): Promise<SenderResponse> => {
  const res = await api.patch(`/senders/${senderId}/verify`, data);
  return res.data;
};

// Get sender detail with throttle information
export const getSenderById = async (senderId: string): Promise<SenderResponse & {
  currentHourlyCount: number;
  currentDailyCount: number;
  effectiveDailyLimit: number;
  warmupStatus: string;
  cooldownState: { status: string; expiresAt: string | null };
}> => {
  const res = await api.get(`/senders/${senderId}`);
  return res.data;
};

// ─── Campaigns ───

export const createCampaign = async (
  data: CreateCampaignPayload
): Promise<{ campaignId: string; message: string }> => {
  const res = await api.post("/campaigns", data);
  return res.data;
};

// ─── Emails ───

export const toggleEmailStar = async (emailId: string): Promise<EmailJob> => {
  const res = await api.patch(`/emails/${emailId}/star`);
  return res.data;
};

// ─── Attachments ───

// WHY FormData: The upload endpoint expects multipart/form-data, not JSON.
// Axios automatically sets the Content-Type header to multipart/form-data
// when the body is a FormData instance.
export const uploadAttachments = async (
  files: File[],
): Promise<UploadedAttachment[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await api.post("/attachments/upload", formData);
  return res.data;
};

export const deleteAttachment = async (url: string): Promise<void> => {
  await api.delete("/attachments/delete", { data: { url } });
};


// ─── Templates ───

export const getTemplates = async (): Promise<EmailTemplate[]> => {
  const res = await api.get("/templates");
  return res.data;
};

export const createTemplate = async (
  data: CreateTemplatePayload
): Promise<EmailTemplate> => {
  const res = await api.post("/templates", data);
  return res.data;
};

export const updateTemplate = async (
  id: string,
  data: UpdateTemplatePayload
): Promise<EmailTemplate> => {
  const res = await api.put(`/templates/${id}`, data);
  return res.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/templates/${id}`);
};


// ─── Campaign Controls ───

export const getCampaignById = async (id: string): Promise<CampaignDetail> => {
  const res = await api.get(`/campaigns/${id}`);
  return res.data;
};

export const pauseCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.patch(`/campaigns/${id}/pause`);
  return res.data;
};

export const resumeCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.patch(`/campaigns/${id}/resume`);
  return res.data;
};

export const cancelCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.patch(`/campaigns/${id}/cancel`);
  return res.data;
};

// Throttle status — per-sender rate limit data for a campaign
export const getCampaignThrottleStatus = async (id: string): Promise<{
  campaignId: string;
  senders: {
    senderId: string;
    email: string;
    name: string | null;
    currentHourlyCount: number;
    currentDailyCount: number;
    effectiveLimits: { perMinute: number; perHour: number; perDay: number };
    warmupStatus: string;
    cooldownState: { status: string; expiresAt: string | null };
  }[];
}> => {
  const res = await api.get(`/campaigns/${id}/throttle-status`);
  return res.data;
};


// ─── Sequences ───

export const getSequence = async (campaignId: string): Promise<SequenceResponse> => {
  const res = await api.get(`/campaigns/${campaignId}/sequence`);
  return res.data;
};

export const pauseRecipientSequence = async (campaignId: string, recipientId: string): Promise<void> => {
  await api.patch(`/campaigns/${campaignId}/sequence/recipients/${recipientId}/pause`);
};

export const resumeRecipientSequence = async (campaignId: string, recipientId: string): Promise<void> => {
  await api.patch(`/campaigns/${campaignId}/sequence/recipients/${recipientId}/resume`);
};

export const stopRecipientSequence = async (campaignId: string, recipientId: string): Promise<void> => {
  await api.patch(`/campaigns/${campaignId}/sequence/recipients/${recipientId}/stop`);
};

export const pauseAllSequence = async (campaignId: string): Promise<void> => {
  await api.patch(`/campaigns/${campaignId}/sequence/pause`);
};

export const resumeAllSequence = async (campaignId: string): Promise<void> => {
  await api.patch(`/campaigns/${campaignId}/sequence/resume`);
};

export const stopAllSequence = async (campaignId: string): Promise<void> => {
  await api.patch(`/campaigns/${campaignId}/sequence/stop`);
};

export const toggleReplied = async (emailId: string): Promise<EmailJob> => {
  const res = await api.patch(`/emails/${emailId}/replied`);
  return res.data;
};


// ─── Tracking ───

import type { TrackingMetrics, TrackingEmailDetail, TrackingLinkDetail, LinkAnalyticsDetail, ReplyMetrics, RepliedEmailDetail, UnrepliedEmailDetail, AnalyticsOverview, AnalyticsLinksResponse, PriorityQuota, PriorityCampaignStatus } from "@/types";

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


// ─── Reply Tracking ───

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


// ─── Search ───

export const searchEmails = async (params: Record<string, string>): Promise<{ results: any[]; total: number; filters: Record<string, string> }> => {
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/emails/search?${qs}`);
  return res.data;
};

export const searchCampaigns = async (params: Record<string, string>): Promise<{ results: any[]; total: number; filters: Record<string, string> }> => {
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/campaigns/search?${qs}`);
  return res.data;
};


// ─── Analytics ───

export const getAnalyticsOverview = async (days?: number): Promise<AnalyticsOverview> => {
  const qs = days ? `?days=${days}` : "";
  const res = await api.get(`/api/analytics/overview${qs}`);
  return res.data;
};

export const getAnalyticsLinks = async (): Promise<AnalyticsLinksResponse> => {
  const res = await api.get("/api/analytics/links");
  return res.data;
};


// ─── Subscription ───

export interface SubscriptionResponse {
  isPremium: boolean;
  subscription: {
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
  } | null;
  pricing: {
    amount: number;
    interval: string;
    currency: string;
  };
}

export const getSubscription = async (): Promise<SubscriptionResponse> => {
  const res = await api.get("/api/subscription");
  return res.data;
};

export const createSubscription = async (): Promise<{ checkoutUrl: string; sessionId: string }> => {
  const res = await api.post("/api/subscription");
  return res.data;
};

export const cancelSubscription = async (): Promise<{ message: string }> => {
  const res = await api.post("/api/subscription/cancel");
  return res.data;
};

export const reactivateSubscription = async (): Promise<{ message: string }> => {
  const res = await api.post("/api/subscription/reactivate");
  return res.data;
};

export interface ValidationIssue {
  type: "syntax" | "mx_record" | "disposable" | "role_based" | "typo" | "subdomain" | "free_email" | "catch_all" | "suspicious_tld" | "missing_name";
  severity: "warning" | "error" | "info";
  message: string;
  suggestion?: string;
}

export interface ValidationCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

export interface ValidationResult {
  email: string;
  valid: boolean;
  issues: ValidationIssue[];
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  checks: ValidationCheck[];
  isFreeEmail: boolean;
  isCorporateEmail: boolean;
  isCatchAll: boolean;
}

export interface BatchValidationResponse {
  message: string;
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  freeEmails: number;
  corporateEmails: number;
  results: ValidationResult[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    syntaxErrors: number;
    mxErrors: number;
    disposableEmails: number;
    typosFound: number;
  };
  recommendations: string[];
  processingTimeMs: number;
  deduplicated: boolean;
  originalCount: number;
}

export const validateEmails = async (emails: string[]): Promise<BatchValidationResponse> => {
  const res = await api.post("/api/validate-emails", { emails });
  return res.data;
};

// ─── Premium Features ───

export interface SpamAnalysisResult {
  score: number;
  level: "safe" | "warning" | "high_risk" | "very_high_risk";
  checks: Array<{
    check: string;
    passed: boolean;
    details: string;
    penalty: number;
  }>;
  suggestions: string[];
}

export const analyzeSpamScore = async (
  subject: string,
  body: string,
  html?: string
): Promise<SpamAnalysisResult> => {
  const res = await api.post("/api/premium/analyze-spam", { subject, body, html });
  return res.data;
};

export interface CalendlyGenerateParams {
  username: string;
  eventType?: string;
  prefill?: {
    name?: string;
    email?: string;
    company?: string;
  };
}

export interface CalendlyGenerateResult {
  url: string;
  button: {
    html: string;
    text: string;
  };
}

export const generateCalendlyLink = async (
  params: CalendlyGenerateParams
): Promise<CalendlyGenerateResult> => {
  const res = await api.post("/api/premium/calendly/generate", params);
  return res.data;
};

export const verifyCalendlyLink = async (
  calendlyUrl: string,
  apiToken?: string
): Promise<{ valid: boolean; username?: string; eventType?: string }> => {
  const res = await api.post("/api/premium/calendly/verify", { calendlyUrl, apiToken });
  return res.data;
};

// ─── Priority Mail ───

export const getPriorityQuota = async (): Promise<PriorityQuota> => {
  const res = await api.get("/api/premium/priority/quota");
  return res.data;
};

export const getPriorityStatus = async (campaignId: string): Promise<PriorityCampaignStatus> => {
  const res = await api.get(`/api/premium/priority/status/${campaignId}`);
  return res.data;
};

// ─── PRM ───

export const getContacts = async (params: { search?: string; stage?: string; tag?: string } = {}): Promise<Contact[]> => {
  const qs = new URLSearchParams(params as any).toString();
  const res = await api.get(`/api/contacts${qs ? `?${qs}` : ""}`);
  return res.data;
};

export const getContactById = async (id: string): Promise<Contact> => {
  const res = await api.get(`/api/contacts/${id}`);
  return res.data;
};

export const createContact = async (data: CreateContactPayload): Promise<Contact> => {
  const res = await api.post("/api/contacts", data);
  return res.data;
};

export const updateContact = async (id: string, data: UpdateContactPayload): Promise<Contact> => {
  const res = await api.put(`/api/contacts/${id}`, data);
  return res.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/api/contacts/${id}`);
};

export const getTags = async (): Promise<Tag[]> => {
  const res = await api.get("/api/tags");
  return res.data;
};

export const createTag = async (data: CreateTagPayload): Promise<Tag> => {
  const res = await api.post("/api/tags", data);
  return res.data;
};

export const updateTag = async (id: string, data: { name?: string; color?: string }): Promise<Tag> => {
  const res = await api.put(`/api/tags/${id}`, data);
  return res.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`/api/tags/${id}`);
};

export const createNote = async (data: CreateNotePayload): Promise<ContactNote> => {
  const res = await api.post("/api/contacts/notes", data);
  return res.data;
};

export const updateNote = async (id: string, content: string): Promise<ContactNote> => {
  const res = await api.put(`/api/contacts/notes/${id}`, { content });
  return res.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await api.delete(`/api/contacts/notes/${id}`);
};

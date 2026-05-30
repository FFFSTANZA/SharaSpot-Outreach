import api from "../axios";

export interface DashboardStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  replied: number;
  efficiency: number;
  replyRate: number;
  worker: { status: "up" | "down" | "stale"; telemetry: { timestamp: number; memory: number; uptime: number; load: number } | null };
}

export interface SubscriptionResponse {
  isPremium: boolean;
  region?: string;
  subscription: { status: string; currentPeriodStart: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; trialEnd: string | null; dodoCustomerId: string | null; dodoSubscriptionId: string | null; } | null;
  pricing: { amount: number; interval: string; currency: string; trialDays: number };
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

export const createBillingPortalSession = async (): Promise<{ portalUrl: string }> => {
  const res = await api.post("/api/subscription/portal");
  return res.data;
};

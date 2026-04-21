export const SUBSCRIPTION_PRICE_USD = 29.00;
export const SUBSCRIPTION_PRICE_INR = 499.00;
export const SUBSCRIPTION_INTERVAL = "month";
export const SUBSCRIPTION_TRIAL_DAYS = 7;

export const PREMIUM_FEATURES = {
  unlimitedCampaigns: true,
  unlimitedSenders: true,
  prioritySupport: true,
  advancedAnalytics: true,
  customTemplates: true,
  apiAccess: true,
  priorityMail: true,
} as const;


export const DODO_PRODUCT_ID_GLOBAL = process.env.DODO_PRODUCT_ID_GLOBAL || "pdt_0NdSUs666T4IaNYC5YQGO";
export const DODO_PRODUCT_ID_INDIA = process.env.DODO_PRODUCT_ID_INDIA || "pdt_0NdSW8L98BDmeuwfx4dj6";

export const getReturnUrl = (userId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard?subscription=success&userId=${userId}`;
};

export const getCancelUrl = (userId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard?subscription=cancelled&userId=${userId}`;
};

export const PREMIUM_CACHE_PREFIX = "user:premium:";
export const PREMIUM_CACHE_TTL = 300; // 5 minutes

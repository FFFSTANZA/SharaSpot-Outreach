export const SUBSCRIPTION_PRICE_CENTS = 2000;
export const SUBSCRIPTION_PRICE_USD = 20.00;
export const SUBSCRIPTION_INTERVAL = "month";

export const PREMIUM_FEATURES = {
  unlimitedCampaigns: true,
  unlimitedSenders: true,
  prioritySupport: true,
  advancedAnalytics: true,
  customTemplates: true,
  apiAccess: true,
  priorityMail: true,
} as const;


export const DODO_PRODUCT_ID_MONTHLY = process.env.DODO_PRODUCT_ID_MONTHLY || "";

export const getReturnUrl = (userId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard?subscription=success&userId=${userId}`;
};

export const getCancelUrl = (userId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard?subscription=cancelled&userId=${userId}`;
};

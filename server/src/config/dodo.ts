import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY || "";
const isProduction = process.env.NODE_ENV === "production";

export const dodo = new DodoPayments({
  bearerToken: apiKey || "97tCfRpaWb_BWWtP.xMBZoVswubO5CbcYrntiJaJa-8tZjZuau0sKFONE4CGKBrA4",
  // Ensure we are in live_mode for production or if requested
  environment: isProduction || apiKey.includes(".") || apiKey.startsWith("sk_live") ? "live_mode" : "test_mode",
});

export const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || "whsec_cnHDDOySEw92LfzLroKP5Q+5mmmPfBva";

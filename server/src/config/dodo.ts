import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const isProduction = process.env.NODE_ENV === "production";

if (!apiKey && isProduction) {
  throw new Error("DODO_PAYMENTS_API_KEY is missing in production");
}

const isLiveKey = !!(apiKey && !apiKey.startsWith("sk_test_"));

export const dodo = new DodoPayments({
  bearerToken: apiKey || "",
  environment: (process.env.DODO_ENVIRONMENT === "live_mode" || process.env.DODO_ENVIRONMENT === "test_mode")
    ? process.env.DODO_ENVIRONMENT
    : (isLiveKey ? "live_mode" : "test_mode"),
});

console.log(`[DODO-BOOT] Mode: ${isLiveKey ? "LIVE" : "TEST"} (Prefix: ${apiKey?.substring(0, 4)}...)`);

export const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || "";

if (!DODO_WEBHOOK_SECRET && isProduction) {
  console.warn("WARNING: DODO_WEBHOOK_SECRET is missing in production. Webhooks will fail verification.");
}

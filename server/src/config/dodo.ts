import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const isProduction = process.env.NODE_ENV === "production";

if (!apiKey && isProduction) {
  throw new Error("DODO_PAYMENTS_API_KEY is missing in production");
}

const isLiveKey = !!(apiKey && (apiKey.startsWith("sk_live_") || (apiKey.includes(".") && !apiKey.startsWith("sk_test_"))));

export const dodo = new DodoPayments({
  bearerToken: apiKey || "",
  environment: isLiveKey ? "live_mode" : "test_mode",
});

console.log(`[DODO-BOOT] Initialized in ${isLiveKey ? "LIVE_MODE" : "TEST_MODE"}`);

export const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || "";

if (!DODO_WEBHOOK_SECRET && isProduction) {
  console.warn("WARNING: DODO_WEBHOOK_SECRET is missing in production. Webhooks will fail verification.");
}

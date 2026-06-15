import { logger } from "../utils/logger";

export function initSentry(dsn?: string, env?: string) {
  if (!dsn) {
    logger.warn("SENTRY_DSN not set — skipping Sentry initialization");
    return;
  }

  try {
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn,
      environment: env || "development",
      tracesSampleRate: env === "production" ? 0.1 : 0,
      profilesSampleRate: env === "production" ? 0.1 : 0,
      integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    });
    logger.info("Sentry initialized");
  } catch (err) {
    logger.error({ err }, "Failed to initialize Sentry");
  }
}

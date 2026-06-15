import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES: z.string().default("1h"),
  REFRESH_TOKEN_EXPIRES: z.string().default("30d"),
  ENCRYPTION_KEY: z.string().length(32).or(z.string().length(64)),
  TRACKING_BASE_URL: z.string().url().optional(),
  TRACKING_CNAME_TARGET: z.string().optional(),
  DODO_PAYMENTS_API_KEY: z.string().optional(),
  DODO_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().default("uploads"),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  COOKIE_SECURE: z.string().optional(),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).optional(),
  SENTRY_DSN: z.string().optional(),
  ALLOWED_REDIRECT_DOMAINS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig | null = null;

export function loadConfig(): EnvConfig {
  if (config) return config;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }

  config = result.data;
  return config;
}

export function getConfig(): EnvConfig {
  if (!config) {
    throw new Error("Config not loaded. Call loadConfig() at application startup.");
  }
  return config;
}

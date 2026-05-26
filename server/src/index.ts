import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import corsOptions from "./utils/corsOptions";
import { authMiddleware } from "./middlewares/authMiddleware";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { requireOrgWriteAccess } from "./middlewares/orgRoleMiddleware";
import { orgScopeMiddleware } from "./utils/orgScope";
import { rateLimit } from "express-rate-limit";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";
import { logger } from "./utils/logger";
import { loadConfig } from "./config/env";
import { trackingBuffer } from "./services/trackingBufferService";

const config = loadConfig();
logger.info({ env: config.NODE_ENV, port: config.PORT }, "Starting Gateway");

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), config.UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) {
  logger.debug("Creating uploads directory");
  fs.mkdirSync(uploadsDir, { recursive: true });
}

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "[CRITICAL] Unhandled Rejection");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "[CRITICAL] Uncaught Exception");
});

/* ROUTE IMPORTS */
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import senderRoutes from "./routes/senderRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import emailRoutes from "./routes/emailRoutes";
import attachmentRoutes from "./routes/attachmentRoutes";
import templateRoutes from "./routes/templateRoutes";
import followUpTemplateRoutes from "./routes/followUpTemplateRoutes";
import sequenceRoutes from "./routes/sequenceRoutes";
import trackingRoutes from "./routes/trackingRoutes";
import trackingMetricsRoutes from "./routes/trackingMetricsRoutes";
import replyRoutes from "./routes/replyRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import subscriptionRoutes, { webhookRouter } from "./routes/subscriptionRoutes";
import validationRoutes from "./routes/validationRoutes";
import premiumRoutes from "./routes/premiumRoutes";
import contactRoutes from "./routes/contactRoutes";
import tagRoutes from "./routes/tagRoutes";
import contactListRoutes from "./routes/contactListRoutes";
import inboxRoutes from "./routes/inboxRoutes";
import mcpRoutes from "./mcp/routes";
import mcpApiKeyRoutes from "./routes/mcpApiKeyRoutes";
import { initializeMCP } from "./mcp";
import adminRoutes from "./routes/adminRoutes";
import prmRoutes from "./routes/prmRoutes";
import callRoutes from "./routes/callRoutes";
import organizationRoutes, { publicOrganizationInviteRouter } from "./routes/organizationRoutes";


const app = express();
export { app };

// Important for rate limiting behind a proxy (Nginx)
app.set("trust proxy", 1);

/* CORE MIDDLEWARE */
if (config.NODE_ENV !== "development") {
  app.use(helmet());
  app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
}
app.use(morgan("common"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), config.UPLOAD_DIR)));

// Rate Limiting - Global & Auth specific
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === "development" ? 99999 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === "development" ? 99999 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts, please try again later" },
  validate: { xForwardedForHeader: false },
});

app.use("/api", globalLimiter);
app.use("/auth", authLimiter);

// Payload Limits - With Raw Body for Webhook Verification
app.use(express.json({
  limit: "2mb",
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

/* PUBLIC ROUTES */
interface HealthStatus {
  status: string; env: string; time: string;
  services: { api: string; database: string; redis: string; worker: string };
}

app.get("/health", async (req, res) => {
  const health: HealthStatus = {
    status: "optimal",
    env: config.NODE_ENV,
    time: new Date().toISOString(),
    services: {
      api: "up",
      database: "unknown",
      redis: "unknown",
      worker: "unknown",
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = "up";
  } catch (err) {
    health.services.database = "down";
    health.status = "degraded";
  }

  try {
    const ping = await redis.ping();
    health.services.redis = ping === "PONG" ? "up" : "down";

    const lastHeartbeat = await redis.get("worker:last_heartbeat");
    if (lastHeartbeat) {
      const diff = Date.now() - parseInt(lastHeartbeat, 10);
      health.services.worker = diff < 65000 ? "up" : "stale";
      if (health.services.worker === "stale") health.status = "degraded";
    } else {
      health.services.worker = "down";
      health.status = "degraded";
    }
  } catch (err) {
    health.services.redis = "down";
    health.status = "degraded";
  }

  const statusCode = health.status === "optimal" ? 200 : 503;
  res.status(statusCode).json(health);
});
app.use("/track", trackingRoutes);
app.use("/auth", authRoutes);
app.use("/api/subscription/webhook", webhookRouter);
app.use("/api/organizations/invites", publicOrganizationInviteRouter);

/* MCP Portal - Dedicated Auth supports API Keys & JWT */
app.use("/api/mcp", mcpRoutes);

/* ADMIN METRICS - Protected by secret key */
app.use("/api/admin", adminRoutes);

/* PROTECTED API ROUTES - Unified Prefix */
const api = express.Router();
api.use(authMiddleware);
api.use(orgScopeMiddleware);
api.use(requireOrgWriteAccess);

api.use("/users", userRoutes);
api.use("/senders", senderRoutes);
api.use("/campaigns", campaignRoutes);
api.use("/emails", emailRoutes);
api.use("/attachments", attachmentRoutes);
api.use("/templates", templateRoutes);
api.use("/follow-up-templates", followUpTemplateRoutes);
api.use("/tracking", trackingMetricsRoutes);
api.use("/replies", replyRoutes);
api.use("/analytics", analyticsRoutes);
api.use("/subscription", subscriptionRoutes);
api.use("/validation", validationRoutes);
api.use("/premium", premiumRoutes);
api.use("/contacts", contactRoutes);
api.use("/tags", tagRoutes);
api.use("/contact-lists", contactListRoutes);
api.use("/inbox", inboxRoutes);
api.use("/mcp-keys", mcpApiKeyRoutes);
api.use("/prm", prmRoutes);
api.use("/calls", callRoutes);
api.use("/organizations", organizationRoutes);


app.use("/api", api);

/* GLOBAL ERROR HANDLER */
app.use(errorMiddleware);

/* SERVER INITIALIZATION */
let server: ReturnType<typeof app.listen>;

if (config.NODE_ENV !== "test") {
  // Initialize tracking event buffer flusher
  trackingBuffer.start();

  // Initialize MCP Server
  initializeMCP();

  server = app.listen(config.PORT, "0.0.0.0", () => {
    logger.info({ port: config.PORT }, "[SHARASPOT] Gateway initialized");
  });
}

/* GRACEFUL SHUTDOWN */
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "[SHARASPOT] Shutting down gracefully");

  if (server) {
    server.close(() => {
      logger.info("[SHARASPOT] HTTP server closed");
    });
  }

  try {
    await prisma.$disconnect();
    logger.info("[SHARASPOT] Prisma disconnected");
    trackingBuffer.stop();
    await redis.quit();
    logger.info("[SHARASPOT] Redis disconnected");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "[SHARASPOT] Error during graceful shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

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
import { rateLimit } from "express-rate-limit";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";

console.log("[SHARASPOT-BOOT] Starting Gateway...");
console.log("[SHARASPOT-BOOT] NODE_ENV:", process.env.NODE_ENV);
console.log("[SHARASPOT-BOOT] PORT:", process.env.PORT);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  console.log("[SHARASPOT-BOOT] Creating uploads directory...");
  fs.mkdirSync(uploadsDir, { recursive: true });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] Uncaught Exception:", err);
});

/* ROUTE IMPORTS */
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import senderRoutes from "./routes/senderRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import emailRoutes from "./routes/emailRoutes";
import attachmentRoutes from "./routes/attachmentRoutes";
import templateRoutes from "./routes/templateRoutes";
import sequenceRoutes from "./routes/sequenceRoutes";
import trackingRoutes from "./routes/trackingRoutes";
import trackingMetricsRoutes from "./routes/trackingMetricsRoutes";
import replyRoutes from "./routes/replyRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { startTrackingBuffer, stopTrackingBuffer } from "./controllers/trackingControllers";
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


const app = express();
export { app };

// Important for rate limiting behind a proxy (Nginx)
app.set("trust proxy", 1);

/* CORE MIDDLEWARE */
if (process.env.NODE_ENV !== "development") {
  app.use(helmet());
  app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
}
app.use(morgan("common"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rate Limiting - Global & Auth specific
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 99999 : 10000, // Increased to 10,000
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 99999 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts, please try again later" },
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
app.get("/health", async (req, res) => {
  const health: any = {
    status: "optimal",
    env: process.env.NODE_ENV,
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
app.use("/api/subscription/webhook", webhookRouter); // Special public route for Stripe

/* MCP Portal - Dedicated Auth supports API Keys & JWT */
app.use("/api/mcp", mcpRoutes);

/* ADMIN METRICS - Protected by secret key */
app.use("/api/admin", adminRoutes);

/* PROTECTED API ROUTES - Unified Prefix */
const api = express.Router();
api.use(authMiddleware);

api.use("/users", userRoutes);
api.use("/senders", senderRoutes);
api.use("/campaigns", campaignRoutes);
api.use("/emails", emailRoutes);
api.use("/attachments", attachmentRoutes);
api.use("/templates", templateRoutes);
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


app.use("/api", api);

/* GLOBAL ERROR HANDLER */
app.use(errorMiddleware);

/* ENV VALIDATION */
const requiredEnvs = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY",
];

const missingEnvs = requiredEnvs.filter((e) => !process.env[e]);
if (missingEnvs.length > 0 && process.env.NODE_ENV !== "test") {
  console.error(`[CRITICAL] Missing required environment variables: ${missingEnvs.join(", ")}`);
  process.exit(1);
}

/* SERVER INITIALIZATION */
const port = Number(process.env.PORT) || 8000;
let server: any;

if (process.env.NODE_ENV !== "test") {
  // Initialize tracking event buffer flusher
  startTrackingBuffer();

  // Initialize MCP Server
  initializeMCP();

  server = app.listen(port, "0.0.0.0", () => {
    console.log(`[SHARASPOT] Gateway initialized on port ${port}`);
  });
}

/* GRACEFUL SHUTDOWN */
async function gracefulShutdown(signal: string) {
  console.log(`\n[SHARASPOT] Received ${signal}, shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log("[SHARASPOT] HTTP server closed");
    });
  }

  try {
    await prisma.$disconnect();
    console.log("[SHARASPOT] Prisma disconnected");
    stopTrackingBuffer();
    await redis.quit();
    console.log("[SHARASPOT] Redis disconnected");
    process.exit(0);
  } catch (err) {
    console.error("[SHARASPOT] Error during graceful shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

import dotenv from "dotenv";
dotenv.config();
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
import subscriptionRoutes, { webhookRouter } from "./routes/subscriptionRoutes";
import validationRoutes from "./routes/validationRoutes";
import premiumRoutes from "./routes/premiumRoutes";
import contactRoutes from "./routes/contactRoutes";
import tagRoutes from "./routes/tagRoutes";
import contactListRoutes from "./routes/contactListRoutes";

const app = express();
export { app };

/* CORE MIDDLEWARE */
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors(corsOptions));
app.use(cookieParser());

// Rate Limiting - Global & Auth specific
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict limit for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

app.use("/api", globalLimiter);
app.use("/auth", authLimiter);

// Payload Limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

/* PUBLIC ROUTES */
app.get("/health", (req, res) => res.status(200).json({ status: "optimal" }));
app.use("/track", trackingRoutes);
app.use("/auth", authRoutes);
app.use("/api/subscription/webhook", webhookRouter); // Special public route for Stripe

/* PROTECTED API ROUTES - Unified Prefix */
const api = express.Router();
api.use(authMiddleware);

api.use("/users", userRoutes);
api.use("/senders", senderRoutes);
api.use("/campaigns", campaignRoutes);
api.use("/emails", emailRoutes);
api.use("/attachments", attachmentRoutes);
api.use("/templates", templateRoutes);
api.use("/sequences", sequenceRoutes);
api.use("/tracking", trackingMetricsRoutes);
api.use("/replies", replyRoutes);
api.use("/analytics", analyticsRoutes);
api.use("/subscription", subscriptionRoutes);
api.use("/validation", validationRoutes);
api.use("/premium", premiumRoutes);
api.use("/contacts", contactRoutes);
api.use("/tags", tagRoutes);
api.use("/contact-lists", contactListRoutes);

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
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
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

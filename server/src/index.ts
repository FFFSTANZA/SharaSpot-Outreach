import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import corsOptions from "./utils/corsOptions";
import { authMiddleware } from "./middlewares/authMiddleware";

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

const app = express();

/* CORE MIDDLEWARE */
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json()); // Handles both json and urlencoded in most cases
app.use(express.urlencoded({ extended: false }));

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

app.use("/api", api);

/* SERVER INITIALIZATION */
const port = Number(process.env.PORT) || 8000;
app.listen(port, "0.0.0.0", () => {
  console.log(`[SHARASPOT] Gateway initialized on port ${port}`);
});

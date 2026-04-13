import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import corsOptions from "./utils/corsOptions";
import { authMiddleware } from "./middlewares/authMiddleware";

/* ROUTE IMPORT */
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
import snippetRoutes from "./routes/snippetRoutes";
import previewRoutes from "./routes/previewRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import commentRoutes from "./routes/commentRoutes";

/* CONFIGURATIONS */
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is the home route");
});
app.use("/track", trackingRoutes); // Public — no auth (email clients load these)
app.use("/auth", authRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/senders", authMiddleware, senderRoutes);
app.use("/campaigns", authMiddleware, campaignRoutes);
app.use("/emails", authMiddleware, emailRoutes);
app.use("/attachments", authMiddleware, attachmentRoutes);
app.use("/templates", authMiddleware, templateRoutes);
app.use("/campaigns/:id/sequence", authMiddleware, sequenceRoutes);
app.use("/api/tracking", authMiddleware, trackingMetricsRoutes);
app.use("/api/replies", authMiddleware, replyRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);
app.use("/api/subscription", authMiddleware, subscriptionRoutes);
app.use("/api/subscription/webhook", webhookRouter);
app.use("/api", authMiddleware, validationRoutes);
app.use("/api/premium", authMiddleware, premiumRoutes);
app.use("/api/snippets", authMiddleware, snippetRoutes);
app.use("/api/previews", authMiddleware, previewRoutes);
app.use("/api/webhooks", authMiddleware, webhookRoutes);
app.use("/api/comments", authMiddleware, commentRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 8000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

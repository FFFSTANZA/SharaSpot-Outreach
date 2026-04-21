import { Router } from "express";
import {
    getAnalyticsOverview,
    getAnalyticsLinks,
    getSenderHealth,
    getActivityLogs,
    getDashboardStats
} from "../controllers/analyticsControllers";

const router = Router();

router.get("/overview", getAnalyticsOverview);
router.get("/dashboard-stats", getDashboardStats);
router.get("/links", getAnalyticsLinks);
router.get("/sender-health", getSenderHealth);
router.get("/activity-logs", getActivityLogs);

export default router;

import { Router } from "express";
import {
  getCampaignTrackingMetrics,
  getCampaignTrackingEmails,
  getCampaignTrackingLinks,
  getCampaignLinkAnalytics,
} from "../controllers/trackingMetricsControllers";

const router = Router();

router.get("/campaigns/:campaignId", getCampaignTrackingMetrics);
router.get("/campaigns/:campaignId/emails", getCampaignTrackingEmails);
router.get("/campaigns/:campaignId/links", getCampaignTrackingLinks);
router.get("/campaigns/:campaignId/link-analytics", getCampaignLinkAnalytics);

export default router;

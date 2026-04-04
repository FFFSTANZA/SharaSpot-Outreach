import { Router } from "express";
import {
  getCampaignReplyMetrics,
  getCampaignRepliedEmails,
  getCampaignUnrepliedEmails,
} from "../controllers/replyControllers";

const router = Router();

router.get("/campaigns/:campaignId", getCampaignReplyMetrics);
router.get("/campaigns/:campaignId/replied-emails", getCampaignRepliedEmails);
router.get("/campaigns/:campaignId/unreplied-emails", getCampaignUnrepliedEmails);

export default router;

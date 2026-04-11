import { Router } from "express";
import { getAnalyticsOverview, getAnalyticsLinks } from "../controllers/analyticsControllers";

const router = Router();

router.get("/overview", getAnalyticsOverview);
router.get("/links", getAnalyticsLinks);

export default router;

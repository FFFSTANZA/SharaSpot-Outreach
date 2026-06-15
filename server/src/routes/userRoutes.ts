import { Router } from "express";
import {
  getTrackingDomainSettings,
  getUser,
  getUserEmails,
  updateUserSettings,
  updateUserName,
  upsertTrackingDomainSettings,
  verifyTrackingDomainSettings,
} from "../controllers/userControllers";
const router = Router();

router.get("/", getUser);
router.get("/emails", getUserEmails);
router.get("/settings/tracking-domain", getTrackingDomainSettings);
router.patch("/settings", updateUserSettings);
router.patch("/name", updateUserName);
router.put("/settings/tracking-domain", upsertTrackingDomainSettings);
router.post("/settings/tracking-domain/verify", verifyTrackingDomainSettings);

export default router;

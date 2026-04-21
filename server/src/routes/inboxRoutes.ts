import { Router } from "express";
import {
  getInboxThreads,
  getInboxEmails,
  getUnreadCount,
  syncInboxForSender,
  sendInboxReply,
  markInboxEmailRead,
  toggleInboxEmailStar,
  archiveInboxEmail,
  deleteInboxEmail,
} from "../controllers/inboxControllers";

const router = Router();

router.get("/threads", getInboxThreads);
router.get("/emails", getInboxEmails);
router.get("/unread-count", getUnreadCount);
router.post("/sync", syncInboxForSender);
router.post("/reply", sendInboxReply);
router.patch("/emails/:emailId/read", markInboxEmailRead);
router.patch("/emails/:emailId/star", toggleInboxEmailStar);
router.patch("/emails/:emailId/archive", archiveInboxEmail);
router.patch("/emails/:emailId/delete", deleteInboxEmail);

export default router;
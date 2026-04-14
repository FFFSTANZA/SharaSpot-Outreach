import { Router } from "express";
import {
  getSequence,
  pauseRecipient,
  resumeRecipient,
  stopRecipient,
  pauseSequence,
  resumeSequence,
  stopSequence,
  skipStep,
  forceSend,
  updateTiming,
  getSequenceAnalytics,
  getTimeline,
} from "../controllers/sequenceControllers";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
} from "../controllers/sequenceTemplateControllers";

// Mounted at /campaigns/:id/sequence — :id is merged from the parent router
const router = Router({ mergeParams: true });

// Campaign sequence data
router.get("/", getSequence);
router.get("/analytics", getSequenceAnalytics);
router.get("/timeline", getTimeline);

// Templates (These should probably be at /api/sequences/templates but let's keep them here or move them)
// Actually, let's put templates under a separate route in index.ts if they are not campaign-specific.

// Campaign-level controls
router.patch("/pause", pauseSequence);
router.patch("/resume", resumeSequence);
router.patch("/stop", stopSequence);

// Per-recipient controls
router.patch("/recipients/:recipientId/pause", pauseRecipient);
router.patch("/recipients/:recipientId/resume", resumeRecipient);
router.patch("/recipients/:recipientId/stop", stopRecipient);

// New per-recipient/step controls
router.patch("/recipients/:recipientId/steps/:stepNumber/skip", skipStep);
router.patch("/recipients/:recipientId/steps/:stepNumber/force", forceSend);
router.patch("/recipients/:recipientId/steps/:stepNumber/timing", updateTiming);

export default router;

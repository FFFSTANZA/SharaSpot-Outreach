import { Router } from "express";
import {
  createPrmSegment,
  dedupePrmContacts,
  executePrmBulkAction,
  getPrmLaunchGuardrails,
  getPrmQualitySummary,
  listPrmSegments,
  previewPrmSegment,
  undoPrmBulkAction,
  updatePrmSegment,
} from "../controllers/prmControllers";

const router = Router();

router.get("/quality-summary", getPrmQualitySummary);
router.post("/dedupe", dedupePrmContacts);
router.post("/segments", createPrmSegment);
router.get("/segments", listPrmSegments);
router.patch("/segments/:id", updatePrmSegment);
router.post("/segments/preview", previewPrmSegment);
router.post("/bulk-actions", executePrmBulkAction);
router.post("/bulk-actions/:undoToken/undo", undoPrmBulkAction);
router.get("/launch-guardrails", getPrmLaunchGuardrails);

export default router;

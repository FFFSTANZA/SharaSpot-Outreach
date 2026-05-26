import { Router } from "express";
import {
  createFollowUpTemplate,
  listFollowUpTemplates,
  getFollowUpTemplateById,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
} from "../controllers/followUpTemplateControllers";

const router = Router();

router.post("/", createFollowUpTemplate);
router.get("/", listFollowUpTemplates);
router.get("/:id", getFollowUpTemplateById);
router.put("/:id", updateFollowUpTemplate);
router.delete("/:id", deleteFollowUpTemplate);

export default router;

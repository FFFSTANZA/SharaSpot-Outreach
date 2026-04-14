import { Router } from "express";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
} from "../controllers/sequenceTemplateControllers";

const router = Router();

router.get("/", getTemplates);
router.post("/", createTemplate);
router.delete("/:id", deleteTemplate);

export default router;

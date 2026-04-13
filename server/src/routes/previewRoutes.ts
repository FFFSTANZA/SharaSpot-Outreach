import { Router } from "express";
import { previewTemplate } from "../controllers/previewControllers";

const router = Router();

router.post("/", previewTemplate);

export default router;

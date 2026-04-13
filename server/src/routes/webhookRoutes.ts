import { Router } from "express";
import { createWebhook, getWebhooks, deleteWebhook } from "../controllers/webhookControllers";

const router = Router();

router.post("/", createWebhook);
router.get("/", getWebhooks);
router.delete("/:id", deleteWebhook);

export default router;

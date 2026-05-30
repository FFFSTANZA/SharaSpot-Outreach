import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getSubscription,
  createSubscription,
  createBillingPortalSession,
  cancelUserSubscription,
  reactivateUserSubscription,
  handleWebhook,
} from "../controllers/subscriptionControllers";

const router = Router();

router.get("/", authMiddleware, getSubscription);

router.post("/", authMiddleware, createSubscription);

router.post("/cancel", authMiddleware, cancelUserSubscription);

router.post("/reactivate", authMiddleware, reactivateUserSubscription);

router.post("/portal", authMiddleware, createBillingPortalSession);

export default router;

export const webhookRouter = Router();

webhookRouter.post("/", handleWebhook);

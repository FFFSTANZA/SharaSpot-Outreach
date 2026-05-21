import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { handleOpen, handleClick } from "../controllers/trackingControllers";

// Public routes — no auth middleware. Email clients and browsers
// load these URLs without user session context.
const router = Router();

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/open/:emailJobId", trackingLimiter, handleOpen);
router.get("/click/:emailJobId", trackingLimiter, handleClick);

export default router;

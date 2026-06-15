import { Router } from "express";
import {
  createSender,
  updateSender,
  verifySender,
  getSenderEmails,
  getSenders,
  getSenderById,
  deleteSender,
} from "../controllers/senderControllers";
const router = Router();

router.get("/", getSenders);
router.get("/email", getSenderEmails);
router.get("/:id", getSenderById);
router.post("/", createSender);
router.patch("/:id/verify", verifySender);
router.put("/:id", updateSender);
router.delete("/:id", deleteSender);

export default router;

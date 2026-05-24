import { Router } from "express";
import { getUser, getUserEmails, updateUserSettings } from "../controllers/userControllers";
const router = Router();

router.get("/", getUser);
router.get("/emails", getUserEmails);
router.patch("/settings", updateUserSettings);

export default router;

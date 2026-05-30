import { Router } from "express";
import { getUser, getUserEmails, updateUserSettings, updateUserName } from "../controllers/userControllers";
const router = Router();

router.get("/", getUser);
router.get("/emails", getUserEmails);
router.patch("/settings", updateUserSettings);
router.patch("/name", updateUserName);

export default router;

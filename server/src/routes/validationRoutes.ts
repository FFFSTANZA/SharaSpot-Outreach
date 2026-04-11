import { Router } from "express";
import { validateRecipients } from "../controllers/validationController";

const router = Router();

router.post("/validate-emails", validateRecipients);

export default router;

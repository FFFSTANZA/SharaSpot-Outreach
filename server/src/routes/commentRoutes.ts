import { Router } from "express";
import { addComment, getComments } from "../controllers/draftCommentControllers";

const router = Router();

router.post("/", addComment);
router.get("/:campaignId", getComments);

export default router;

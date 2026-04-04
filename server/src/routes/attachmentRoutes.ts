import { Router } from "express";
import { uploadAttachments, deleteAttachment } from "../controllers/attachmentControllers";

const router = Router();

// POST /attachments/upload — multipart file upload to Supabase Storage
router.post("/upload", uploadAttachments);

// DELETE /attachments/delete — remove file from Supabase Storage
router.delete("/delete", deleteAttachment);

export default router;

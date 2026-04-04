import { Request, Response } from "express";
import multer from "multer";
import { supabase, SUPABASE_BUCKET, getSupabasePublicUrl } from "../config/supabase";
import { prisma } from "../config/prisma";

// ---------------------------------------------------------------------------
// Constants — file validation limits
// ---------------------------------------------------------------------------
// WHY 10 MB per file: Keeps individual uploads manageable and prevents
// a single large file from consuming all bandwidth.
// WHY 25 MB total: Gmail's attachment limit is 25 MB — exceeding this
// means the email will bounce, wasting the entire campaign job.
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;       // 10 MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;       // 25 MB total per upload

// Multer configured with memory storage — files stay in RAM as Buffers
// so we can stream them directly to Supabase Storage without writing to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files per upload request
  },
}).array("files");

/**
 * Upload a file buffer to Supabase Storage.
 */
async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  mimeType: string,
): Promise<void> {
  const { error } = await supabase
    .storage
    .from(SUPABASE_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;
}

/**
 * POST /attachments/upload
 *
 * Accepts multipart/form-data with one or more files in the "files" field.
 * Validates MIME types, per-file size, and total size before uploading to Supabase Storage.
 * Returns an array of {url, filename, size, mimeType} objects.
 */
export const uploadAttachments = (req: Request, res: Response): void => {
  upload(req, res, async (multerError) => {
    try {
      // Handle multer parsing errors (e.g., file too large)
      if (multerError) {
        if (multerError.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            message: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB size limit`,
          });
          return;
        }
        res.status(400).json({ message: "Invalid file upload" });
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ message: "No files provided" });
        return;
      }

      // Validate MIME types
      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
          res.status(400).json({
            message: `File type "${file.mimetype}" is not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, GIF`,
          });
          return;
        }
      }

      // Validate total size across all files
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        res.status(400).json({
          message: `Total upload size exceeds the ${MAX_TOTAL_SIZE / (1024 * 1024)} MB limit`,
        });
        return;
      }

      // Upload each file to Supabase Storage
      const results = [];
      for (const file of files) {
        const path = `attachments/${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
        await uploadToSupabase(file.buffer, path, file.mimetype);
        results.push({
          url: getSupabasePublicUrl(path),
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        });
      }

      res.status(200).json(results);
    } catch (error) {
      // Supabase upload failure or unexpected error
      console.error("Supabase upload error:", error);
      res.status(500).json({ message: "Failed to upload attachments" });
    }
  });
};

/**
 * DELETE /attachments/delete
 *
 * Deletes a file from Supabase Storage by its URL.
 */
export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      res.status(400).json({ message: "URL is required" });
      return;
    }

    // Verify the attachment belongs to a campaign owned by the authenticated user
    const attachment = await prisma.attachment.findFirst({
      where: { url },
      include: { campaign: { select: { userId: true } } },
    });

    if (attachment && attachment.campaign.userId !== req.user!.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Extract path from Supabase public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const urlParts = url.split("/object/public/");
    if (urlParts.length < 2) {
      res.status(400).json({ message: "Invalid Supabase Storage URL" });
      return;
    }

    const path = urlParts[1];

    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .remove([path]);

    if (error) throw error;

    res.status(200).json({ message: "Attachment deleted" });
  } catch (error) {
    console.error("Failed to delete attachment from Supabase:", error);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
};

import { Request, Response } from "express";
import multer from "multer";
import { prisma } from "../config/prisma";
import { getConfig } from "../config/env";
import { getOrgScope } from "../utils/orgScope";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { logger } from "../utils/logger";

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

// Multer configured with memory storage — we'll write to local disk manually
// so we can retain the same logic structure as before.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files per upload request
  },
}).array("files");

// Base URL for attachments - uses TRACKING_BASE_URL (e.g., https://yourdomain.com)
const getBaseUrl = () => {
  return process.env.TRACKING_BASE_URL || "https://sharaspot.in";
};

/**
 * Save a file buffer to local storage.
 */
async function saveToLocal(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const config = getConfig();
  const uploadsDir = path.join(process.cwd(), config.UPLOAD_DIR);
  const filePath = path.join(uploadsDir, filename);

  await fs.writeFile(filePath, buffer);

  return `${getBaseUrl()}/uploads/${filename}`;
}

/**
 * POST /attachments/upload
 *
 * Accepts multipart/form-data with one or more files in the "files" field.
 * Validates MIME types, per-file size, and total size before saving locally.
 * Returns an array of {url, filename, size, mimeType} objects.
 */
export const uploadAttachments = (req: Request, res: Response): void => {
  upload(req, res, async (multerError) => {
    try {
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

      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
          res.status(400).json({
            message: `File type "${file.mimetype}" is not allowed.`,
          });
          return;
        }
      }

      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        res.status(400).json({
          message: `Total upload size exceeds the ${MAX_TOTAL_SIZE / (1024 * 1024)} MB limit`,
        });
        return;
      }

      const results = [];
      for (const file of files) {
        // Sanitize original filename (remove special chars/spaces)
        const sanitizedOrig = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${crypto.randomUUID()}-${sanitizedOrig}`;

        const url = await saveToLocal(file.buffer, filename);

        results.push({
          url,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        });
      }

      res.status(200).json(results);
    } catch (error) {
      logger.error({ error }, "Local upload error");
      res.status(500).json({ message: "Failed to upload attachments locally" });
    }
  });
};

/**
 * DELETE /attachments/delete
 *
 * Deletes a file from local storage by its URL.
 */
export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      res.status(400).json({ message: "URL is required" });
      return;
    }

    const scope = getOrgScope(req);
    const attachment = await prisma.attachment.findFirst({
      where: { url, campaign: { ...scope } },
    });

    if (!attachment) {
      res.status(404).json({ message: "Attachment not found" });
      return;
    }

    // Extract filename from URL
    const urlParts = url.split("/uploads/");
    if (urlParts.length < 2) {
      res.status(400).json({ message: "Invalid Local Storage URL" });
      return;
    }

    const filename = urlParts[1];
    const config = getConfig();
    const filePath = path.join(process.cwd(), config.UPLOAD_DIR, filename);

    try {
      await fs.unlink(filePath);
    } catch (unlinkErr: any) {
      // If file not found, still return success to keep DB and disk in sync if possible
      if (unlinkErr.code !== "ENOENT") throw unlinkErr;
      logger.warn(`File not found on disk during deletion: ${filePath}`);
    }

    res.status(200).json({ message: "Attachment deleted from local storage" });
  } catch (error) {
    logger.error({ error }, "Failed to delete local attachment");
    res.status(500).json({ message: "Failed to delete attachment" });
  }
};

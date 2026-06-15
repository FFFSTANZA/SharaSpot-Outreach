import { Request, Response } from "express";
import { validateEmailsBatch, BatchValidationResult } from "../utils/emailValidator";
import { requirePremium } from "../utils/premiumCheck";
import { logger } from "../utils/logger";

export const validateRecipients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const premiumCheck = await requirePremium(req.user!.id, "Email Validation");
    if (!premiumCheck.allowed) {
      res.status(403).json({
        message: premiumCheck.message,
        upgradeRequired: true,
      });
      return;
    }

    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      res.status(400).json({
        message: "emails array is required",
      });
      return;
    }

    if (emails.length === 0) {
      res.status(400).json({
        message: "At least one email is required",
      });
      return;
    }

    if (emails.length > 1000) {
      res.status(400).json({
        message: "Maximum 1000 emails can be validated at once",
      });
      return;
    }

    const startTime = Date.now();
    const results: BatchValidationResult = await validateEmailsBatch(emails);
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      message: "Validation complete",
      ...results,
      processingTimeMs: processingTime,
      deduplicated: emails.length !== results.total,
      originalCount: emails.length,
    });
  } catch (error: unknown) {
    logger.error({ error }, "Email validation error");
    res.status(500).json({
      message: "Error validating emails",
    });
  }
};

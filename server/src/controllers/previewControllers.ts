import { Request, Response } from "express";
import { resolveVariables } from "../utils/templateParser";

export const previewTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, body, recipients } = req.body;

    if (!recipients || !Array.isArray(recipients)) {
      res.status(400).json({ message: "Recipients array is required" });
      return;
    }

    // Limit to first 10 for performance
    const previewRecipients = recipients.slice(0, 10);

    const previews = previewRecipients.map(recipient => {
      const context = {
        ...recipient.columnData,
        email: recipient.email,
      };
      return {
        email: recipient.email,
        subject: resolveVariables(subject, context),
        body: resolveVariables(body, context),
      };
    });

    res.status(200).json(previews);
  } catch (error) {
    res.status(500).json({ message: "Error generating previews" });
  }
};

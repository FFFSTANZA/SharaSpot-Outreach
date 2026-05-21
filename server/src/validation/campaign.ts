import { z } from "zod";

export const recipientEntrySchema = z.union([
  z.string(),
  z.object({ email: z.string(), columnData: z.record(z.string(), z.string()).optional() }),
]);

export const campaignBodySchema = z.object({
  senderIds: z.array(z.string()).optional(),
  senderId: z.string().optional(),
  subject: z.string().min(1, "Subject must be a non-empty string"),
  body: z.string().min(1, "Body must be a non-empty string"),
  startTime: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "startTime must be a valid date",
  }),
  delaySeconds: z.number().min(0, "delaySeconds must be a number >= 0"),
  hourlyLimit: z.number().positive("hourlyLimit must be a number > 0"),
  emails: z.array(recipientEntrySchema).min(1, "At least one recipient email is required"),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        filename: z.string(),
        size: z.number(),
        mimeType: z.string(),
      }),
    )
    .optional(),
  steps: z
    .array(
      z.object({
        subject: z.string(),
        body: z.string(),
        waitDays: z.number().int().min(1),
        condition: z.enum(["opened", "clicked", "replied", "none"]).optional(),
      }),
    )
    .optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  timezone: z.string().optional(),
  businessStartHour: z.number().optional(),
  businessEndHour: z.number().optional(),
  isPriority: z.boolean().optional(),
  replyTo: z.string().optional(),
});

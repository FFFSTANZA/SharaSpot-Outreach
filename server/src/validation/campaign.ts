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
        altSubjects: z.array(z.string().min(1)).max(3).optional(),
        sendHour: z.number().int().min(-1).max(23).optional(),
        waitHours: z.number().int().min(0).max(23).optional(),
      }),
    )
    .optional(),
  sequenceGraph: z
    .object({
      startNodeId: z.string().min(1),
      nodes: z.array(z.object({
        id: z.string().min(1),
        subject: z.string(),
        body: z.string(),
        waitDays: z.number().int().min(1),
        rules: z.any().optional(),
      })).min(1),
      edges: z.record(z.string(), z.object({
        onMatch: z.string().nullable().optional(),
        onNoMatch: z.string().nullable().optional(),
      })),
    })
    .optional(),
  sequenceSchedule: z
    .object({
      sendHour: z.number().int().min(-1).max(23),
      allowedDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      skipWeekends: z.boolean().optional(),
      skipHolidays: z.boolean().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  frequencyCaps: z
    .object({
      maxPerRecipient: z.number().int().min(0),
      maxPerDay: z.number().int().min(0),
      maxPerWeek: z.number().int().min(0),
    })
    .optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  timezone: z.string().optional(),
  businessStartHour: z.number().optional(),
  businessEndHour: z.number().optional(),
  isPriority: z.boolean().optional(),
  replyTo: z.string().optional(),
});

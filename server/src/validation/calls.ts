import { z } from "zod";
import { CALL_DISPOSITIONS, CALL_NEXT_ACTIONS } from "../utils/callDispositions";

export const createCallTaskSchema = z.object({
  contactId: z.string().min(1, "contactId is required"),
  dueAt: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "dueAt must be a valid date string",
  }),
  priority: z.number().int().min(0).max(100).optional().default(0),
  contactListId: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
});

export const updateCallTaskSchema = z.object({
  assignedToId: z.string().nullable().optional(),
});

export const logCallSchema = z.object({
  contactId: z.string().min(1, "contactId is required"),
  outcome: z.enum(CALL_DISPOSITIONS, `Invalid outcome. Must be one of: ${CALL_DISPOSITIONS.join(", ")}`),
  note: z.string().trim().max(2000).optional(),
  nextAction: z.enum(CALL_NEXT_ACTIONS).optional(),
  nextCallAt: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "nextCallAt must be a valid date string",
  }).optional(),
  taskId: z.string().optional(),
});

export const submitDispositionSchema = z.object({
  contactId: z.string().min(1, "contactId is required"),
  outcome: z.enum(CALL_DISPOSITIONS, `Invalid outcome. Must be one of: ${CALL_DISPOSITIONS.join(", ")}`),
  note: z.string().trim().max(2000).optional(),
  nextAction: z.enum(CALL_NEXT_ACTIONS).optional(),
  nextCallAt: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "nextCallAt must be a valid date string",
  }).optional(),
  sessionId: z.string().optional(),
  taskId: z.string().optional(),
});

export const getCallQueueSchema = z.object({
  status: z.enum(["ALL", "PENDING", "COMPLETED", "SKIPPED"]).optional().default("ALL"),
  due: z.enum(["all", "today", "overdue"]).optional().default("all"),
  search: z.string().optional(),
  listId: z.string().optional(),
  assignedToId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

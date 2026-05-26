import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { emailQueue } from "../queues/emailQueue";
import { logger } from "../utils/logger";
import { addBusinessDays } from "../utils/businessDays";
import { getDayOfWeekInTimezone, getHourInTimezone } from "../utils/businessHours";

type RuleOperand = { type: "opened" | "clicked" | "replied"; negate?: boolean; withinHours?: number };
type RuleGroup = { operator: "AND" | "OR"; operands?: RuleOperand[]; groups?: RuleGroup[] };
type AdvancedCondition = {
  v: 2;
  kind: "advanced";
  rules?: RuleGroup | null;
  onMatchStepNumber?: number | null;
  onNoMatchStepNumber?: number | null;
};

type SequenceScheduleConfig = {
  sendHour?: number;
  allowedDaysOfWeek?: number[];
  skipWeekends?: boolean;
  timezone?: string;
};

type FrequencyCaps = {
  maxPerRecipient?: number;
  maxPerDay?: number;
  maxPerWeek?: number;
};

type DecisionRecord = {
  at: string;
  fromStep: number;
  candidateStep: number;
  chosenStep: number | null;
  conditionMode: "advanced" | "simple" | "none";
  matched: boolean;
  fallbackTaken: boolean;
  reason: string;
};

function upsertStepMetrics(statusEntry: any, patch: Partial<Record<"entered" | "matched" | "fallbackTaken" | "sent" | "replied" | "skipped", number>>) {
  const base = statusEntry?.metrics ?? { entered: 0, matched: 0, fallbackTaken: 0, sent: 0, replied: 0, skipped: 0 };
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (!value) continue;
    next[key] = (next[key] ?? 0) + value;
  }
  return next;
}

function pushDecision(statuses: any[], stepNumber: number, record: DecisionRecord): any[] {
  const updated = [...statuses];
  const current = updated[stepNumber] ?? {};
  const decisionRecords = Array.isArray(current.decisionRecords) ? current.decisionRecords : [];
  updated[stepNumber] = {
    ...current,
    decisionRecords: [...decisionRecords, record].slice(-50),
  };
  return updated;
}

function parseAdvancedCondition(condition: string | null): AdvancedCondition | null {
  if (!condition || !condition.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(condition) as AdvancedCondition;
    if (parsed?.kind === "advanced" && parsed?.v === 2) return parsed;
  } catch {
    return null;
  }
  return null;
}

function parseSequenceConfig(raw: any): { schedule: SequenceScheduleConfig; frequencyCaps: FrequencyCaps } {
  const schedule = (raw?.schedule ?? {}) as SequenceScheduleConfig;
  const frequencyCaps = (raw?.frequencyCaps ?? {}) as FrequencyCaps;
  return { schedule, frequencyCaps };
}

function getAllowedDays(schedule: SequenceScheduleConfig): number[] {
  if (Array.isArray(schedule.allowedDaysOfWeek) && schedule.allowedDaysOfWeek.length > 0) {
    return schedule.allowedDaysOfWeek;
  }
  if (schedule.skipWeekends === true) return [1, 2, 3, 4, 5];
  return [0, 1, 2, 3, 4, 5, 6];
}

function computeNextSendTime(base: Date, schedule: SequenceScheduleConfig, fallbackTimezone: string): Date {
  const sendHour = typeof schedule.sendHour === "number" ? schedule.sendHour : -1;
  const timezone = schedule.timezone || fallbackTimezone || "UTC";
  const allowedDays = getAllowedDays(schedule);

  if (sendHour < 0 && allowedDays.length === 7) return base;

  let candidate = new Date(base.getTime());
  if (sendHour >= 0) candidate.setMinutes(0, 0, 0);
  // Search up to 14 days ahead, hour by hour.
  for (let i = 0; i < 24 * 14; i++) {
    const day = (() => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" });
        const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        return map[formatter.format(candidate)] ?? getDayOfWeekInTimezone(timezone);
      } catch {
        return candidate.getUTCDay();
      }
    })();
    const hour = (() => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
        const parsed = parseInt(formatter.format(candidate), 10);
        return Number.isNaN(parsed) ? getHourInTimezone(timezone) : parsed;
      } catch {
        return candidate.getUTCHours();
      }
    })();

    const dayOk = allowedDays.includes(day);
    const hourOk = sendHour < 0 ? true : hour === sendHour;
    if (dayOk && hourOk && candidate.getTime() >= base.getTime()) return candidate;

    candidate = new Date(candidate.getTime() + 60 * 60 * 1000);
  }

  return base;
}

function isCapExceeded(statuses: any[], caps: FrequencyCaps): boolean {
  const sentFollowUps = statuses.filter((s: any) => s?.stepNumber > 0 && s?.status === "SENT");
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const sentLastDay = sentFollowUps.filter((s: any) => s?.sentAt && new Date(s.sentAt).getTime() >= dayAgo).length;
  const sentLastWeek = sentFollowUps.filter((s: any) => s?.sentAt && new Date(s.sentAt).getTime() >= weekAgo).length;

  if ((caps.maxPerRecipient ?? 0) > 0 && sentFollowUps.length >= (caps.maxPerRecipient as number)) return true;
  if ((caps.maxPerDay ?? 0) > 0 && sentLastDay >= (caps.maxPerDay as number)) return true;
  if ((caps.maxPerWeek ?? 0) > 0 && sentLastWeek >= (caps.maxPerWeek as number)) return true;
  return false;
}

/**
 * Checks if a condition is satisfied for a given recipient's previous step email job.
 * Returns true if the condition is met (or if there is no condition).
 */
async function checkCondition(
  condition: string | null,
  emailJobId: string,
): Promise<boolean> {
  if (!condition || condition === "none") return true;
  if (!emailJobId) return false;

  // "replied" can be represented either by reply tracking events
  // or by a manual isReplied toggle from the UI.
  if (condition === "replied") {
    const job = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      select: { isReplied: true },
    });
    if (job?.isReplied) return true;
  }

  const eventType = condition === "opened" ? "OPEN" : condition === "clicked" ? "CLICK" : "REPLY";
  const events = await prisma.trackingEvent.findMany({
    where: { emailJobId, eventType },
    take: 1,
  });

  return events.length > 0;
}

async function evaluateRuleOperand(operand: RuleOperand, emailJobId: string, referenceSentAt?: string): Promise<boolean> {
  let isMatched = await checkCondition(operand.type, emailJobId);
  if (isMatched && operand.withinHours && referenceSentAt) {
    const threshold = new Date(referenceSentAt).getTime() + operand.withinHours * 3600 * 1000;
    const eventType = operand.type === "opened" ? "OPEN" : operand.type === "clicked" ? "CLICK" : "REPLY";
    const event = await prisma.trackingEvent.findFirst({
      where: { emailJobId, eventType },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    isMatched = !!event && event.createdAt.getTime() <= threshold;
  }
  return operand.negate ? !isMatched : isMatched;
}

async function evaluateRuleGroup(group: RuleGroup | undefined, emailJobId: string, referenceSentAt?: string): Promise<boolean> {
  if (!group) return true;
  const operandResults: boolean[] = [];
  for (const operand of group.operands ?? []) {
    operandResults.push(await evaluateRuleOperand(operand, emailJobId, referenceSentAt));
  }
  const groupResults: boolean[] = [];
  for (const nested of group.groups ?? []) {
    groupResults.push(await evaluateRuleGroup(nested, emailJobId, referenceSentAt));
  }
  const results = [...operandResults, ...groupResults];
  if (results.length === 0) return true;
  return group.operator === "AND" ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Sequence Scheduler — runs on a recurring interval to evaluate which recipients
 * are due for their next follow-up step and enqueues the corresponding email jobs.
 *
 * Optimized with batch queries to avoid N+1 patterns on large campaigns.
 */
export async function processSchedulerJob(): Promise<void> {
  logger.info("[SequenceScheduler] Running scheduler tick...");

  // Find all campaigns that have sequence steps
  const campaigns = await prisma.emailCampaign.findMany({
    where: {
      sequenceSteps: { some: {} },
      status: { in: ["SCHEDULED", "SENDING"] },
    },
    select: {
      id: true,
      senderId: true,
      delaySeconds: true,
      sequenceConfig: true,
      timezone: true,
      businessStartHour: true,
      businessEndHour: true,
      startTime: true,
      sequenceSteps: { orderBy: { stepNumber: "asc" } },
      campaignSenders: {
        orderBy: { rotationOrder: "asc" },
        select: { senderId: true, rotationOrder: true },
      },
    },
  });

  for (const campaign of campaigns) {
    const { schedule, frequencyCaps } = parseSequenceConfig(campaign.sequenceConfig as any);
    const totalSteps = campaign.sequenceSteps.length;
    const stepMap = new Map(campaign.sequenceSteps.map((s) => [s.stepNumber, s]));
    const poolSenders = campaign.campaignSenders;

    // Batch fetch step job counts for all steps in this campaign
    const stepJobCounts: Record<string, number> = {};
    if (poolSenders.length > 0) {
      const counts = await prisma.emailJob.groupBy({
        by: ["sequenceStepId"],
        _count: { id: true },
        where: { campaignId: campaign.id, sequenceStepId: { not: null } },
      });
      for (const c of counts) {
        if (c.sequenceStepId) stepJobCounts[c.sequenceStepId] = c._count.id;
      }
    }

    // Batch fetch original jobs (step 0) for all recipients in this campaign
    const originalJobs = await prisma.emailJob.findMany({
      where: { campaignId: campaign.id, columnData: { not: Prisma.DbNull } },
      select: { toEmail: true, columnData: true },
    });
    const columnDataMap = new Map<string, any>();
    for (const job of originalJobs) {
      if (!columnDataMap.has(job.toEmail)) {
        columnDataMap.set(job.toEmail, job.columnData);
      }
    }

    // Find recipients due for next step
    const recipients = await prisma.recipientSequenceState.findMany({
      where: {
        campaignId: campaign.id,
        completed: false,
        paused: false,
        replied: false,
      },
    });

    // Collect recipients that need updates
    const toComplete: string[] = [];
    const toSkipUpdates: Array<{ id: string; statuses: any[] }> = [];
    const toSchedule: Array<{
      recipientId: string;
      recipientEmail: string;
      currentStep: number;
      nextStepNumber: number;
      nextStep: any;
      currentStatus: any;
      statuses: any[];
    }> = [];

    for (const recipient of recipients) {
      try {
        let currentStep = recipient.currentStep;
        let statuses = recipient.stepStatuses as any[];
        let currentStatus = statuses[currentStep];

        // Handle SKIPPED steps — advance immediately in a loop
        while (currentStatus && currentStatus.status === "SKIPPED") {
          const nextStepNumber = currentStep + 1;
          if (nextStepNumber >= totalSteps) {
            toComplete.push(recipient.id);
            currentStatus = null;
            break;
          }
          const nextStep = stepMap.get(nextStepNumber);
          if (!nextStep) break;

          // Advance: set next step to PENDING
          const updatedStatuses = [...statuses];
          updatedStatuses[nextStepNumber] = { ...updatedStatuses[nextStepNumber], status: "PENDING" };
          statuses = updatedStatuses;
          currentStep = nextStepNumber;
          currentStatus = statuses[currentStep];
        }

        // Persist SKIPPED→PENDING advances
        if (currentStep !== recipient.currentStep && currentStatus !== null) {
          toSkipUpdates.push({ id: recipient.id, statuses });
        }

        if (!currentStatus || currentStatus.status !== "SENT") continue;

        if (isCapExceeded(statuses, frequencyCaps)) {
          toComplete.push(recipient.id);
          continue;
        }

        const linearNextStepNumber = currentStep + 1;
        if (linearNextStepNumber >= totalSteps) {
          toComplete.push(recipient.id);
          continue;
        }

        const nextStep = stepMap.get(linearNextStepNumber);
        if (!nextStep) continue;

        // Check if wait period has elapsed (using business days)
        const sentAt = new Date(currentStatus.sentAt);
        const dueAt = addBusinessDays(sentAt, nextStep.waitDays);
        if (new Date() < dueAt) continue;

        let targetStepNumber = linearNextStepNumber;
        const advanced = parseAdvancedCondition(nextStep.condition);
        let conditionMet = true;
        if (advanced) {
          conditionMet = await evaluateRuleGroup(advanced.rules ?? undefined, currentStatus.emailJobId, currentStatus.sentAt);
          const branchTarget = conditionMet ? advanced.onMatchStepNumber : advanced.onNoMatchStepNumber;
          if (typeof branchTarget === "number") {
            targetStepNumber = branchTarget;
          } else if (!conditionMet) {
            targetStepNumber = totalSteps;
          }
        } else if (nextStep.condition && nextStep.condition !== "none") {
          conditionMet = await checkCondition(nextStep.condition, currentStatus.emailJobId);
          if (!conditionMet) targetStepNumber = linearNextStepNumber + 1;
        }

        if (targetStepNumber >= totalSteps) {
          const decisionStep = Math.min(linearNextStepNumber, totalSteps - 1);
          const decisionStatuses = pushDecision(statuses, decisionStep, {
            at: new Date().toISOString(),
            fromStep: currentStep,
            candidateStep: linearNextStepNumber,
            chosenStep: null,
            conditionMode: advanced ? "advanced" : nextStep.condition && nextStep.condition !== "none" ? "simple" : "none",
            matched: conditionMet,
            fallbackTaken: !conditionMet,
            reason: "no-next-step",
          });
          toSkipUpdates.push({ id: recipient.id, statuses: decisionStatuses });
          toComplete.push(recipient.id);
          continue;
        }

        if (targetStepNumber !== linearNextStepNumber) {
          const updatedStatuses = [...statuses];
          if (advanced && !conditionMet) {
            updatedStatuses[linearNextStepNumber] = {
              ...updatedStatuses[linearNextStepNumber],
              status: "SKIPPED",
              lastRuleMatched: false,
              decisionAt: new Date().toISOString(),
              metrics: upsertStepMetrics(updatedStatuses[linearNextStepNumber], { entered: 1, fallbackTaken: 1, skipped: 1 }),
            };
          }
          const withDecision = pushDecision(updatedStatuses, linearNextStepNumber, {
            at: new Date().toISOString(),
            fromStep: currentStep,
            candidateStep: linearNextStepNumber,
            chosenStep: targetStepNumber,
            conditionMode: advanced ? "advanced" : "simple",
            matched: conditionMet,
            fallbackTaken: !conditionMet,
            reason: "branch-target",
          });
          statuses = withDecision;
          toSkipUpdates.push({ id: recipient.id, statuses: withDecision });
        }

        toSchedule.push({
          recipientId: recipient.id,
          recipientEmail: recipient.recipientEmail,
          currentStep,
          nextStepNumber: targetStepNumber,
          nextStep: stepMap.get(targetStepNumber),
          currentStatus,
          statuses,
        });
      } catch (err) {
        logger.error({ err }, `[SequenceScheduler] Error evaluating recipient ${recipient.recipientEmail}`);
      }
    }

    // Batch: mark completed
    if (toComplete.length > 0) {
      await prisma.recipientSequenceState.updateMany({
        where: { id: { in: toComplete } },
        data: { completed: true },
      });
    }

    // Batch: persist skip/advance updates
    for (const skip of toSkipUpdates) {
      await prisma.recipientSequenceState.update({
        where: { id: skip.id },
        data: { stepStatuses: skip.statuses },
      });
    }

    // Process scheduling with atomic claims and staggered timing
    // Spread follow-ups across the campaign's delay interval to avoid thundering herd
    const perJobIntervalMs = Math.max(5000, (campaign.delaySeconds || 15) * 1000);
    for (let schedIdx = 0; schedIdx < toSchedule.length; schedIdx++) {
      const item = toSchedule[schedIdx];

      // Atomic claim: advance currentStep only if it hasn't changed
      const claimResult = await prisma.recipientSequenceState.updateMany({
        where: { id: item.recipientId, currentStep: item.currentStep },
        data: { currentStep: item.nextStepNumber },
      });

      if (claimResult.count === 0) continue;

      const { recipientId, recipientEmail, nextStepNumber, nextStep, statuses } = item;
      if (!nextStep) continue;

      // Update step status to SCHEDULED
      const updatedStatuses = [...statuses];
      updatedStatuses[nextStepNumber] = {
        ...updatedStatuses[nextStepNumber],
        status: "SCHEDULED",
        metrics: upsertStepMetrics(updatedStatuses[nextStepNumber], { entered: 1 }),
      };

      // Determine sender via round-robin (using pre-fetched counts)
      let assignedSenderId = campaign.senderId;
      if (poolSenders.length > 0) {
        const stepJobCount = stepJobCounts[nextStep.id] || 0;
        assignedSenderId = poolSenders[stepJobCount % poolSenders.length].senderId;
      }

      const columnData = columnDataMap.get(recipientEmail);

      // Stagger scheduledAt within this batch, matching the campaign's send rhythm
      const jitterMs = Math.floor(Math.random() * 5000);
      const offsetMs = schedIdx * perJobIntervalMs + jitterMs;
      const baseScheduledAt = new Date(Date.now() + offsetMs);
      const scheduledAt = computeNextSendTime(baseScheduledAt, schedule, campaign.timezone || "UTC");

      const emailJob = await prisma.emailJob.create({
        data: {
          campaignId: campaign.id,
          toEmail: recipientEmail,
          scheduledAt,
          sequenceStepId: nextStep.id,
          ...(assignedSenderId ? { senderId: assignedSenderId } : {}),
          ...(columnData ? { columnData } : {}),
        },
      });

      // Update step status with emailJobId
      updatedStatuses[nextStepNumber].emailJobId = emailJob.id;
      updatedStatuses[nextStepNumber].decisionRecords = [
        ...((updatedStatuses[nextStepNumber].decisionRecords ?? []) as any[]),
        {
          at: new Date().toISOString(),
          fromStep: item.currentStep,
          candidateStep: item.nextStepNumber,
          chosenStep: item.nextStepNumber,
          conditionMode: "none",
          matched: true,
          fallbackTaken: false,
          reason: "scheduled",
        } satisfies DecisionRecord,
      ].slice(-50);
      await prisma.recipientSequenceState.update({
        where: { id: recipientId },
        data: { stepStatuses: updatedStatuses },
      });

      // Increment step job count for round-robin
      stepJobCounts[nextStep.id] = (stepJobCounts[nextStep.id] || 0) + 1;

      // Enqueue into BullMQ with matching delay so the queue fires at the right time
      const delay = Math.max(0, scheduledAt.getTime() - Date.now());
      await emailQueue.add(
        "send-email",
        { emailJobId: emailJob.id },
        { jobId: `${emailJob.id}-${crypto.randomUUID()}`, delay }
      );

      logger.info(
        `[SequenceScheduler] Enqueued step ${nextStepNumber} for ${recipientEmail} ` +
        `in campaign ${campaign.id} (scheduledAt: ${scheduledAt.toISOString()}, delay: ${delay}ms)`
      );
    }

    // Check if the overall campaign is complete
    try {
      const [activeStatesCount, nonTerminalJobsCount] = await Promise.all([
        prisma.recipientSequenceState.count({
          where: { campaignId: campaign.id, completed: false, paused: false, replied: false },
        }),
        prisma.emailJob.count({
          where: { campaignId: campaign.id, status: { notIn: ["SENT", "FAILED", "CANCELLED"] } },
        }),
      ]);

      if (activeStatesCount === 0 && nonTerminalJobsCount === 0) {
        await prisma.emailCampaign.updateMany({
          where: { id: campaign.id, status: "SENDING" },
          data: { status: "COMPLETED" },
        });
        logger.info(`[SequenceScheduler] Campaign ${campaign.id} marked as COMPLETED`);
      }
    } catch (err) {
      logger.error({ err }, `[SequenceScheduler] Error checking completion for campaign ${campaign.id}`);
    }
  }

  logger.info("[SequenceScheduler] Scheduler tick complete.");
}

import { prisma } from "../config/prisma";

export type ConditionType = 
  | "if_no_reply" 
  | "if_opened" 
  | "if_not_opened" 
  | "if_clicked" 
  | "if_not_clicked";

export interface StepCondition {
  type: ConditionType;
  // For 'if_clicked' we might want to specify which URL, but for now let's keep it simple
}

/**
 * Evaluates if a recipient meets the conditions to proceed to the next step.
 */
export async function evaluateConditions(
  recipientEmail: string,
  campaignId: string,
  conditions: StepCondition[] | null
): Promise<boolean> {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions means always send
  }

  // Find all previous email jobs for this recipient in this campaign
  const previousJobs = await prisma.emailJob.findMany({
    where: {
      campaignId,
      toEmail: recipientEmail,
      status: "SENT",
    },
    select: {
      id: true,
      isReplied: true,
      trackingEvents: {
        select: {
          eventType: true,
        },
      },
    },
  });

  for (const condition of conditions) {
    switch (condition.type) {
      case "if_no_reply":
        if (previousJobs.some((job) => job.isReplied)) {
          return false;
        }
        break;
      case "if_opened":
        if (!previousJobs.some((job) => job.trackingEvents.some((e) => e.eventType === "OPEN"))) {
          return false;
        }
        break;
      case "if_not_opened":
        if (previousJobs.some((job) => job.trackingEvents.some((e) => e.eventType === "OPEN"))) {
          return false;
        }
        break;
      case "if_clicked":
        if (!previousJobs.some((job) => job.trackingEvents.some((e) => e.eventType === "CLICK"))) {
          return false;
        }
        break;
      case "if_not_clicked":
        if (previousJobs.some((job) => job.trackingEvents.some((e) => e.eventType === "CLICK"))) {
          return false;
        }
        break;
    }
  }

  return true;
}

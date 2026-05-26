import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import { upsertContact, logContactActivity } from "../utils/contactService";
import { resolveForRecipient } from "../utils/variableResolver";
import { parseVariables } from "../utils/templateParser";
import {
  validateSequenceSteps,
  validateSequenceGraph,
  legacyStepsToGraph,
  SequenceStepInput,
  SequenceGraphInput,
  SequenceScheduleConfig,
  FrequencyCap,
} from "../utils/sequenceValidation";
import { assignSendersRoundRobin, createCampaignSenderData } from "../utils/senderRotation";
import { requirePremium } from "../utils/premiumCheck";

export interface CreateCampaignInput {
  senderIds: string[];
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  emails: Array<string | { email: string; columnData?: Record<string, string> }>;
  attachments?: Array<{ url: string; filename: string; size: number; mimeType: string }>;
  steps?: SequenceStepInput[];
  sequenceGraph?: SequenceGraphInput;
  sequenceSchedule?: SequenceScheduleConfig;
  frequencyCaps?: FrequencyCap;
  trackOpens?: boolean;
  trackClicks?: boolean;
  timezone?: string;
  businessStartHour?: number | null;
  businessEndHour?: number | null;
  isPriority?: boolean;
  replyTo?: string;
}

export interface CampaignCreationResult {
  campaignId: string;
  emailJobs: Array<{ id: string; scheduledAt: Date }>;
  senderPool: Array<{
    senderId: string;
    email: string;
    name: string | null;
    dailyLimit: number;
    rotationOrder: number;
  }>;
  skippedCount?: number;
  skipReasons?: {
    bounced: number;
    invalidFormat: number;
  };
}

export class CampaignService {
  async createCampaign(userId: string, input: CreateCampaignInput): Promise<CampaignCreationResult> {
    const {
      senderIds,
      subject,
      body,
      startTime,
      delaySeconds,
      hourlyLimit,
      emails,
      attachments,
      steps,
      sequenceGraph,
      sequenceSchedule,
      frequencyCaps,
      trackOpens: rawTrackOpens,
      trackClicks: rawTrackClicks,
      timezone,
      businessStartHour,
      businessEndHour,
      isPriority,
      replyTo,
    } = input;

    const trackOpens = rawTrackOpens !== false;
    const trackClicks = rawTrackClicks === true;
    const tz = timezone ?? "UTC";
    // Default to 8 AM–6 PM if the user doesn't configure business hours.
    // Outreach emails sent during working hours get significantly higher engagement,
    // and higher engagement signals improve sender reputation over time.
    const bStart = typeof businessStartHour === "number" ? businessStartHour : 8;
    const bEnd = typeof businessEndHour === "number" ? businessEndHour : 18;

    const senders = await prisma.sender.findMany({
      where: { id: { in: senderIds }, userId },
    });

    if (senders.length !== senderIds.length) {
      throw new CampaignError("Sender not found or not owned by you", "SENDER_NOT_FOUND", 403);
    }

    const unverifiedSenders = senders.filter((s) => !s.isVerified);
    if (unverifiedSenders.length > 0) {
      throw new CampaignError("All senders must be verified", "SENDER_NOT_VERIFIED", 400);
    }

    if (senderIds.length > 1) {
      const premiumCheck = await requirePremium(userId, "Multi-sender routing");
      if (!premiumCheck.allowed) {
        throw new CampaignError(premiumCheck.message || "Multi-sender routing requires a premium subscription", "PREMIUM_REQUIRED", 403, true);
      }
    }

    if (isPriority === true) {
      const premiumCheck = await requirePremium(userId, "Priority Mail");
      if (!premiumCheck.allowed) {
        throw new CampaignError(premiumCheck.message || "Priority Mail requires a premium subscription", "PREMIUM_REQUIRED", 403, true);
      }
    }

    const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024;
    if (attachments && attachments.length > 0) {
      const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
      if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
        throw new CampaignError("Total attachment size exceeds the 25 MB limit", "ATTACHMENT_SIZE_EXCEEDED");
      }
    }

    let resolvedSteps = steps;
    let resolvedGraph = sequenceGraph;
    if (!resolvedGraph && resolvedSteps && resolvedSteps.length > 0) {
      resolvedGraph = legacyStepsToGraph(resolvedSteps);
    }
    if (!resolvedSteps && resolvedGraph) {
      resolvedSteps = resolvedGraph.nodes.map((n) => ({ subject: n.subject, body: n.body, waitDays: n.waitDays }));
    }

    if (resolvedSteps && resolvedSteps.length > 0 && !resolvedGraph) {
      const validation = validateSequenceSteps(resolvedSteps);
      if (!validation.valid) {
        throw new CampaignError(validation.message!, "INVALID_SEQUENCE");
      }
    }
    if (resolvedGraph) {
      const graphValidation = validateSequenceGraph(resolvedGraph);
      if (!graphValidation.valid) {
        throw new CampaignError(graphValidation.message!, "INVALID_SEQUENCE_GRAPH");
      }
    }

    const seen = new Set<string>();
    const allEmails = emails.map(e => (typeof e === "string" ? e : e.email).toLowerCase().trim());
    
    const bounces = await prisma.bounceList.findMany({
      where: { userId, email: { in: allEmails } },
      select: { email: true }
    });
    const bounceSet = new Set(bounces.map(b => b.email));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let bouncedCount = 0;
    let invalidCount = 0;

    const recipients: Array<{ email: string; columnData?: Record<string, string> }> = [];
    for (const entry of emails) {
      const email = (typeof entry === "string" ? entry : entry.email).toLowerCase().trim();
      
      if (!emailRegex.test(email)) {
        invalidCount++;
        continue;
      }
      
      if (bounceSet.has(email)) {
        bouncedCount++;
        continue;
      }

      if (!seen.has(email)) {
        seen.add(email);
        recipients.push({
          email,
          columnData: typeof entry === "object" ? entry.columnData : undefined,
        });
      }
    }

    if (recipients.length === 0) {
      throw new CampaignError("No valid recipients remaining after filtering bounces and invalid formats", "NO_VALID_RECIPIENTS", 400);
    }

    const scheduledAt = new Date(startTime);
    const hasVariables = parseVariables(subject).length > 0 || parseVariables(body).length > 0;

    const campaignSenderData = createCampaignSenderData(senderIds);
    const poolSenders = campaignSenderData.map((cs) => {
      const sender = senders.find((s) => s.id === cs.senderId)!;
      return {
        senderId: cs.senderId,
        rotationOrder: cs.rotationOrder,
        dailyLimit: sender.dailyLimit,
      };
    });
    const senderAssignments = assignSendersRoundRobin(poolSenders, recipients.length);

    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.emailCampaign.create({
        data: {
          userId,
          senderId: senderIds[0],
          subject,
          body,
          startTime: scheduledAt,
          delaySeconds,
          hourlyLimit,
          totalRecipients: recipients.length,
          trackOpens,
          trackClicks,
          timezone: tz,
          businessStartHour: bStart,
          businessEndHour: bEnd,
          isPriority: isPriority === true,
          replyTo: replyTo || null,
          sequenceConfig: (sequenceSchedule || frequencyCaps)
            ? JSON.parse(JSON.stringify({ schedule: sequenceSchedule ?? null, frequencyCaps: frequencyCaps ?? null }))
            : Prisma.DbNull,
        },
      });

      const campaignSenders = [];
      for (const csData of campaignSenderData) {
        const cs = await tx.campaignSender.create({
          data: {
            campaignId: campaign.id,
            senderId: csData.senderId,
            rotationOrder: csData.rotationOrder,
          },
        });
        campaignSenders.push(cs);
      }

      const assignmentMap = new Map<number, string>();
      for (const assignment of senderAssignments) {
        assignmentMap.set(assignment.emailIndex, assignment.senderId);
      }

      const emailJobs = [];
      const senderCount = senderIds.length;
      const combinedHourlyCapacity = hourlyLimit * senderCount;
      const avgGapSeconds = 3600 / combinedHourlyCapacity;
      const delayIsBottleneck = delaySeconds > avgGapSeconds;
      let cumulativeOffsetMs = 0;

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        if (i > 0) {
          let gap: number;
          if (delayIsBottleneck) {
            gap = delaySeconds * (0.8 + Math.random() * 0.4);
          } else {
            gap = avgGapSeconds * (0.6 + Math.random() * 0.8);
            gap = Math.max(gap, delaySeconds);
          }
          cumulativeOffsetMs += gap * 1000;
        }

        const jobScheduledAt = new Date(scheduledAt.getTime() + cumulativeOffsetMs);

        let resolvedSubject = subject;
        let resolvedBody = body;
        if (hasVariables && recipient.columnData && Object.keys(recipient.columnData).length > 0) {
          const resolved = resolveForRecipient(subject, body, {
            email: recipient.email,
            columnData: recipient.columnData,
          });
          resolvedSubject = resolved.subject;
          resolvedBody = resolved.body;
        }

        const emailJob = await tx.emailJob.create({
          data: {
            campaignId: campaign.id,
            toEmail: recipient.email,
            senderId: assignmentMap.get(i) ?? senderIds[0],
            scheduledAt: jobScheduledAt,
            columnData: recipient.columnData ?? undefined,
          },
        });

        const fullName = recipient.columnData?.Name || recipient.columnData?.name || recipient.columnData?.["Full Name"] || "";
        let firstName = recipient.columnData?.FirstName || recipient.columnData?.firstName || recipient.columnData?.["First Name"];
        let lastName = recipient.columnData?.LastName || recipient.columnData?.lastName || recipient.columnData?.["Last Name"];

        if (!firstName && !lastName && fullName) {
          const parts = fullName.split(" ");
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }

        const contact = await upsertContact(userId, recipient.email, {
          firstName,
          lastName,
          company: recipient.columnData?.Company || recipient.columnData?.company || recipient.columnData?.Organization || recipient.columnData?.organization || recipient.columnData?.["Company Name"],
          jobTitle: recipient.columnData?.JobTitle || recipient.columnData?.jobTitle || recipient.columnData?.Role || recipient.columnData?.role || recipient.columnData?.["Job Title"],
        }, tx);
        await logContactActivity(contact.id, "CAMPAIGN_ENROLLED", {
          campaignId: campaign.id,
          subject: campaign.subject,
        }, tx);

        emailJobs.push(emailJob);
      }

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await tx.attachment.create({
            data: {
              campaignId: campaign.id,
              url: attachment.url,
              filename: attachment.filename,
              size: attachment.size,
              mimeType: attachment.mimeType,
            },
          });
        }
      }

      if (resolvedSteps && resolvedSteps.length > 0) {
        const step0 = await tx.sequenceStep.create({
          data: {
            campaignId: campaign.id,
            stepNumber: 0,
            subject,
            body,
            waitDays: 0,
          },
        });

        for (const job of emailJobs) {
          await tx.emailJob.update({
            where: { id: job.id },
            data: { sequenceStepId: step0.id },
          });
        }

        const nodeStepNumbers = new Map<string, number>();
        if (resolvedGraph) {
          for (let n = 0; n < resolvedGraph.nodes.length; n++) {
            nodeStepNumbers.set(resolvedGraph.nodes[n].id, n + 1);
          }
        }

        for (let s = 0; s < resolvedSteps.length; s++) {
          const step = resolvedSteps[s];
          let serializedCondition: string | null = null;

          const extended: Record<string, any> = {};
          if ((step as any).altSubjects?.length) extended.altSubjects = (step as any).altSubjects;
          if (typeof (step as any).sendHour === 'number' && (step as any).sendHour >= 0) extended.sendHour = (step as any).sendHour;
          if (typeof (step as any).waitHours === 'number' && (step as any).waitHours > 0) extended.waitHours = (step as any).waitHours;

          if (resolvedGraph) {
            const node = resolvedGraph.nodes[s];
            const edge = resolvedGraph.edges[node.id];
            let rules = node.rules ?? null;
            if (!rules && step.condition && step.condition !== "none") {
              rules = { operator: "AND", operands: [{ type: step.condition as "opened" | "clicked" | "replied" }] };
            }
            serializedCondition = JSON.stringify({
              v: 2,
              kind: "advanced",
              rules,
              onMatchStepNumber: edge?.onMatch ? (nodeStepNumbers.get(edge.onMatch) ?? null) : null,
              onNoMatchStepNumber: edge?.onNoMatch ? (nodeStepNumbers.get(edge.onNoMatch) ?? null) : null,
              originalNodeId: node.id,
              ...extended,
            });
          } else if (step.condition) {
            if (extended.altSubjects || extended.sendHour || extended.waitHours) {
              serializedCondition = JSON.stringify({
                v: 1,
                kind: "simple_extended",
                type: step.condition,
                ...extended,
              });
            } else {
              serializedCondition = step.condition ?? null;
            }
          } else if (extended.altSubjects || extended.sendHour || extended.waitHours) {
            serializedCondition = JSON.stringify({
              v: 1,
              kind: "simple_extended",
              type: "none",
              ...extended,
            });
          }

          await tx.sequenceStep.create({
            data: {
              campaignId: campaign.id,
              stepNumber: s + 1,
              subject: step.subject,
              body: step.body,
              waitDays: step.waitDays,
              condition: serializedCondition,
            },
          });
        }

        const totalSteps = resolvedSteps.length + 1;
        for (const recipient of recipients) {
          const stepStatuses = Array.from({ length: totalSteps }, (_, i) => ({
            stepNumber: i,
            status: "PENDING",
            sentAt: null,
            error: null,
            emailJobId: null,
            nodeId: i === 0 ? "initial" : resolvedGraph?.nodes[i - 1]?.id ?? `n${i}`,
            lastRuleMatched: null,
            decisionAt: null,
          }));

          await tx.recipientSequenceState.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              currentStep: 0,
              stepStatuses,
            },
          });
        }
      }

      const priorityJobs = [];
      if (isPriority === true) {
        for (const emailJob of emailJobs) {
          const priorityJob = await tx.priorityQueueJob.create({
            data: {
              emailJobId: emailJob.id,
              userId,
              status: "PRIORITY_PENDING",
              priorityScore: 500,
              congestionScore: 0,
              scheduledAt: emailJob.scheduledAt,
            },
          });
          priorityJobs.push(priorityJob);
        }
      }

      return { campaign, emailJobs, campaignSenders, priorityJobs };
    });

    const senderPool = result.campaignSenders.map((cs) => {
      const sender = senders.find((s) => s.id === cs.senderId)!;
      return {
        senderId: cs.senderId,
        email: sender.email,
        name: sender.name,
        dailyLimit: sender.dailyLimit,
        rotationOrder: cs.rotationOrder,
      };
    });

    return {
      campaignId: result.campaign.id,
      emailJobs: result.emailJobs,
      senderPool,
      skippedCount: bouncedCount + invalidCount,
      skipReasons: {
        bounced: bouncedCount,
        invalidFormat: invalidCount,
      },
    };
  }
}

export class CampaignError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public upgradeRequired: boolean = false,
  ) {
    super(message);
    this.name = "CampaignError";
  }
}

export const campaignService = new CampaignService();

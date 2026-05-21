import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { verifyCampaignOwnership } from "../utils/authorization";

/**
 * GET /api/campaigns/:id/sequence
 * Returns SequenceSteps and RecipientSequenceStates for a campaign.
 * For single-step campaigns (no steps), returns empty arrays with a flag.
 */
export const getSequence = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const steps = await prisma.sequenceStep.findMany({
      where: { campaignId: campaign.id },
      orderBy: { stepNumber: "asc" },
    });

    const recipients = await prisma.recipientSequenceState.findMany({
      where: { campaignId: campaign.id },
      orderBy: { recipientEmail: "asc" },
    });

    // Compute per-step analytics
    const stepAnalytics = steps.map((step) => {
      const stepNum = step.stepNumber;
      let sentCount = 0;
      let repliedCount = 0;

      for (const r of recipients) {
        const statuses = r.stepStatuses as any[];
        const stepStatus = statuses[stepNum];
        if (!stepStatus) continue;

        if (stepStatus.status === "SENT") {
          sentCount++;
          // Count reply only if this specific step's email job was replied to
          if (stepStatus.emailJobId) {
            // We'll batch-fetch reply events below
          }
        }
      }

      return {
        stepNumber: stepNum,
        subject: step.subject,
        sentCount,
        repliedCount: 0, // Will be filled by batch query
        replyRate: 0,
      };
    });

    // Batch fetch reply events for all step email jobs
    const stepEmailJobIds = new Map<number, string[]>();
    for (const r of recipients) {
      const statuses = r.stepStatuses as any[];
      for (const step of steps) {
        const stepStatus = statuses[step.stepNumber];
        if (stepStatus?.status === "SENT" && stepStatus.emailJobId) {
          if (!stepEmailJobIds.has(step.stepNumber)) {
            stepEmailJobIds.set(step.stepNumber, []);
          }
          stepEmailJobIds.get(step.stepNumber)!.push(stepStatus.emailJobId);
        }
      }
    }

    for (const [stepNum, jobIds] of stepEmailJobIds) {
      const replyCount = await prisma.trackingEvent.count({
        where: {
          emailJobId: { in: jobIds },
          eventType: "REPLY",
        },
      });
      const analytics = stepAnalytics.find((a) => a.stepNumber === stepNum);
      if (analytics) {
        analytics.repliedCount = replyCount;
        analytics.replyRate = analytics.sentCount > 0 ? Math.round((replyCount / analytics.sentCount) * 100) : 0;
      }
    }

    res.status(200).json({
      steps,
      recipients,
      hasSequence: steps.length > 0,
      stepAnalytics,
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};


/**
 * PATCH /api/campaigns/:id/sequence/recipients/:recipientId/pause
 * Sets paused=true on a specific RecipientSequenceState.
 */
export const pauseRecipient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const recipientId = req.params.recipientId as string;

    const state = await prisma.recipientSequenceState.findUnique({
      where: { id: recipientId },
    });

    if (!state || state.campaignId !== campaign.id) {
      res.status(404).json({ message: "Recipient not found in sequence" });
      return;
    }

    const updated = await prisma.recipientSequenceState.update({
      where: { id: recipientId },
      data: { paused: true },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

/**
 * PATCH /api/campaigns/:id/sequence/recipients/:recipientId/resume
 * Sets paused=false on a specific RecipientSequenceState.
 */
export const resumeRecipient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const recipientId = req.params.recipientId as string;

    const state = await prisma.recipientSequenceState.findUnique({
      where: { id: recipientId },
    });

    if (!state || state.campaignId !== campaign.id) {
      res.status(404).json({ message: "Recipient not found in sequence" });
      return;
    }

    const updated = await prisma.recipientSequenceState.update({
      where: { id: recipientId },
      data: { paused: false },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

/**
 * PATCH /api/campaigns/:id/sequence/recipients/:recipientId/stop
 * Sets all remaining (non-SENT, non-FAILED) step statuses to SKIPPED.
 */
export const stopRecipient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const recipientId = req.params.recipientId as string;

    const state = await prisma.recipientSequenceState.findUnique({
      where: { id: recipientId },
    });

    if (!state || state.campaignId !== campaign.id) {
      res.status(404).json({ message: "Recipient not found in sequence" });
      return;
    }

    const stepStatuses = state.stepStatuses as Array<{
      stepNumber: number;
      status: string;
      sentAt: string | null;
      error: string | null;
      emailJobId: string | null;
    }>;

    const updatedStatuses = stepStatuses.map((s) => {
      if (s.status !== "SENT" && s.status !== "FAILED") {
        return { ...s, status: "SKIPPED" };
      }
      return s;
    });

    const updated = await prisma.recipientSequenceState.update({
      where: { id: recipientId },
      data: { stepStatuses: updatedStatuses },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};


/**
 * PATCH /api/campaigns/:id/sequence/pause
 * Sets paused=true on ALL RecipientSequenceStates for the campaign.
 */
export const pauseSequence = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const result = await prisma.recipientSequenceState.updateMany({
      where: { campaignId: campaign.id },
      data: { paused: true },
    });

    res.status(200).json({ message: "Sequence paused", count: result.count });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

/**
 * PATCH /api/campaigns/:id/sequence/resume
 * Sets paused=false on ALL RecipientSequenceStates for the campaign.
 */
export const resumeSequence = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const result = await prisma.recipientSequenceState.updateMany({
      where: { campaignId: campaign.id },
      data: { paused: false },
    });

    res.status(200).json({ message: "Sequence resumed", count: result.count });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

/**
 * PATCH /api/campaigns/:id/sequence/stop
 * Sets remaining (non-SENT, non-FAILED) step statuses to SKIPPED for ALL recipients.
 * Does not cancel or retract already SENDING/SENT EmailJobs.
 */
export const stopSequence = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const campaign = await verifyCampaignOwnership(req, res);
    if (!campaign) return;

    const states = await prisma.recipientSequenceState.findMany({
      where: { campaignId: campaign.id },
    });

    let updatedCount = 0;

    for (const state of states) {
      const stepStatuses = state.stepStatuses as Array<{
        stepNumber: number;
        status: string;
        sentAt: string | null;
        error: string | null;
        emailJobId: string | null;
      }>;

      const hasRemaining = stepStatuses.some(
        (s) => s.status !== "SENT" && s.status !== "FAILED"
      );

      if (!hasRemaining) continue;

      const updatedStatuses = stepStatuses.map((s) => {
        if (s.status !== "SENT" && s.status !== "FAILED") {
          return { ...s, status: "SKIPPED" };
        }
        return s;
      });

      await prisma.recipientSequenceState.update({
        where: { id: state.id },
        data: { stepStatuses: updatedStatuses },
      });

      updatedCount++;
    }

    res.status(200).json({ message: "Sequence stopped", count: updatedCount });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

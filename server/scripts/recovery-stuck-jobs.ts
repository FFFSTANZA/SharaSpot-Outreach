import "dotenv/config";
import crypto from "crypto";
import { prisma } from "./src/config/prisma";
import { emailQueue } from "./src/queues/emailQueue";

async function reenqueueStuckJobs() {
    console.log("Starting stuck job recovery...");
    const now = new Date();

    const stuckJobs = await prisma.emailJob.findMany({
        where: {
            status: "PENDING",
            scheduledAt: { lt: now }
        },
        include: {
            campaign: {
                select: { id: true, isPriority: true, userId: true }
            }
        }
    });

    if (stuckJobs.length === 0) {
        console.log("No stuck PENDING jobs found.");
        process.exit(0);
    }

    console.log(`Found ${stuckJobs.length} stuck jobs. Re-enqueuing...`);

    for (const job of stuckJobs) {
        const delay = 0; // Send immediately since they are already late

        // Check if it's a priority job or regular
        // Note: The EmailJob table doesn't have isPriority, but the Campaign does.
        // However, if it's priority, it might need a PriorityQueueJob entry.

        if (job.campaign.isPriority) {
            // Find if PriorityQueueJob exists
            const priorityJob = await prisma.priorityQueueJob.findUnique({
                where: { emailJobId: job.id }
            });

            if (priorityJob && priorityJob.status === "PRIORITY_PENDING") {
                const { priorityQueue } = require("./src/queues/priorityQueue");
                await priorityQueue.add(
                    "send-priority-email",
                    { emailJobId: job.id, userId: job.campaign.userId },
                    {
                        jobId: `priority-${job.id}-recovery-${crypto.randomUUID()}`,
                        delay,
                    }
                );
                console.log(`Re-enqueued Priority job ${job.id}`);
            } else {
                // If missing PriorityQueueJob but campaign is priority, maybe it was created during the same failure?
                // For now, let's stick to regular if missing.
                await emailQueue.add(
                    "send-email",
                    { emailJobId: job.id },
                    {
                        jobId: `${job.id}-recovery-${crypto.randomUUID()}`,
                        delay,
                    }
                );
                console.log(`Re-enqueued Regular job ${job.id} (Campaign was priority but PriorityJob missing)`);
            }
        } else {
            await emailQueue.add(
                "send-email",
                { emailJobId: job.id },
                {
                    jobId: `${job.id}-recovery-${crypto.randomUUID()}`,
                    delay,
                }
            );
            console.log(`Re-enqueued Regular job ${job.id}`);
        }
    }

    console.log("Recovery complete.");
    process.exit(0);
}

reenqueueStuckJobs().catch(err => {
    console.error("Recovery failed:", err);
    process.exit(1);
});

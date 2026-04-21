const { PrismaClient } = require("@prisma/client");
const { Queue } = require("bullmq");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

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

    // BullMQ connection (matching server/src/config/redis.ts logic roughly)
    const redisUrl = process.env.REDIS_URL;
    let connection;
    if (redisUrl) {
        const parsed = new URL(redisUrl);
        connection = {
            host: parsed.hostname || "localhost",
            port: parsed.port ? parseInt(parsed.port, 10) : 6379,
            password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
            maxRetriesPerRequest: null,
        };
    } else {
        connection = { host: "localhost", port: 6379, maxRetriesPerRequest: null };
    }

    const emailQueue = new Queue("email-queue", { connection });
    const priorityQueue = new Queue("priority-queue", { connection });

    for (const job of stuckJobs) {
        const delay = 0;

        if (job.campaign.isPriority) {
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
    await emailQueue.close();
    await priorityQueue.close();
    await prisma.$disconnect();
    process.exit(0);
}

reenqueueStuckJobs().catch(err => {
    console.error("Recovery failed:", err);
    process.exit(1);
});

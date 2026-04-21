import { prisma } from "../config/prisma";
import { SnapshotType } from "@prisma/client";

/**
 * Analytics Aggregator
 * 
 * WHY: Querying raw EmailJob and TrackingEvent tables for every dashboard load
 * is slow (O(n) where n is total emails). This worker pre-aggregates data into
 * AnalyticsSnapshot (O(1) lookup), providing sub-second dashboard loads even
 * with millions of emails.
 */

export async function aggregateAnalytics(): Promise<void> {
    console.log("📊 Starting analytics aggregation...");
    const now = new Date();

    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    try {
        // 1. Group EmailJobs by Campaign, Sender, and Hour
        const jobStats = await prisma.emailJob.groupBy({
            by: ["campaignId", "senderId", "status", "sentAt"],
            where: {
                sentAt: { gte: fortyEightHoursAgo },
                status: { in: ["SENT", "FAILED"] },
            },
            _count: { id: true },
        });

        const trackingStats = await prisma.trackingEvent.findMany({
            where: { createdAt: { gte: fortyEightHoursAgo } },
            include: { emailJob: { select: { campaignId: true, senderId: true } } },
        });

        const snapshots = new Map<string, any>();

        for (const stat of jobStats) {
            if (!stat.sentAt) continue;

            const hour = new Date(stat.sentAt);
            hour.setMinutes(0, 0, 0); // Corrected argument count

            const campaignId = stat.campaignId;
            // Note: prisma unique constraint with nulls can be tricky. 
            // Ensure we pass the values exactly as they are in the DB.

            const key = `${campaignId}-${stat.senderId}-${hour.getTime()}`;
            const existing = snapshots.get(key) || {
                campaignId,
                senderId: stat.senderId,
                timestamp: hour,
                sentCount: 0,
                bounceCount: 0,
                openCount: 0,
                clickCount: 0,
                replyCount: 0,
            };

            if (stat.status === "SENT") {
                existing.sentCount += stat._count.id;
            } else if (stat.status === "FAILED") {
                existing.bounceCount += stat._count.id;
            }

            snapshots.set(key, existing);
        }

        for (const event of trackingStats) {
            const hour = new Date(event.createdAt);
            hour.setMinutes(0, 0, 0);

            const { campaignId, senderId } = event.emailJob;
            const key = `${campaignId}-${senderId}-${hour.getTime()}`;

            const existing = snapshots.get(key) || {
                campaignId,
                senderId: senderId,
                timestamp: hour,
                sentCount: 0,
                bounceCount: 0,
                openCount: 0,
                clickCount: 0,
                replyCount: 0,
            };

            if (event.eventType === "OPEN") existing.openCount++;
            if (event.eventType === "CLICK") existing.clickCount++;
            if (event.eventType === "REPLY") existing.replyCount++;

            snapshots.set(key, existing);
        }

        console.log(`📊 Upserting ${snapshots.size} hourly snapshots...`);
        for (const snapshot of snapshots.values()) {
            if (!snapshot.campaignId || !snapshot.senderId) {
                console.warn(`[AnalyticsAggregator] Skipping snapshot due to missing ID: campaignId=${snapshot.campaignId}, senderId=${snapshot.senderId}`);
                continue;
            }
            await prisma.analyticsSnapshot.upsert({
                where: {
                    campaignId_senderId_timestamp_type: {
                        campaignId: snapshot.campaignId,
                        senderId: snapshot.senderId,
                        timestamp: snapshot.timestamp,
                        type: SnapshotType.HOURLY
                    }
                },
                update: {
                    sentCount: snapshot.sentCount,
                    openCount: snapshot.openCount,
                    clickCount: snapshot.clickCount,
                    replyCount: snapshot.replyCount,
                    bounceCount: snapshot.bounceCount,
                },
                create: {
                    campaignId: snapshot.campaignId,
                    senderId: snapshot.senderId,
                    timestamp: snapshot.timestamp,
                    type: SnapshotType.HOURLY,
                    sentCount: snapshot.sentCount,
                    openCount: snapshot.openCount,
                    clickCount: snapshot.clickCount,
                    replyCount: snapshot.replyCount,
                    bounceCount: snapshot.bounceCount,
                },
            });
        }

        await updateSenderHealth(now);
        console.log("✅ Analytics aggregation complete.");
    } catch (err) {
        console.error("❌ Analytics aggregation failed:", err);
    }
}

/**
 * Ensures analytics are up-to-date by checking the latest snapshot.
 * If the latest snapshot is more than 1 hour old, triggers an immediate aggregation.
 */
export async function ensureAnalyticsUpToDate(): Promise<void> {
    try {
        const latestSnapshot = await prisma.analyticsSnapshot.findFirst({
            orderBy: { timestamp: "desc" },
            select: { timestamp: true }
        });

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (!latestSnapshot || latestSnapshot.timestamp < oneHourAgo) {
            console.log("📊 Analytics are stale or missing. Triggering immediate catch-up...");
            await aggregateAnalytics();
        } else {
            console.log("📊 Analytics health check: Data is up-to-date");
        }
    } catch (err) {
        console.error("❌ Analytics health check failed:", err);
    }
}


async function updateSenderHealth(now: Date): Promise<void> {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.emailJob.groupBy({
        by: ["senderId", "status", "error"],
        where: { updatedAt: { gte: today }, senderId: { not: null } },
        _count: { id: true },
    });

    const healthMap = new Map<string, any>();

    for (const stat of stats) {
        if (!stat.senderId) continue;

        const existing = healthMap.get(stat.senderId) || {
            senderId: stat.senderId,
            date: today,
            successCount: 0,
            errorCount: 0,
            bounceCount: 0,
            errors: [] as any[],
        };

        if (stat.status === "SENT") {
            existing.successCount += stat._count.id;
        } else if (stat.status === "FAILED") {
            existing.errorCount += stat._count.id;
            if (stat.error?.match(/55[0-9]/)) {
                existing.bounceCount += stat._count.id;
            }
            if (stat.error) {
                existing.errors.push({ msg: stat.error, count: stat._count.id });
            }
        }
        healthMap.set(stat.senderId, existing);
    }

    for (const health of healthMap.values()) {
        await prisma.dailySenderHealth.upsert({
            where: {
                senderId_date: {
                    senderId: health.senderId,
                    date: health.date,
                },
            },
            update: {
                successCount: health.successCount,
                errorCount: health.errorCount,
                bounceCount: health.bounceCount,
                errorDetails: health.errors,
            },
            create: {
                senderId: health.senderId,
                date: health.date,
                successCount: health.successCount,
                errorCount: health.errorCount,
                bounceCount: health.bounceCount,
                errorDetails: health.errors,
            },
        });
    }
}

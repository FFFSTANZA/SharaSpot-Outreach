import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

const PRUNE_AFTER_DAYS = parseInt(process.env.TRACKING_PRUNE_AFTER_DAYS || "30", 10);
const PRUNE_BATCH_SIZE = parseInt(process.env.TRACKING_PRUNE_BATCH_SIZE || "5000", 10);

export async function pruneOldTrackingEvents(): Promise<void> {
  const cutoff = new Date(Date.now() - PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const totalCount = await prisma.trackingEvent.count({
    where: { createdAt: { lt: cutoff } },
  });

  if (totalCount === 0) {
    logger.info({ extra: [PRUNE_AFTER_DAYS, "days"] }, "[Pruning] No tracking events older than");
    return;
  }

  logger.info(`[Pruning] Found ${totalCount} tracking events older than ${PRUNE_AFTER_DAYS} days — deleting...`);

  let processed = 0;

  while (processed < totalCount) {
    const batch = await prisma.trackingEvent.findMany({
      where: { createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
      take: PRUNE_BATCH_SIZE,
      select: { id: true },
    });

    if (batch.length === 0) break;

    const ids = batch.map((e) => e.id);
    await prisma.trackingEvent.deleteMany({
      where: { id: { in: ids } },
    });

    processed += batch.length;
    logger.info(`[Pruning] Deleted ${processed}/${totalCount} events`);
  }

  logger.info(`[Pruning] Complete — ${processed} events removed from Postgres`);
}

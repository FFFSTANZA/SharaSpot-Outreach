/**
 * TrackingEvent Data Pruning
 *
 * Moves tracking events older than PRUNE_AFTER_DAYS (default 30) from Postgres
 * to a CSV archive in Supabase Storage, then deletes them from the main database.
 * This keeps the Postgres table lean and fast, reducing storage costs and query latency.
 *
 * Runs daily via a setInterval in the worker index.
 */

import { prisma } from "../config/prisma";
import { supabase, SUPABASE_BUCKET } from "../config/supabase";

const PRUNE_AFTER_DAYS = parseInt(process.env.TRACKING_PRUNE_AFTER_DAYS || "30", 10);
const PRUNE_BATCH_SIZE = parseInt(process.env.TRACKING_PRUNE_BATCH_SIZE || "5000", 10);

export async function pruneOldTrackingEvents(): Promise<void> {
  const cutoff = new Date(Date.now() - PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const totalCount = await prisma.trackingEvent.count({
    where: { createdAt: { lt: cutoff } },
  });

  if (totalCount === 0) {
    console.log("[Pruning] No tracking events older than", PRUNE_AFTER_DAYS, "days");
    return;
  }

  console.log(`[Pruning] Found ${totalCount} tracking events older than ${PRUNE_AFTER_DAYS} days — archiving...`);

  let processed = 0;

  while (processed < totalCount) {
    const batch = await prisma.trackingEvent.findMany({
      where: { createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
      take: PRUNE_BATCH_SIZE,
      select: {
        id: true,
        emailJobId: true,
        eventType: true,
        url: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    if (batch.length === 0) break;

    const csvRows = [
      "id,emailJobId,eventType,url,ipAddress,userAgent,createdAt",
      ...batch.map((e) =>
        [
          e.id,
          e.emailJobId,
          e.eventType,
          `"${(e.url ?? "").replace(/"/g, '""')}"`,
          `"${(e.ipAddress ?? "").replace(/"/g, '""')}"`,
          `"${(e.userAgent ?? "").replace(/"/g, '""')}"`,
          e.createdAt.toISOString(),
        ].join(","),
      ),
    ].join("\n");

    const archivePath = `archives/tracking-events/${new Date().toISOString().split("T")[0]}-batch-${processed}.csv`;

    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .upload(archivePath, csvRows, { contentType: "text/csv" });

    if (error) throw error;

    const ids = batch.map((e) => e.id);
    await prisma.trackingEvent.deleteMany({
      where: { id: { in: ids } },
    });

    processed += batch.length;
    console.log(`[Pruning] Archived and deleted ${processed}/${totalCount} events`);
  }

  console.log(`[Pruning] Complete — ${processed} events archived to Supabase and removed from Postgres`);
}

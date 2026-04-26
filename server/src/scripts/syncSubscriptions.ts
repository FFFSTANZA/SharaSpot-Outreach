import "dotenv/config";
import { prisma } from "../config/prisma";
import { syncSubscriptionFromDodo } from "../services/subscriptionService";

async function syncAllSubscriptions() {
  console.log("[SYNC-WORKER] Starting subscription sync...");

  const subscriptions = await prisma.subscription.findMany({
    where: {
      dodoSubscriptionId: {
        not: null,
      },
      NOT: {
        dodoSubscriptionId: "sub_test_premium_demo",
      },
      status: {
        in: ["ACTIVE", "PAST_DUE", "CANCELLED"],
      },
    },
  });

  console.log(`[SYNC-WORKER] Found ${subscriptions.length} subscriptions to sync`);

  let synced = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      const result = await syncSubscriptionFromDodo(sub.userId);
      if (result.synced) {
        synced++;
      }
    } catch (err: any) {
      failed++;
      console.error(`[SYNC-WORKER] Failed to sync ${sub.userId}:`, err.message);
    }
  }

  console.log(`[SYNC-WORKER] Complete: ${synced} synced, ${failed} failed`);
}

syncAllSubscriptions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[SYNC-WORKER] Fatal error:", err);
    process.exit(1);
  });
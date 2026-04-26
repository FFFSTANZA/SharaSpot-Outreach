import "dotenv/config";
import { prisma } from "../config/prisma";
import { getSubscriptionStatus } from "../services/subscriptionService";

async function checkPaymentFlow() {
  console.log("=== PAYMENT FLOW END-TO-END CHECK ===\n");

  const users = await prisma.user.findMany({
    include: { subscription: true },
    take: 10,
  });

  console.log(`Found ${users.length} users in database\n`);

  for (const user of users) {
    console.log(`--- User: ${user.email} ---`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    
    if (user.subscription) {
      console.log(`  Subscription:`);
      console.log(`    Status: ${user.subscription.status}`);
      console.log(`    Period End: ${user.subscription.currentPeriodEnd}`);
      console.log(`    Dodo Sub ID: ${user.subscription.dodoSubscriptionId}`);
      console.log(`    Dodo Customer ID: ${user.subscription.dodoCustomerId}`);
      console.log(`    Cancel at Period End: ${user.subscription.cancelAtPeriodEnd}`);
      
      const { isPremium } = await getSubscriptionStatus(user.id);
      console.log(`    Is Premium: ${isPremium}`);
    } else {
      console.log(`  Subscription: NONE`);
    }
    console.log("");
  }

  const stats = await prisma.subscription.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("--- Subscription Stats ---");
  for (const s of stats) {
    console.log(`  ${s.status}: ${s._count}`);
  }

  const totalSubs = await prisma.subscription.count();
  const totalUsers = await prisma.user.count();
  console.log(`\nTotal subscriptions: ${totalSubs}`);
  console.log(`Total users: ${totalUsers}`);
  console.log(`Users without subscription: ${totalUsers - totalSubs}`);
}

checkPaymentFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
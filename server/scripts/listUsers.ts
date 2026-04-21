import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany({
        include: { subscription: true }
    });

    console.log("Current Users and Subscriptions:");
    users.forEach(u => {
        console.log(`- Email: ${u.email}`);
        console.log(`  Trial End: ${u.subscription?.trialEnd?.toLocaleString() || "None"}`);
        console.log(`  Dodo ID: ${u.subscription?.dodoSubscriptionId || "None"}`);
        console.log(`  Status: ${u.subscription?.status || "None"}`);
        console.log("---");
    });
    process.exit(0);
}

listUsers();

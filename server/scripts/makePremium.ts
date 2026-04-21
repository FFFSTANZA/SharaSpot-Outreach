import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function makePremium() {
    const email = "sarveshwar2006@gmail.com";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("User not found");
        return;
    }

    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
            status: "ACTIVE",
            dodoSubscriptionId: "sub_test_premium_demo",
            dodoCustomerId: "cus_test_premium_demo",
            trialEnd: null,
            currentPeriodStart: new Date(),
            currentPeriodEnd: oneMonthFromNow,
            cancelAtPeriodEnd: false
        },
        create: {
            userId: user.id,
            status: "ACTIVE",
            dodoSubscriptionId: "sub_test_premium_demo",
            dodoCustomerId: "cus_test_premium_demo",
            trialEnd: null,
            currentPeriodStart: new Date(),
            currentPeriodEnd: oneMonthFromNow,
            cancelAtPeriodEnd: false
        }
    });

    console.log(`Successfully promoted ${email} to Pro Outreach (Premium) status.`);
    console.log(`Next billing date set to: ${oneMonthFromNow.toLocaleString()}`);
    process.exit(0);
}

makePremium().catch(err => {
    console.error(err);
    process.exit(1);
});

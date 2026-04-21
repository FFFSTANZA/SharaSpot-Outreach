import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function resetTrial() {
    const email = "sarveshwar2006@gmail.com";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("User not found");
        return;
    }

    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
            trialEnd: twentyFourHoursFromNow,
            currentPeriodEnd: twentyFourHoursFromNow,
            status: "ACTIVE"
        },
        create: {
            userId: user.id,
            trialEnd: twentyFourHoursFromNow,
            currentPeriodEnd: twentyFourHoursFromNow,
            status: "ACTIVE",
            currentPeriodStart: new Date()
        }
    });

    console.log(`Successfully reset trial for ${email} to 24 hours (ends ${twentyFourHoursFromNow.toLocaleString()})`);
    process.exit(0);
}

resetTrial().catch(err => {
    console.error(err);
    process.exit(1);
});

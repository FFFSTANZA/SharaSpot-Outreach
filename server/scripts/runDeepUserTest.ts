import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/config/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { checkPremiumStatus, requirePremium } from "../src/utils/premiumCheck";

async function runDeepUserTest() {
    console.log("🚀 Starting Deep User Test: Subscription Lifecycle Simulation\n");

    const testEmail = `test_user_test_runner@example.com`;
    let testUser: any;

    try {
        // 1. SETUP: Create Test User
        console.log("STEP 1: Setting up test user...");
        testUser = await prisma.user.upsert({
            where: { email: testEmail },
            update: {},
            create: {
                email: testEmail,
                name: "Test Runner",
                subscription: {
                    create: {
                        trialEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h trial
                        currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                },
            },
        });
        console.log(`✅ Test User created: ${testUser.id}\n`);

        // 2. PHASE 1: Initial Trial (24h free)
        console.log("STEP 2: Verifying Initial Trial (24h free)...");
        let status = await checkPremiumStatus(testUser.id);
        console.log(`Status: ${status.isPremium ? "PREMIUM (ACTIVE TRIAL)" : "RESTRICTED"}`);
        if (!status.isPremium) throw new Error("Expected PREMIUM status during trial");

        let access = await requirePremium(testUser.id, "Priority Mail");
        console.log(`Access to Priority Mail: ${access.allowed ? "ALLOWED" : "DENIED"}`);
        if (!access.allowed) throw new Error("Expected access allowed during trial");
        console.log("✅ Phase 1 passed.\n");

        // 3. PHASE 2: Restriction (Expired Trial)
        console.log("STEP 3: Simulating Trial Expiration (Restriction)...");
        await prisma.subscription.update({
            where: { userId: testUser.id },
            data: {
                trialEnd: new Date(Date.now() - 3600000), // Expired 1h ago
                currentPeriodEnd: new Date(Date.now() - 3600000),
            },
        });

        status = await checkPremiumStatus(testUser.id);
        console.log(`Status: ${status.isPremium ? "PREMIUM" : "RESTRICTED"}`);
        if (status.isPremium) throw new Error("Expected RESTRICTED status after trial expiration");

        access = await requirePremium(testUser.id, "Priority Mail");
        console.log(`Access to Priority Mail: ${access.allowed ? "ALLOWED" : "DENIED"}`);
        if (access.allowed) throw new Error("Expected access denied after trial expiration");
        console.log("✅ Phase 2 passed.\n");

        // 4. PHASE 3: Pro Upgrade
        console.log("STEP 4: Simulating Pro Upgrade...");
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await prisma.subscription.update({
            where: { userId: testUser.id },
            data: {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: nextMonth,
                dodoSubscriptionId: "sub_test_premium_automated",
                trialEnd: null,
            },
        });

        status = await checkPremiumStatus(testUser.id);
        console.log(`Status: ${status.isPremium ? "PREMIUM (ACTIVE PRO)" : "RESTRICTED"}`);
        if (!status.isPremium) throw new Error("Expected PREMIUM status after upgrade");

        access = await requirePremium(testUser.id, "Priority Mail");
        console.log(`Access to Priority Mail: ${access.allowed ? "ALLOWED" : "DENIED"}`);
        if (!access.allowed) throw new Error("Expected access allowed after upgrade");
        console.log("✅ Phase 3 passed.\n");

        // 5. PHASE 4: Cancellation
        console.log("STEP 5: Simulating Cancellation (Still active until end of period)...");
        await prisma.subscription.update({
            where: { userId: testUser.id },
            data: {
                status: SubscriptionStatus.ACTIVE, // Remains active until period end
                cancelAtPeriodEnd: true,
                cancelAt: nextMonth,
            },
        });

        status = await checkPremiumStatus(testUser.id);
        console.log(`Status: ${status.isPremium ? "PREMIUM (CANCELLED BUT ACTIVE)" : "RESTRICTED"}`);
        if (!status.isPremium) throw new Error("Expected PREMIUM status until period end");

        access = await requirePremium(testUser.id, "Priority Mail");
        console.log(`Access to Priority Mail: ${access.allowed ? "ALLOWED" : "DENIED"}`);
        if (!access.allowed) throw new Error("Expected access allowed until period end");
        console.log("✅ Phase 4 passed.\n");

        // 6. PHASE 5: Post-Cancellation Expiration
        console.log("STEP 6: Simulating Post-Cancellation Expiration...");
        await prisma.subscription.update({
            where: { userId: testUser.id },
            data: {
                status: SubscriptionStatus.CANCELLED,
                currentPeriodEnd: new Date(Date.now() - 3600000),
            },
        });

        status = await checkPremiumStatus(testUser.id);
        console.log(`Status: ${status.isPremium ? "PREMIUM" : "RESTRICTED"}`);
        if (status.isPremium) throw new Error("Expected RESTRICTED status after period end");
        console.log("✅ Phase 5 passed.\n");

        console.log("🏁 Deep User Test Completed Successfully!");

    } catch (error: any) {
        console.error("\n❌ Test Failed!");
        console.error(error.message);
        process.exit(1);
    } finally {
        // CLEANUP
        if (testUser) {
            console.log("\n🧹 Cleaning up test user...");
            await prisma.subscription.deleteMany({ where: { userId: testUser.id } });
            await prisma.user.delete({ where: { id: testUser.id } });
            console.log("✅ Cleanup complete.");
        }
        await prisma.$disconnect();
    }
}

runDeepUserTest();

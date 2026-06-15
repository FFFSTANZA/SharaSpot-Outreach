import { getSubscriptionStatus } from "../../services/subscriptionService";
import { prisma } from "../../config/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { checkPremiumStatus, requirePremium } from "../../utils/premiumCheck";

// Mock Prisma
jest.mock("../../config/prisma", () => ({
    prisma: {
        subscription: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("../../config/redis", () => ({
    redis: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    },
}));

import { redis } from "../../config/redis";

describe("Subscription Service & Premium Checks", () => {
    const userId = "test-user-123";

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ activeOrganizationId: null });
        (redis.get as jest.Mock).mockResolvedValue(null);
        (redis.set as jest.Mock).mockResolvedValue("OK");
        (redis.del as jest.Mock).mockResolvedValue(1);
    });

    describe("getSubscriptionStatus", () => {
        it("should return isPremium: true if user is in an active 7-day trial", async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                trialEnd: futureDate,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: new Date(0), // expired sub
            });

            const result = await getSubscriptionStatus(userId);
            expect(result.isPremium).toBe(true);
            expect(result.subscription?.trialEnd).toEqual(futureDate);
        });

        it("should return isPremium: true if user has an active subscription", async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 15);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                trialEnd: new Date(0), // expired trial
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: futureDate,
            });

            const result = await getSubscriptionStatus(userId);
            expect(result.isPremium).toBe(true);
            expect(result.subscription?.currentPeriodEnd).toEqual(futureDate);
        });

        it("should return isPremium: false if trial and subscription are both expired", async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                trialEnd: pastDate,
                status: SubscriptionStatus.EXPIRED,
                currentPeriodEnd: pastDate,
            });

            const result = await getSubscriptionStatus(userId);
            expect(result.isPremium).toBe(false);
        });

        it("should return isPremium: false if no subscription record exists", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await getSubscriptionStatus(userId);
            expect(result.isPremium).toBe(false);
            expect(result.subscription).toBe(null);
        });
    });

    describe("requirePremium utility", () => {
        it("should allow access if user is premium", async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                trialEnd: futureDate,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: futureDate,
            });

            const result = await requirePremium(userId);
            expect(result.allowed).toBe(true);
        });

        it("should block access and return subscription message if not premium", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await requirePremium(userId, "Priority Sending");
            expect(result.allowed).toBe(false);
            expect(result.message).toContain("Priority Sending is a premium feature. Please subscribe to access.");
        });

        it("should invalidate an expired premium cache entry and re-check the database", async () => {
            const expiredDate = new Date(Date.now() - 60_000).toISOString();

            (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({
                isPremium: true,
                subscription: {
                    currentPeriodEnd: expiredDate,
                    trialEnd: expiredDate,
                },
            }));
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                trialEnd: new Date(expiredDate),
                status: SubscriptionStatus.EXPIRED,
                currentPeriodEnd: new Date(expiredDate),
            });

            const result = await checkPremiumStatus(userId);

            expect(redis.del).toHaveBeenCalledWith(`user:premium:${userId}`);
            expect(prisma.subscription.findUnique).toHaveBeenCalledWith({ where: { userId } });
            expect(result.isPremium).toBe(false);
        });
    });
});

import { createCheckoutSession, handleCheckoutCompleted } from "../../services/subscriptionService";
import { handleWebhook } from "../../controllers/subscriptionControllers";
import { prisma } from "../../config/prisma";
import { dodo } from "../../config/dodo";
import { redis } from "../../config/redis";

// Mock everything
jest.mock("../../config/prisma", () => ({
    prisma: {
        subscription: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        processedWebhook: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $transaction: jest.fn((cb) => cb(prisma)), // Mock transaction to just run callback
    },
}));

jest.mock("../../config/dodo", () => ({
    dodo: {
        checkoutSessions: {
            create: jest.fn(),
        },
        subscriptions: {
            update: jest.fn(),
        },
        webhooks: {
            unwrap: jest.fn((body) => JSON.parse(body)),
        },
    },
}));

jest.mock("../../config/redis", () => ({
    redis: {
        del: jest.fn().mockResolvedValue(1),
    },
}));

describe("Subscription Flow - Hardened Logic", () => {
    const userId = "user_123";
    const userEmail = "user@example.com";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createCheckoutSession - Trial/Premium Gate", () => {
        it("should block session creation if user already has active trial", async () => {
            const future = new Date();
            future.setDate(future.getDate() + 5);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                trialEnd: future,
                status: "ACTIVE",
            });

            await expect(createCheckoutSession(userId, userEmail, "Test User"))
                .rejects.toThrow("User already has an active premium subscription or trial.");
        });

        it("should allow session creation if no active subscription or trial", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
            (dodo.checkoutSessions.create as jest.Mock).mockResolvedValue({
                checkout_url: "http://checkout.com",
                session_id: "sess_1",
            });

            const result = await createCheckoutSession(userId, userEmail, "Test User");
            expect(result.checkoutUrl).toBe("http://checkout.com");
            expect(dodo.checkoutSessions.create).toHaveBeenCalled();
        });
    });

    describe("handleWebhook - Idempotency", () => {
        it("should skip processing if event ID is already in DB", async () => {
            const mockReq = {
                body: { id: "evt_1", type: "subscription.updated", data: { id: "sub_1" } },
                headers: {},
            } as any;
            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.processedWebhook.findUnique as jest.Mock).mockResolvedValue({ id: "marker_1" });

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ duplicated: true }));
            expect(prisma.subscription.update).not.toHaveBeenCalled();
        });
    });

    describe("handleCheckoutCompleted - Atomic & Cache", () => {
        it("should use transaction and clear redis cache", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

            await handleCheckoutCompleted("sess_1", userId, "sub_1", "cust_1");

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(userId));
        });
    });
});

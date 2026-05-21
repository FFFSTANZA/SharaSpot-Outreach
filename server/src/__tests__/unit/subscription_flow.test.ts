import { 
  createCheckoutSession, 
  handleCheckoutCompleted, 
  updateSubscriptionFromWebhook,
  getSubscriptionStatus,
  syncSubscriptionFromDodo,
  logPaymentAuditEvent,
} from "../../services/subscriptionService";
import { handleWebhook } from "../../controllers/subscriptionControllers";
import { prisma } from "../../config/prisma";
import { dodo } from "../../config/dodo";
import { redis } from "../../config/redis";
import { SubscriptionStatus } from "@prisma/client";

jest.mock("../../config/prisma", () => ({
    prisma: {
        subscription: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        processedWebhook: {
            findUnique: jest.fn(),
            upsert: jest.fn().mockResolvedValue({ id: "wh_1" }),
        },
        user: {
            findUnique: jest.fn(),
        },
        systemAuditLog: {
            create: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation((cb) => cb({
            subscription: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: "new_sub" }),
                update: jest.fn(),
            },
            processedWebhook: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
            systemAuditLog: {
                create: jest.fn(),
            },
        })),
    },
}));

jest.mock("../../config/dodo", () => ({
    dodo: {
        checkoutSessions: {
            create: jest.fn(),
        },
        subscriptions: {
            update: jest.fn(),
            retrieve: jest.fn(),
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

jest.mock("../../utils/geoUtils", () => ({
    getCountryFromIp: jest.fn().mockResolvedValue("IN"),
    isIndia: jest.fn((code: string | null) => code === "IN"),
}));

describe("Subscription Flow - Complete Payment System", () => {
    const userId = "user_123";
    const userEmail = "user@example.com";
    const userName = "Test User";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createCheckoutSession", () => {
        jest.setTimeout(10000);

        it("should create checkout session with correct product for India IP", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
            (dodo.checkoutSessions.create as jest.Mock).mockResolvedValue({
                checkout_url: "https://dodopayments.com/checkout/sess_123",
                session_id: "sess_123",
            });

            const result = await createCheckoutSession(userId, userEmail, userName, "103.21.159.0");

            expect(result.checkoutUrl).toBe("https://dodopayments.com/checkout/sess_123");
            expect(result.sessionId).toBe("sess_123");
            expect(dodo.checkoutSessions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    product_cart: [expect.objectContaining({ product_id: expect.stringContaining("pdt_") })],
                    metadata: expect.objectContaining({ userId }),
                })
            );
        });

        it("should throw error if user already has premium subscription", async () => {
            const future = new Date();
            future.setDate(future.getDate() + 5);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                trialEnd: future,
                status: SubscriptionStatus.ACTIVE,
            });

            await expect(createCheckoutSession(userId, userEmail, userName))
                .rejects.toThrow("User already has an active premium subscription or trial.");
        });

        it("should throw error if no session_id returned from Dodo", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
            (dodo.checkoutSessions.create as jest.Mock).mockResolvedValue({
                checkout_url: "https://checkout.com",
            });

            await expect(createCheckoutSession(userId, userEmail, userName))
                .rejects.toThrow("Payment provider failed to create checkout session");
        });
    });

    describe("handleWebhook - Checkout Completed", () => {
        it("should process checkout.completed with userId in metadata", async () => {
            const mockReq = {
                body: {
                    id: "evt_checkout_1",
                    type: "checkout.session.completed",
                    data: {
                        session_id: "sess_123",
                        subscription_id: "sub_123",
                        customer_id: "cust_123",
                        metadata: { userId },
                    },
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, email: userEmail });

            await handleWebhook(mockReq, mockRes);

            expect(prisma.processedWebhook.upsert).toHaveBeenCalledWith({
                where: { eventId: "evt_checkout_1" },
                create: { eventId: "evt_checkout_1", eventType: "checkout.session.completed" },
                update: {},
            });
            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
        });

        it("should reject checkout without userId in metadata", async () => {
            const mockReq = {
                body: {
                    id: "evt_checkout_2",
                    type: "checkout.session.completed",
                    data: {
                        session_id: "sess_456",
                        subscription_id: "sub_456",
                        customer_id: "cust_456",
                        metadata: {},
                    },
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Missing userId in metadata" }));
        });

        it("should handle idempotency - skip duplicate events", async () => {
            const mockReq = {
                body: { id: "evt_dup", type: "subscription.updated", data: { id: "sub_1" } },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.$transaction as jest.Mock).mockImplementationOnce((cb) => cb({
                processedWebhook: {
                    findUnique: jest.fn().mockResolvedValue({ id: "marker_1" }),
                },
            }));

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ duplicated: true }));
        });
    });

    describe("handleWebhook - Subscription Events", () => {
        it("should process subscription.updated event", async () => {
            const mockReq = {
                body: {
                    id: "evt_sub_update",
                    type: "subscription.updated",
                    data: {
                        subscription_id: "sub_123",
                        status: "active",
                        current_period_start: 1704067200,
                        current_period_end: 1706745600,
                    },
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
                id: "sub_db_1",
                userId,
                status: SubscriptionStatus.ACTIVE,
            });

            await handleWebhook(mockReq, mockRes);

            expect(prisma.subscription.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: "sub_db_1" },
                    data: expect.objectContaining({
                        status: SubscriptionStatus.ACTIVE,
                    }),
                })
            );
            expect(redis.del).toHaveBeenCalled();
        });

        it("should process subscription.past_due event", async () => {
            const mockReq = {
                body: {
                    id: "evt_past_due",
                    type: "subscription.failed",
                    data: {
                        subscription_id: "sub_456",
                        status: "past_due",
                    },
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
                id: "sub_db_2",
                userId,
                status: SubscriptionStatus.PAST_DUE,
            });

            await handleWebhook(mockReq, mockRes);

            expect(prisma.subscription.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: SubscriptionStatus.PAST_DUE }),
                })
            );
        });
    });

    describe("getSubscriptionStatus", () => {
        it("should return isPremium=true for ACTIVE subscription with valid period", async () => {
            const future = new Date();
            future.setMonth(future.getMonth() + 1);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: future,
                trialEnd: null,
            });

            const result = await getSubscriptionStatus(userId);

            expect(result.isPremium).toBe(true);
        });

        it("should return isPremium=false for EXPIRED subscription", async () => {
            const past = new Date();
            past.setMonth(past.getMonth() - 1);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: past,
                trialEnd: null,
            });

            const result = await getSubscriptionStatus(userId);

            expect(result.isPremium).toBe(false);
        });

        it("should return isPremium=true for active trial", async () => {
            const future = new Date();
            future.setDate(future.getDate() + 5);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                status: SubscriptionStatus.CANCELLED,
                currentPeriodEnd: new Date(),
                trialEnd: future,
            });

            const result = await getSubscriptionStatus(userId);

            expect(result.isPremium).toBe(true);
        });

        it("should return isPremium=false when no subscription exists", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await getSubscriptionStatus(userId);

            expect(result.isPremium).toBe(false);
            expect(result.subscription).toBeNull();
        });
    });

    describe("syncSubscriptionFromDodo", () => {
        it("should sync subscription status from Dodo API", async () => {
            const future = new Date();
            future.setMonth(future.getMonth() + 1);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                id: "sub_db_1",
                userId,
                dodoSubscriptionId: "sub_123",
                status: SubscriptionStatus.PAST_DUE,
            });

            (dodo.subscriptions.retrieve as jest.Mock).mockResolvedValue({
                subscription_id: "sub_123",
                status: "active",
                current_period_start: 1704067200,
                current_period_end: 1706745600,
                cancel_at_next_billing_date: false,
                trial_period_end: null,
            });

            const result = await syncSubscriptionFromDodo(userId);

            expect(result.synced).toBe(true);
            expect(prisma.subscription.update).toHaveBeenCalled();
            expect(redis.del).toHaveBeenCalled();
        });

        it("should return synced=false for demo subscription", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                id: "sub_demo",
                userId,
                dodoSubscriptionId: "sub_test_premium_demo",
            });

            const result = await syncSubscriptionFromDodo(userId);

            expect(result.synced).toBe(false);
            expect(dodo.subscriptions.retrieve).not.toHaveBeenCalled();
        });

        it("should handle Dodo API errors gracefully", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                id: "sub_1",
                userId,
                dodoSubscriptionId: "sub_123",
            });

            (dodo.subscriptions.retrieve as jest.Mock).mockRejectedValue(new Error("API Error"));

            const result = await syncSubscriptionFromDodo(userId);

            expect(result.synced).toBe(false);
        });
    });

    describe("logPaymentAuditEvent", () => {
        it("should create audit log entry", async () => {
            (prisma.systemAuditLog.create as jest.Mock).mockResolvedValue({ id: "log_1" });

            await logPaymentAuditEvent("checkout.completed", userId, { sessionId: "sess_123" });

            expect(prisma.systemAuditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        level: "INFO",
                        category: "PAYMENT",
                        message: expect.stringContaining("checkout.completed"),
                    }),
                })
            );
        });
    });

    describe("handleCheckoutCompleted", () => {
        it("should create subscription with correct dates", async () => {
            const createMock = jest.fn().mockResolvedValue({ id: "new_sub" });
            const updateMock = jest.fn().mockResolvedValue({ id: "updated_sub" });
            
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, email: userEmail });
            
            jest.spyOn(prisma, '$transaction').mockImplementation((cb: any) => cb({
                subscription: {
                    findUnique: jest.fn().mockResolvedValue(null),
                    create: createMock,
                    update: updateMock,
                },
                systemAuditLog: {
                    create: jest.fn(),
                },
            }));

            await handleCheckoutCompleted("sess_123", userId, "sub_123", "cust_123");

            expect(createMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId,
                        status: SubscriptionStatus.ACTIVE,
                        dodoSubscriptionId: "sub_123",
                        dodoCustomerId: "cust_123",
                    }),
                })
            );
        });

        it("should throw if user not found", async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            const createMock = jest.fn().mockResolvedValue({ id: "new_sub" });
            
            jest.spyOn(prisma, '$transaction').mockImplementation((cb: any) => cb({
                subscription: {
                    findUnique: jest.fn().mockResolvedValue(null),
                    create: createMock,
                    update: jest.fn(),
                },
                systemAuditLog: {
                    create: jest.fn(),
                },
            }));

            await expect(handleCheckoutCompleted("sess_123", userId, "sub_123", "cust_123"))
                .rejects.toThrow(`User ${userId} not found`);
        });
    });
});
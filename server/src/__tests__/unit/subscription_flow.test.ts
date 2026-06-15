process.env.DODO_PAYMENTS_API_KEY = "sk_test_fake_key_for_testing_1234567890abcdef";
process.env.DODO_WEBHOOK_SECRET = "test_webhook_secret";
process.env.NODE_ENV = "test";

import { 
  createCheckoutSession, 
  createCustomerPortalSession,
  cancelSubscription,
  reactivateSubscription,
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
import { SUBSCRIPTION_TRIAL_DAYS } from "../../config/subscription";

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
            create: jest.fn().mockResolvedValue({ id: "marker_create_1" }),
            upsert: jest.fn().mockResolvedValue({ id: "wh_1" }),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
        },
        organization: {
            findMany: jest.fn().mockResolvedValue([]),
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
        customers: {
            customerPortal: {
                create: jest.fn(),
            },
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
            expect(dodo.checkoutSessions.create).toHaveBeenCalledWith(
                expect.not.objectContaining({ subscription_data: expect.anything() })
            );
        });

        it("should not grant a repeat trial when a prior subscription record exists", async () => {
            const past = new Date();
            past.setDate(past.getDate() - 1);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                status: SubscriptionStatus.EXPIRED,
                currentPeriodEnd: past,
                trialEnd: past,
            });
            (dodo.checkoutSessions.create as jest.Mock).mockResolvedValue({
                checkout_url: "https://dodopayments.com/checkout/sess_repeat",
                session_id: "sess_repeat",
            });

            await createCheckoutSession(userId, userEmail, userName, "8.8.8.8");

            expect(dodo.checkoutSessions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    subscription_data: { trial_period_days: 0 },
                })
            );
        });

        it("should allow checkout even if user has premium (controller-level guard handles rejection)", async () => {
            const future = new Date();
            future.setDate(future.getDate() + 5);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                trialEnd: future,
                status: SubscriptionStatus.ACTIVE,
            });
            (dodo.checkoutSessions.create as jest.Mock).mockResolvedValue({
                checkout_url: "https://dodopayments.com/checkout/sess_premium",
                session_id: "sess_premium",
            });

            const result = await createCheckoutSession(userId, userEmail, userName);

            expect(result.sessionId).toBe("sess_premium");
            expect(dodo.checkoutSessions.create).toHaveBeenCalled();
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

            expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
                data: { eventId: "evt_checkout_1", eventType: "checkout.session.completed" },
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

        it("should resolve userId via customer mapping when metadata is missing", async () => {
            const mappedUserId = "mapped_user_123";
            const mockReq = {
                body: {
                    id: "evt_checkout_3",
                    type: "checkout.session.completed",
                    data: {
                        session_id: "sess_789",
                        subscription_id: "sub_789",
                        customer_id: "cust_mapped_789",
                        metadata: {},
                    },
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.subscription.findFirst as jest.Mock).mockResolvedValueOnce({
                userId: mappedUserId,
                user: { id: mappedUserId, email: "mapped@example.com" },
            });
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mappedUserId, email: "mapped@example.com" });

            await handleWebhook(mockReq, mockRes);

            expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
                data: { eventId: "evt_checkout_3", eventType: "checkout.session.completed" },
            });
            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
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

            (prisma.processedWebhook.create as jest.Mock).mockRejectedValueOnce(
                Object.assign(new Error("Unique constraint"), { code: "P2002" })
            );

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ duplicated: true }));
        });

        it("should process activation only once across payment.succeeded and checkout.session.completed", async () => {
            const eventData = {
                session_id: "sess_cross_1",
                subscription_id: "sub_cross_1",
                customer_id: "cust_cross_1",
                metadata: { userId },
                id: "pay_cross_1",
            };

            const paymentReq = {
                body: {
                    id: "evt_payment_cross_1",
                    type: "payment.succeeded",
                    data: eventData,
                },
                headers: {},
            } as any;

            const checkoutReq = {
                body: {
                    id: "evt_checkout_cross_1",
                    type: "checkout.session.completed",
                    data: eventData,
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, email: userEmail });
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

            const processedCreate = prisma.processedWebhook.create as jest.Mock;
            processedCreate
                // payment.succeeded: eventId dedup → success
                .mockResolvedValueOnce({ id: "dedup_evt_payment" })
                // payment.succeeded: activation marker → success (first claim)
                .mockResolvedValueOnce({ id: "activation_marker_created" })
                // checkout.session.completed: eventId dedup → success
                .mockResolvedValueOnce({ id: "dedup_evt_checkout" })
                // checkout.session.completed: activation marker → P2002 (duplicate claim)
                .mockRejectedValueOnce(Object.assign(new Error("Unique constraint"), { code: "P2002" }));

            await handleWebhook(paymentReq, mockRes);
            await handleWebhook(checkoutReq, mockRes);

            expect(processedCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    eventId: "activation:sub_cross_1",
                }),
            }));

            expect(prisma.processedWebhook.create).toHaveBeenCalledTimes(4);
            expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
                data: { eventId: "evt_payment_cross_1", eventType: "payment.succeeded" },
            });
            expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
                data: { eventId: "evt_checkout_cross_1", eventType: "checkout.session.completed" },
            });
            expect(prisma.systemAuditLog.create).toHaveBeenCalled();
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
                        previous_billing_date: 1704067200,
                        next_billing_date: 1706745600,
                        created_at: "2024-01-01T00:00:00.000Z",
                        trial_period_days: 7,
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
                        trialEnd: new Date("2024-01-08T00:00:00.000Z"),
                    }),
                })
            );
            expect(redis.del).toHaveBeenCalled();
        });

        it("should provision access from subscription.active when it arrives before checkout completion", async () => {
            const mockReq = {
                body: {
                    id: "evt_sub_active_first",
                    type: "subscription.active",
                    data: {
                        subscription_id: "sub_active_first",
                        status: "active",
                        customer: { customer_id: "cust_active_first" },
                        metadata: { userId },
                        created_at: "2024-01-01T00:00:00.000Z",
                        next_billing_date: "2024-01-08T00:00:00.000Z",
                        trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
                    },
                },
                headers: {},
            } as any;

            const mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            } as any;

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, email: userEmail });
            (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
                id: "sub_db_active_first",
                userId,
                status: SubscriptionStatus.ACTIVE,
            });

            await handleWebhook(mockReq, mockRes);

            expect(prisma.processedWebhook.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    eventId: "activation:sub_active_first",
                    eventType: "activation:subscription.active",
                }),
            }));
            expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
                data: { eventId: "evt_sub_active_first", eventType: "subscription.active" },
            });
            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
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
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: new Date(),
                trialEnd: future,
            });

            const result = await getSubscriptionStatus(userId);

            expect(result.isPremium).toBe(true);
        });

        it("should return isPremium=false for on-hold subscription even with a future period", async () => {
            const future = new Date();
            future.setMonth(future.getMonth() + 1);

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                status: SubscriptionStatus.ON_HOLD,
                currentPeriodEnd: future,
                trialEnd: null,
            });

            const result = await getSubscriptionStatus(userId);

            expect(result.isPremium).toBe(false);
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

    describe("createCustomerPortalSession", () => {
        it("should create a Dodo customer portal session", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                dodoCustomerId: "cust_123",
            });
            (dodo.customers.customerPortal.create as jest.Mock).mockResolvedValue({
                link: "https://customer.dodopayments.com/session/portal_123",
            });

            const result = await createCustomerPortalSession(userId);

            expect(result.portalUrl).toBe("https://customer.dodopayments.com/session/portal_123");
            expect(dodo.customers.customerPortal.create).toHaveBeenCalledWith(
                "cust_123",
                expect.objectContaining({ send_email: false })
            );
        });
    });

    describe("subscription lifecycle controls", () => {
        it("should cancel an active subscription at period end", async () => {
            const currentPeriodEnd = new Date("2026-07-01T00:00:00.000Z");

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                dodoSubscriptionId: "sub_live_123",
                currentPeriodEnd,
            });

            await cancelSubscription(userId);

            expect(dodo.subscriptions.update).toHaveBeenCalledWith("sub_live_123", {
                cancel_at_next_billing_date: true,
            });
            expect(prisma.subscription.update).toHaveBeenCalledWith({
                where: { userId },
                data: {
                    cancelAtPeriodEnd: true,
                    cancelAt: currentPeriodEnd,
                },
            });
            expect(redis.del).toHaveBeenCalledWith("user:premium:user_123");
        });

        it("should reactivate a subscription that was set to cancel", async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                userId,
                dodoSubscriptionId: "sub_live_123",
                currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
            });

            await reactivateSubscription(userId);

            expect(dodo.subscriptions.update).toHaveBeenCalledWith("sub_live_123", {
                cancel_at_next_billing_date: false,
            });
            expect(prisma.subscription.update).toHaveBeenCalledWith({
                where: { userId },
                data: {
                    cancelAtPeriodEnd: false,
                    cancelAt: null,
                },
            });
            expect(redis.del).toHaveBeenCalledWith("user:premium:user_123");
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

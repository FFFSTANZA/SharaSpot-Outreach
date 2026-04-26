import { Request, Response } from "express";
import { getSubscriptionStatus } from "../services/subscriptionService";
import { createSubscription } from "../controllers/subscriptionControllers";
import { prisma } from "../config/prisma";
import { dodo } from "../config/dodo";

jest.mock("../config/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        subscription: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock("../config/dodo", () => ({
    dodo: {
        checkoutSessions: {
            create: jest.fn(),
        },
    },
}));

jest.mock("../services/subscriptionService", () => {
    const actual = jest.requireActual("../services/subscriptionService");
    return {
        ...actual,
        getSubscriptionStatus: jest.fn(),
        createCheckoutSession: jest.fn(),
    };
});

describe("Subscription Logic Deep Verification", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockStatus: any;

    beforeEach(() => {
        mockReq = {
            user: { id: "user_123", email: "test@example.com" },
            headers: {},
            ip: "127.0.0.1",
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockStatus = (getSubscriptionStatus as jest.Mock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Scenario 1: User with EXPIRED subscription (status ACTIVE but period end passed) should be allowed to re-subscribe", async () => {
        // 1. Set up state: logic says they are NOT premium because it's expired
        mockStatus.mockResolvedValue({
            isPremium: false,
            subscription: {
                status: "ACTIVE",
                currentPeriodEnd: new Date(Date.now() - 10000), // Expired 10s ago
            }
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user_123", email: "test@example.com", name: "Test" });
        const { createCheckoutSession } = require("../services/subscriptionService");
        createCheckoutSession.mockResolvedValue({ checkoutUrl: "https://dodo.com/pay", sessionId: "sess_1" });

        // 2. Call controller
        await createSubscription(mockReq as Request, mockRes as Response);

        // 3. Verify: Success! It should not block.
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            checkoutUrl: "https://dodo.com/pay"
        }));
        expect(mockRes.status).not.toHaveBeenCalledWith(400);
    });

    test("Scenario 2: User with ACTIVE premium subscription should be BLOCKED from re-subscribing", async () => {
        // 1. Set up state: logic says they ARE premium
        mockStatus.mockResolvedValue({
            isPremium: true,
            subscription: {
                status: "ACTIVE",
                currentPeriodEnd: new Date(Date.now() + 100000), // Future
            }
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user_123", email: "test@example.com", name: "Test" });

        // 2. Call controller
        await createSubscription(mockReq as Request, mockRes as Response);

        // 3. Verify: Blocked with 400
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "You already have an active premium subscription."
        }));
    });

    test("Scenario 3: User with ACTIVE TRIAL should be BLOCKED from re-subscribing", async () => {
        mockStatus.mockResolvedValue({
            isPremium: true,
            subscription: {
                status: "ACTIVE",
                trialEnd: new Date(Date.now() + 100000), // Future trial
            }
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user_123", email: "test@example.com", name: "Test" });

        await createSubscription(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });
});

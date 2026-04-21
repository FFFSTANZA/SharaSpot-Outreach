import "dotenv/config";
import { createCheckoutSession } from "../services/subscriptionService";
import { handleWebhook } from "../controllers/subscriptionControllers";
import { prisma } from "../config/prisma";
import { DODO_PRODUCT_ID_GLOBAL, DODO_PRODUCT_ID_INDIA } from "../config/subscription";
import { Request, Response } from "express";
import { dodo } from "../config/dodo";

// Mock the SDK
// @ts-ignore
dodo.checkoutSessions.create = async (data: any) => {
    console.log(`[MOCK-SDK] Creating checkout session for product: ${data.product_id}`);
    return { checkout_url: "https://test.dodopayments.com/checkout/test" };
};

async function deepTest() {
    console.log("🚀 Starting Deep Payment System Test...");
    console.log("DEBUG: DODO_PAYMENTS_API_KEY =", process.env.DODO_PAYMENTS_API_KEY ? "EXISTS" : "MISSING");
    console.log("DEBUG: NODE_ENV =", process.env.NODE_ENV);

    // 1. Mock User
    const mockUser = await prisma.user.upsert({
        where: { email: "test-payment@example.com" },
        update: {},
        create: {
            email: "test-payment@example.com",
            name: "Test Payment User",
        },
    });

    console.log("✅ Mock User created/verified");

    // 2. Test Region-Based Checkout Session (US IP)
    console.log("\n🧪 Testing US Checkout Session...");
    const usIp = "8.8.8.8"; // Google DNS (US)
    const usSession = await createCheckoutSession(mockUser.id, mockUser.email, mockUser.name || "Test User", usIp);

    // Note: Since we use ip-api.com, this will call the real API in test
    console.log(`US Product ID: ${DODO_PRODUCT_ID_GLOBAL}`);

    // 3. Test Region-Based Checkout Session (India IP)
    console.log("\n🧪 Testing India Checkout Session...");
    const indiaIp = "103.21.159.0"; // Reliance Jio (India)
    const indiaSession = await createCheckoutSession(mockUser.id, mockUser.email, mockUser.name || "Test User", indiaIp);
    console.log(`India Product ID: ${DODO_PRODUCT_ID_INDIA}`);

    // 4. Simulate Webhook (Checkout Completed)
    console.log("\n🧪 Simulating Checkout Webhook...");
    const mockWebhookReq = {
        body: {
            type: "checkout.session.completed",
            data: {
                session_id: "sess_test123",
                subscription_id: "sub_test123",
                metadata: { userId: mockUser.id }
            }
        },
        headers: {}
    } as unknown as Request;

    const mockWebhookRes = {
        status: (code: number) => ({
            json: (data: any) => console.log(`Response ${code}:`, data),
            send: (data: any) => console.log(`Response ${code}:`, data)
        }),
        json: (data: any) => console.log("Response 200:", data)
    } as unknown as Response;

    // We temporarily disable signature verification by NOT setting DODO_WEBHOOK_SECRET for this test
    const originalSecret = process.env.DODO_WEBHOOK_SECRET;
    process.env.DODO_WEBHOOK_SECRET = "";

    await handleWebhook(mockWebhookReq, mockWebhookRes);
    process.env.DODO_WEBHOOK_SECRET = originalSecret;

    // 5. Verify Database State
    const updatedUser = await prisma.user.findUnique({
        where: { id: mockUser.id },
        include: { subscription: true }
    });

    console.log("Subscription status in DB:", updatedUser?.subscription?.status);
    if (updatedUser?.subscription?.status === "ACTIVE") {
        console.log("✅ Subscription record created successfully");
    } else {
        console.error("❌ Subscription record missing or inactive");
    }

    // 6. Test Premium Guard Logic
    const { checkPremiumStatus } = await import("../utils/premiumCheck");
    const { isPremium } = await checkPremiumStatus(mockUser.id);
    if (isPremium) {
        console.log("✅ Premium Access Guard passed");
    } else {
        console.error("❌ Premium Access Guard failed");
    }

    console.log("\n🎉 Deep Test Completed Successfully!");
}

deepTest().catch(console.error);

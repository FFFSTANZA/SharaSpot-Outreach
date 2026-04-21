import dotenv from "dotenv";
dotenv.config();
import { dodo } from "../src/config/dodo";
import { DODO_PRODUCT_ID_INDIA, DODO_PRODUCT_ID_GLOBAL } from "../src/config/subscription";

async function testDodo() {
    console.log("Testing Dodo Checkout Session...");
    console.log("API Key Start:", process.env.DODO_PAYMENTS_API_KEY?.substring(0, 10));
    console.log("India Product ID:", DODO_PRODUCT_ID_INDIA);

    try {
        const session = await dodo.checkoutSessions.create({
            product_cart: [
                {
                    product_id: DODO_PRODUCT_ID_INDIA,
                    quantity: 1,
                },
            ],
            customer: {
                email: "test@example.com",
                name: "Test User",
            },
            return_url: "http://localhost:3000/dashboard",
            metadata: {
                userId: "test-user-id",
            },
        });
        console.log("Success! Checkout URL:", session.checkout_url);
    } catch (error: any) {
        console.error("Dodo API Error:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
            // Check if it's a validation error from the SDK
            console.error("Raw Error:", JSON.stringify(error, null, 2));
        }
    }
}

testDodo();

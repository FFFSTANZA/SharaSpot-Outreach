import dotenv from "dotenv";
dotenv.config();

import { generateFollowUps } from "../src/utils/aiFollowUpService";

async function testGeneration() {
    const sampleEmail = {
        subject: "Cutting your AWS bill by 40% with SharaSpot",
        body: "Hi John, we noticed your infrastructure costs are scaling faster than your revenue. SharaSpot uses a unique spot-instance orchestration layer that guarantees 99.9% uptime while slashing compute costs by at least 40%. We've helped companies like Acme Corp save $50k/month. Do you have 10 minutes next Tuesday to look at the numbers?",
        recipientName: "John Doe",
        senderName: "Siddharth",
    };

    console.log("--- ORIGINAL EMAIL ---");
    console.log(`Subject: ${sampleEmail.subject}`);
    console.log(`Body: ${sampleEmail.body}`);
    console.log("\n--- GENERATING FOLLOW-UPS ---");

    const followUps = await generateFollowUps(sampleEmail);

    followUps.forEach(fw => {
        console.log(`\nSTEP ${fw.stepNumber} (Wait: ${fw.waitDays} days)`);
        console.log(`Subject: ${fw.subject}`);
        console.log(`Anchor: ${fw.contextSnippet || "N/A"}`);
        console.log(`Body:\n${fw.body}`);
        console.log("--------------------------------");
    });
}

testGeneration();

/**
 * SharaSpot Platform Configuration
 * Centralized constants for branding, pricing, and features.
 */

export const BRAND_CONFIG = {
    name: "SharaSpot",
    company: "Folonite",
    tagline: "Outreach that feels human, not robotic.",
    description: "Personal outreach system that sends emails like a human. Multi-sender rotation, automatic warmup, and real-time tracking.",
    url: "https://sharaspot.in",
    supportUrl: "https://tally.so/r/aQee69",
    pricing: {
        global: {
            amount: 29,
            currency: "USD",
            symbol: "$",
        },
        india: {
            amount: 499,
            currency: "INR",
            symbol: "₹",
        },
        trialDays: 7,
    },
    features: [
        {
            id: "rotation",
            title: "Multi-Sender Rotation",
            desc: "Rotate across multiple email accounts automatically. Distribute volume, avoid rate limits, and scale your outreach without risking any single account."
        },
        {
            id: "scheduling",
            title: "Human-Like Scheduling",
            desc: "Random delays between emails that mimic real sending patterns. No robotic fixed intervals that trigger spam filters."
        },
        {
            id: "warmup",
            title: "Automatic Warmup",
            desc: "New senders ramp from 20 to 500 emails/day over 14 days, building inbox reputation safely. Skip it for accounts with existing history."
        },
        {
            id: "tracking",
            title: "Open & Click Tracking",
            desc: "See who opens your emails and clicks your links. Real-time metrics with per-recipient and per-link breakdowns."
        },
        {
            id: "replies",
            title: "Reply Detection",
            desc: "Automatic inbox scanning detects replies and stops follow-ups instantly. No more awkward duplicate emails to engaged prospects."
        },
        {
            id: "security",
            title: "Encrypted & Secure",
            desc: "AES-256 encryption for credentials, JWT auth with token rotation, and per-user data isolation."
        },
        {
            id: "priority",
            title: "Priority Email",
            desc: "Bypass standard queues and route your most critical campaigns through high-throughput dedicated channels for instant delivery."
        },
    ],
};

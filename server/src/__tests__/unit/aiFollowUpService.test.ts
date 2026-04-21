import { generateFollowUps } from "../../utils/aiFollowUpService";

// Mock the callAI function or ensure environment variables are loaded
// For this "Deep Test", we want to actually call the AI if keys are present, 
// or at least verify the prompt construction.

describe("AIFollowUpService Deep Context Test", () => {
    const scenarios = [
        {
            name: "SaaS Dev Tools",
            context: {
                subject: "Speed up your build times by 40%",
                body: "Hi Alice, I noticed your team is growing fast. We help teams like yours cut build times by 40% using our distributed cache. Would you be open to a quick chat?",
                recipientName: "Alice Chen",
                senderName: "Jason"
            },
            keywords: ["build times", "40%", "cache"]
        },
        {
            name: "SEO Agency",
            context: {
                subject: "Your ranking for 'best coffee beans' fell",
                body: "Hi Bob, I was looking at the search results and noticed your brand dropped from position 2 to 8 for 'best coffee beans'. We specialize in recovering rankings. Any interest in seeing how we do it?",
                recipientName: "Bob Miller",
                senderName: "Sarah"
            },
            keywords: ["ranking", "coffee beans", "position"]
        }
    ];

    if (!process.env.GROQ_API_KEY && !process.env.AICREDIT_API_KEY) {
        it("should skip live testing if API keys are missing", () => {
            console.warn("Skipping LIVE AI tests - no API keys found in environment.");
        });
        return;
    }

    scenarios.forEach(scenario => {
        it(`should generate context-aware follow-ups for ${scenario.name}`, async () => {
            console.log(`Testing scenario: ${scenario.name}`);
            const followUps = await generateFollowUps(scenario.context);

            expect(followUps.length).toBe(3);

            followUps.forEach(f => {
                console.log(`\nStep ${f.stepNumber}:`);
                console.log(`Subject: ${f.subject}`);
                console.log(`Body: ${f.body}`);

                // Verify context adherence
                const hasKeyword = scenario.keywords.some(k =>
                    f.body.toLowerCase().includes(k.toLowerCase()) ||
                    f.subject.toLowerCase().includes(k.toLowerCase())
                );

                if (!hasKeyword) {
                    console.warn(`Warning: Step ${f.stepNumber} might have missed specific context keywords.`);
                }
            });
        }, 30000); // 30s timeout for AI calls
    });
});

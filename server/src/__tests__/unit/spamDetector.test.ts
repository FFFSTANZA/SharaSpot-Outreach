import { analyzeSpamScore } from "../../utils/spamDetector";

describe("Spam Detector", () => {
    it("should return a low score for a legitimate professional email", () => {
        const subject = "Quick question about your hiring needs at Acme Corp";
        const body = "Hi {{firstName}}, I saw that you're looking for a Senior Developer. I'd love to discuss how my background in React and Node could help your team. Best, FFFSTANZA";

        const result = analyzeSpamScore(subject, body);
        expect(result.score).toBeLessThan(25);
        expect(result.level).toBe("safe");
    });

    it("should return a high score for an email with multiple spam triggers", () => {
        const subject = "URGENT: YOU WON A FREE PRIZE!!! ACT NOW!!!";
        const body = "CONGRATULATIONS!!! Click here to claim your FREE CASH BONUS now! No cost, no obligation! WIN BIG TODAY!!!";

        const result = analyzeSpamScore(subject, body);
        expect(result.score).toBeGreaterThan(60);
        expect(result.level).toBe("high_risk");
    });

    it("should penalize excessive ALL CAPS in the body", () => {
        const subject = "Meeting next week";
        const body = "PLEASE RESPOND IMMEDIATELY TO THIS MESSAGE. WE NEED YOUR HELP TO FINISH THE PROJECT ON TIME. DO NOT DELAY!!!";

        const result = analyzeSpamScore(subject, body);
        expect(result.metrics.capsRatio).toBeGreaterThan(0.2);
        expect(result.score).toBeGreaterThan(0);
    });

    it("should penalize excessive punctuation", () => {
        const subject = "Is this yours???";
        const body = "Check this out now!!!!!! $$$ amazing deal $$$ !!!";

        const result = analyzeSpamScore(subject, body);
        expect(result.metrics.punctuationDensity).toBeGreaterThan(0.05);
        expect(result.score).toBeGreaterThan(0);
    });

    it("should detect spam trigger words", () => {
        const subject = "Urgent: work from home";
        const body = "Make money now! Free! offer";

        const result = analyzeSpamScore(subject, body);
        expect(result.triggers.length).toBeGreaterThan(0);
        expect(result.score).toBeGreaterThan(0);
    });

    it("should penalize too many plain-text URLs", () => {
        const subject = "Resources for you";
        const body = "Hi, see https://a.example.com https://b.example.com https://c.example.com https://d.example.com";

        const result = analyzeSpamScore(subject, body);
        expect(result.metrics.linkCount).toBe(4);
        expect(result.triggers).toContain("too-many-links");
    });
});

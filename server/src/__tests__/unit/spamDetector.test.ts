import { analyzeSpamScore } from "../../utils/spamDetector";

describe("Spam Detector", () => {
    it("should return a low score for a legitimate professional email", () => {
        const subject = "Quick question about your hiring needs at Acme Corp";
        const body = "Hi {{firstName}}, I saw that you're looking for a Senior Developer. I'd love to discuss how my background in React and Node could help your team. Best, FFFSTANZA";

        const result = analyzeSpamScore(subject, body);
        expect(result.score).toBeLessThan(20);
        expect(result.level).toBe("safe");
    });

    it("should return a high score for an email with multiple spam triggers", () => {
        const subject = "URGENT: YOU WON A FREE PRIZE!!! ACT NOW!!!";
        const body = "CONGRATULATIONS!!! Click here to claim your FREE CASH BONUS now! No cost, no obligation! WIN BIG TODAY!!!";

        const result = analyzeSpamScore(subject, body);
        expect(result.score).toBeGreaterThan(60);
        expect(result.level).toBe("very_high_risk");
    });

    it("should penalize excessive ALL CAPS in the body", () => {
        const subject = "Meeting next week";
        const body = "PLEASE RESPOND IMMEDIATELY TO THIS MESSAGE. WE NEED YOUR HELP TO FINISH THE PROJECT ON TIME. DO NOT DELAY!!!";

        const result = analyzeSpamScore(subject, body);
        const capsCheck = result.checks.find(c => c.check === "Excessive ALL CAPS");
        expect(capsCheck?.passed).toBe(false);
        expect(capsCheck?.penalty).toBeGreaterThan(0);
    });

    it("should penalize excessive punctuation", () => {
        const subject = "Is this yours???";
        const body = "Check this out now!!!!!! $$$ amazing deal $$$ !!!";

        const result = analyzeSpamScore(subject, body);
        const punctCheck = result.checks.find(c => c.check === "Excessive Punctuation");
        expect(punctCheck?.passed).toBe(false);
        expect(punctCheck?.penalty).toBeGreaterThan(0);
    });

    it("should penalize lack of personalization", () => {
        const subject = "Hello";
        const body = "I am sending this to everyone I know. Please check it out.";

        const result = analyzeSpamScore(subject, body);
        const personalizeCheck = result.checks.find(c => c.check === "Personalization");
        expect(personalizeCheck?.penalty).toBe(10);
    });

    it("should detect hidden or tiny text in HTML", () => {
        const subject = "Newsletter";
        const body = "Read our news.";
        const html = `<div style="display:none">secret spam words</div><p style="font-size:1px">tiny spam words</p>`;

        const result = analyzeSpamScore(subject, body, html);
        const htmlCheck = result.checks.find(c => c.check === "HTML Quality");
        expect(htmlCheck?.passed).toBe(false);
        expect(htmlCheck?.penalty).toBeGreaterThan(20);
    });
});

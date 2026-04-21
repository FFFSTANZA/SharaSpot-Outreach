import { evaluateTiming, applyMicroJitter, calculateOptimalDelay, shouldProceed } from "../../utils/timingEngine";
import { getRecentCongestionScore } from "../../utils/signalCollector";

jest.mock("../../utils/signalCollector", () => ({
    getRecentCongestionScore: jest.fn(),
}));

describe("timingEngine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("evaluateTiming", () => {
        it("decision: Low congestion (< 150)", () => {
            const decision = evaluateTiming(100);
            expect(decision.action).toBe("SEND_IMMEDIATELY");
            expect(decision.suggestedDelayMs).toBe(0);
        });

        it("decision: Medium congestion (150-400)", () => {
            const decision = evaluateTiming(250);
            expect(decision.action).toBe("HOLD_AND_RETRY");
            expect(decision.suggestedDelayMs).toBeGreaterThanOrEqual(30000);
            expect(decision.suggestedDelayMs).toBeLessThanOrEqual(120000);
        });

        it("decision: High congestion (> 400)", () => {
            const decision = evaluateTiming(500);
            expect(decision.action).toBe("DELAY_TO_NEXT_WINDOW");
            expect(decision.suggestedDelayMs).toBeGreaterThanOrEqual(300000);
        });
    });

    describe("shouldProceed", () => {
        it("returns true only for SEND_IMMEDIATELY", () => {
            expect(shouldProceed({ action: "SEND_IMMEDIATELY" } as any)).toBe(true);
            expect(shouldProceed({ action: "HOLD_AND_RETRY" } as any)).toBe(false);
        });
    });

    describe("calculateOptimalDelay", () => {
        it("combines base delay, congestion delay, and micro-jitter", async () => {
            (getRecentCongestionScore as jest.Mock).mockResolvedValue(100); // Low

            const delay = await calculateOptimalDelay("test.com", 1000);

            // Low congestion = 0 delay. Base = 1000. Jitter = 500-3000.
            expect(delay).toBeGreaterThanOrEqual(1500);
            expect(delay).toBeLessThanOrEqual(4000);
        });
    });

    describe("applyMicroJitter", () => {
        it("returns value between 500 and 3000", () => {
            const jitter = applyMicroJitter();
            expect(jitter).toBeGreaterThanOrEqual(500);
            expect(jitter).toBeLessThanOrEqual(3000);
        });
    });
});

import { collectSmtpTiming, computeCongestionScore, getRecentCongestionScore } from "../../utils/signalCollector";
import { resolveMxWithTiming } from "../../utils/mxResolver";
import { prisma } from "../../config/prisma";

jest.mock("../../utils/mxResolver", () => ({
    resolveMxWithTiming: jest.fn(),
}));

jest.mock("../../config/prisma", () => ({
    prisma: {
        smtpSignalLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe("signalCollector", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("collectSmtpTiming", () => {
        it("collects and logs signal correctly", async () => {
            (resolveMxWithTiming as jest.Mock).mockResolvedValue([
                { exchange: "mx1.com", priority: 10, latencyMs: 120 }
            ]);
            (prisma.smtpSignalLog.create as jest.Mock).mockResolvedValue({});

            const metrics = await collectSmtpTiming("sender-1", "recipient.com");

            expect(metrics.tcpConnectMs).toBe(120 * 0.3);
            expect(prisma.smtpSignalLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    recipientDomain: "recipient.com",
                    senderId: "sender-1",
                })
            }));
        });

        it("returns default metrics on failure", async () => {
            (resolveMxWithTiming as jest.Mock).mockRejectedValue(new Error("DNS down"));

            const metrics = await collectSmtpTiming("sender-1", "recipient.com");

            expect(metrics.tcpConnectMs).toBe(200);
            expect(metrics.greetingDelayMs).toBe(300);
        });
    });

    describe("computeCongestionScore", () => {
        it("scales correctly (0-1000)", () => {
            const lowMetrics = {
                tcpConnectMs: 50,
                greetingDelayMs: 100,
                tlsHandshakeMs: 150,
                mailFromMs: 100,
                rcptToMs: 80,
                dataMs: 120,
                totalMs: 600,
            };

            const score = computeCongestionScore(lowMetrics);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(150);
        });

        it("caps at 1000", () => {
            const extremeMetrics = {
                tcpConnectMs: 10000,
                greetingDelayMs: 10000,
                tlsHandshakeMs: 10000,
                mailFromMs: 10000,
                rcptToMs: 10000,
                dataMs: 10000,
                totalMs: 60000,
            };

            const score = computeCongestionScore(extremeMetrics);
            expect(score).toBe(1000);
        });
    });

    describe("getRecentCongestionScore", () => {
        it("returns average of recent logs", async () => {
            (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue([
                { congestionScore: 100 },
                { congestionScore: 200 },
            ]);

            const score = await getRecentCongestionScore("recipient.com");
            expect(score).toBe(150);
        });

        it("returns default 250 if no logs found", async () => {
            (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue([]);
            const score = await getRecentCongestionScore("recipient.com");
            expect(score).toBe(250);
        });
    });
});

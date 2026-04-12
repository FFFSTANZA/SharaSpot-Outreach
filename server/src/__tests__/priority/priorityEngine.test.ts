/**
 * Priority Engine Tests
 * 
 * Tests for signal collection, timing engine decisions, and congestion scoring
 */

process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import * as fc from "fast-check";
import { prisma } from "../../config/prisma";
import {
  collectSmtpTiming,
  computeCongestionScore,
  SmtpSignalMetrics,
  getRecentCongestionScore,
  getSenderSignalStats,
} from "../../utils/signalCollector";
import {
  evaluateTiming,
  applyMicroJitter,
  getOptimalSendWindow,
  calculateOptimalDelay,
  shouldProceed,
  getHoldDuration,
} from "../../utils/timingEngine";
import {
  checkUserPriorityQuota,
  incrementPriorityQuota,
  getPriorityQuotaStatus,
  checkDomainLimit,
  incrementDomainRate,
  checkWarmupRequirement,
  performSafetyChecks,
} from "../../utils/prioritySafetyLimits";

// Mock dependencies
jest.mock("../../config/prisma", () => ({
  prisma: {
    smtpSignalLog: {
      create: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn().mockResolvedValue([]),
    },
    priorityUserQuota: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({
        userId: args.data.userId,
        dailyCount: args.data.dailyCount ?? 0,
        dailyLimit: args.data.dailyLimit ?? 50,
        dailyResetAt: args.data.dailyResetAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      })),
      update: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(undefined),
    },
    domainRateLimit: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({
        domain: args.data.domain,
        hourlyCount: args.data.hourlyCount ?? 0,
        windowStart: args.data.windowStart ?? new Date(),
      })),
      update: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(undefined),
    },
    emailJob: {
      count: jest.fn().mockResolvedValue(100),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock("../../utils/warmupEvaluator", () => ({
  isInWarmup: jest.fn().mockResolvedValue(false),
}));

jest.mock("../../utils/throttleEngine", () => ({
  getEffectiveLimits: jest.fn().mockResolvedValue({ perDay: 500 }),
}));

describe("Signal Collector Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("computeCongestionScore", () => {
    it("should return low score for fast SMTP metrics", () => {
      const metrics: SmtpSignalMetrics = {
        tcpConnectMs: 10,
        greetingDelayMs: 50,
        tlsHandshakeMs: 100,
        mailFromMs: 50,
        rcptToMs: 30,
        dataMs: 100,
        totalMs: 340,
      };

      const score = computeCongestionScore(metrics);

      // Score should be in the LOW range (< 150)
      expect(score).toBeLessThan(150);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it("should return medium score for moderate SMTP metrics", () => {
      const metrics: SmtpSignalMetrics = {
        tcpConnectMs: 1000,
        greetingDelayMs: 2000,
        tlsHandshakeMs: 1500,
        mailFromMs: 1000,
        rcptToMs: 800,
        dataMs: 2000,
        totalMs: 8300,
      };

      const score = computeCongestionScore(metrics);

      // Score should be in the MEDIUM range (150-400)
      expect(score).toBeGreaterThanOrEqual(150);
      expect(score).toBeLessThan(400);
    });

    it("should return high score for slow SMTP metrics", () => {
      const metrics: SmtpSignalMetrics = {
        tcpConnectMs: 5000,
        greetingDelayMs: 8000,
        tlsHandshakeMs: 6000,
        mailFromMs: 5000,
        rcptToMs: 4000,
        dataMs: 8000,
        totalMs: 36000,
      };

      const score = computeCongestionScore(metrics);

      // Score should be in the HIGH range (>= 400)
      expect(score).toBeGreaterThanOrEqual(400);
    });

    it("should cap score at 1000 maximum", () => {
      const metrics: SmtpSignalMetrics = {
        tcpConnectMs: 10000,
        greetingDelayMs: 10000,
        tlsHandshakeMs: 10000,
        mailFromMs: 10000,
        rcptToMs: 10000,
        dataMs: 10000,
        totalMs: 60000,
      };

      const score = computeCongestionScore(metrics);

      expect(score).toBeLessThanOrEqual(1000);
    });

    it("property: congestion score is always between 0 and 1000", async () => {
      await fc.assert(
        fc.property(
          fc.record({
            tcpConnectMs: fc.integer({ min: 0, max: 5000 }),
            greetingDelayMs: fc.integer({ min: 0, max: 5000 }),
            tlsHandshakeMs: fc.integer({ min: 0, max: 5000 }),
            mailFromMs: fc.integer({ min: 0, max: 5000 }),
            rcptToMs: fc.integer({ min: 0, max: 5000 }),
            dataMs: fc.integer({ min: 0, max: 5000 }),
          }),
          (metrics) => {
            const fullMetrics: SmtpSignalMetrics = {
              ...metrics,
              totalMs: 0,
            };
            const score = computeCongestionScore(fullMetrics);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1000);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("getRecentCongestionScore", () => {
    it("should return default score when no logs exist", async () => {
      (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue([]);

      const score = await getRecentCongestionScore("gmail.com");

      expect(score).toBe(250); // Default medium score
    });

    it("should calculate average from recent logs", async () => {
      (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue([
        { congestionScore: 100 },
        { congestionScore: 200 },
        { congestionScore: 300 },
      ]);

      const score = await getRecentCongestionScore("gmail.com");

      expect(score).toBe(200); // Average of 100, 200, 300
    });

    it("should only use last 10 logs", async () => {
      // Simulate 15 logs returned in desc order (most recent first)
      // With scores 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0
      const logs = Array.from({ length: 15 }, (_, i) => ({
        congestionScore: (14 - i) * 10, // Descending: 140, 130, ..., 0
      }));

      (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue(logs.slice(0, 10));

      const score = await getRecentCongestionScore("gmail.com");

      // Should only use first 10 logs (most recent): 140, 130, 120, 110, 100, 90, 80, 70, 60, 50
      // Average = (140 + 130 + 120 + 110 + 100 + 90 + 80 + 70 + 60 + 50) / 10 = 950 / 10 = 95
      expect(score).toBe(95);
    });

    it("should calculate correct average from logs", async () => {
      // Test with exactly 10 logs
      const logs = [
        { congestionScore: 100 },
        { congestionScore: 200 },
        { congestionScore: 300 },
        { congestionScore: 400 },
        { congestionScore: 500 },
        { congestionScore: 100 },
        { congestionScore: 200 },
        { congestionScore: 300 },
        { congestionScore: 400 },
        { congestionScore: 500 },
      ];

      (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue(logs);

      const score = await getRecentCongestionScore("gmail.com");

      // Average of all 10 = (100+200+300+400+500+100+200+300+400+500) / 10 = 3000 / 10 = 300
      expect(score).toBe(300);
    });
  });

  describe("getSenderSignalStats", () => {
    it("should return default stats when no signals exist", async () => {
      (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await getSenderSignalStats("sender-1");

      expect(stats.avgCongestionScore).toBe(250);
      expect(stats.totalSignals).toBe(0);
      expect(stats.lastSignalAt).toBeNull();
    });

    it("should calculate stats from signals", async () => {
      const now = new Date();
      (prisma.smtpSignalLog.findMany as jest.Mock).mockResolvedValue([
        { congestionScore: 100, recordedAt: now },
        { congestionScore: 200, recordedAt: new Date(now.getTime() - 1000) },
        { congestionScore: 300, recordedAt: new Date(now.getTime() - 2000) },
      ]);

      const stats = await getSenderSignalStats("sender-1");

      expect(stats.avgCongestionScore).toBe(200);
      expect(stats.totalSignals).toBe(3);
      expect(stats.lastSignalAt).toEqual(now);
    });
  });
});

describe("Timing Engine Tests", () => {
  describe("evaluateTiming", () => {
    it("should send immediately for low congestion (< 150)", () => {
      const decision = evaluateTiming(100);

      expect(decision.action).toBe("SEND_IMMEDIATELY");
      expect(decision.suggestedDelayMs).toBe(0);
      expect(decision.congestionScore).toBe(100);
    });

    it("should hold and retry for medium congestion (150-400)", () => {
      const decision = evaluateTiming(250);

      expect(decision.action).toBe("HOLD_AND_RETRY");
      expect(decision.suggestedDelayMs).toBeGreaterThanOrEqual(30000);
      expect(decision.suggestedDelayMs).toBeLessThanOrEqual(120000);
      expect(decision.congestionScore).toBe(250);
    });

    it("should delay to next window for high congestion (> 400)", () => {
      const decision = evaluateTiming(500);

      expect(decision.action).toBe("DELAY_TO_NEXT_WINDOW");
      expect(decision.suggestedDelayMs).toBeGreaterThanOrEqual(300000);
      expect(decision.suggestedDelayMs).toBeLessThanOrEqual(900000);
      expect(decision.congestionScore).toBe(500);
    });

    it("property: low congestion always results in SEND_IMMEDIATELY", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 149 }),
          (score) => {
            const decision = evaluateTiming(score);
            expect(decision.action).toBe("SEND_IMMEDIATELY");
          }
        ),
        { numRuns: 50 }
      );
    });

    it("property: high congestion always results in DELAY_TO_NEXT_WINDOW", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1000 }),
          (score) => {
            const decision = evaluateTiming(score);
            expect(decision.action).toBe("DELAY_TO_NEXT_WINDOW");
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("applyMicroJitter", () => {
    it("should return value within expected range", () => {
      const jitter = applyMicroJitter();

      expect(jitter).toBeGreaterThanOrEqual(500);
      expect(jitter).toBeLessThanOrEqual(3000);
    });

    it("should return different values on multiple calls", () => {
      const jitters = new Set();
      for (let i = 0; i < 10; i++) {
        jitters.add(applyMicroJitter());
      }
      // Should have some variation (not all identical)
      expect(jitters.size).toBeGreaterThan(1);
    });

    it("property: micro jitter is always between 500ms and 3000ms", async () => {
      await fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const jitter = applyMicroJitter();
            expect(jitter).toBeGreaterThanOrEqual(500);
            expect(jitter).toBeLessThanOrEqual(3000);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("getOptimalSendWindow", () => {
    it("should return default window with reasonable values", async () => {
      const window = await getOptimalSendWindow("gmail.com");

      expect(window.hour).toBeGreaterThanOrEqual(0);
      expect(window.hour).toBeLessThanOrEqual(23);
      expect(window.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(window.dayOfWeek).toBeLessThanOrEqual(6);
      expect(window.confidence).toBeGreaterThanOrEqual(0);
      expect(window.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe("shouldProceed", () => {
    it("should return true for SEND_IMMEDIATELY", () => {
      const decision = evaluateTiming(50);
      expect(shouldProceed(decision)).toBe(true);
    });

    it("should return false for HOLD_AND_RETRY", () => {
      const decision = evaluateTiming(250);
      expect(shouldProceed(decision)).toBe(false);
    });

    it("should return false for DELAY_TO_NEXT_WINDOW", () => {
      const decision = evaluateTiming(500);
      expect(shouldProceed(decision)).toBe(false);
    });
  });

  describe("getHoldDuration", () => {
    it("should return suggested delay for HOLD_AND_RETRY", () => {
      const decision = evaluateTiming(250);
      expect(getHoldDuration(decision)).toBe(decision.suggestedDelayMs);
    });

    it("should return 0 for SEND_IMMEDIATELY", () => {
      const decision = evaluateTiming(50);
      expect(getHoldDuration(decision)).toBe(0);
    });

    it("should return 0 for DELAY_TO_NEXT_WINDOW", () => {
      const decision = evaluateTiming(500);
      expect(getHoldDuration(decision)).toBe(0);
    });
  });
});

describe("Safety Limits Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkUserPriorityQuota", () => {
    it("should allow when quota exists and not exceeded", async () => {
      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue({
        userId: "user-1",
        dailyCount: 10,
        dailyLimit: 50,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await checkUserPriorityQuota("user-1");

      expect(result.allowed).toBe(true);
    });

    it("should deny when quota exceeded", async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue({
        userId: "user-1",
        dailyCount: 50,
        dailyLimit: 50,
        dailyResetAt: tomorrow,
      });

      const result = await checkUserPriorityQuota("user-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Daily priority quota exceeded");
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("should create new quota if not exists", async () => {
      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkUserPriorityQuota("user-1");

      expect(prisma.priorityUserQuota.create).toHaveBeenCalledWith({
        data: { userId: "user-1", dailyCount: 0, dailyLimit: 50 },
      });
      expect(result.allowed).toBe(true);
    });

    it("should reset quota when daily reset time passed", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue({
        userId: "user-1",
        dailyCount: 45,
        dailyLimit: 50,
        dailyResetAt: yesterday,
      });

      const result = await checkUserPriorityQuota("user-1");

      expect(prisma.priorityUserQuota.update).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
    });
  });

  describe("getPriorityQuotaStatus", () => {
    it("should return current quota status", async () => {
      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue({
        userId: "user-1",
        dailyCount: 20,
        dailyLimit: 50,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const status = await getPriorityQuotaStatus("user-1");

      expect(status.used).toBe(20);
      expect(status.limit).toBe(50);
      expect(status.remaining).toBe(30);
    });
  });

  describe("checkDomainLimit", () => {
    it("should allow when under domain limit", async () => {
      (prisma.domainRateLimit.findUnique as jest.Mock).mockResolvedValue({
        domain: "gmail.com",
        hourlyCount: 50,
        windowStart: new Date(),
      });

      const result = await checkDomainLimit("gmail.com");

      expect(result.allowed).toBe(true);
    });

    it("should deny when domain limit exceeded", async () => {
      (prisma.domainRateLimit.findUnique as jest.Mock).mockResolvedValue({
        domain: "gmail.com",
        hourlyCount: 100,
        windowStart: new Date(),
      });

      const result = await checkDomainLimit("gmail.com");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Rate limit exceeded");
      expect(result.retryAfterMs).toBe(60 * 60 * 1000);
    });

    it("should create new limit if not exists", async () => {
      (prisma.domainRateLimit.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkDomainLimit("example.com");

      expect(prisma.domainRateLimit.create).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
    });

    it("should have lower limit for Gmail", async () => {
      (prisma.domainRateLimit.findUnique as jest.Mock).mockResolvedValue({
        domain: "gmail.com",
        hourlyCount: 95,
        windowStart: new Date(),
      });

      const result = await checkDomainLimit("gmail.com");

      expect(result.allowed).toBe(true);

      // At 100 it should be denied
      (prisma.domainRateLimit.findUnique as jest.Mock).mockResolvedValue({
        domain: "gmail.com",
        hourlyCount: 100,
        windowStart: new Date(),
      });

      const result2 = await checkDomainLimit("gmail.com");
      expect(result2.allowed).toBe(false);
    });
  });

  describe("performSafetyChecks", () => {
    it("should allow when all checks pass", async () => {
      const { isInWarmup } = jest.requireMock("../../utils/warmupEvaluator");
      (isInWarmup as jest.Mock).mockResolvedValue(false);

      (prisma.priorityUserQuota.findUnique as jest.Mock).mockResolvedValue({
        userId: "user-1",
        dailyCount: 10,
        dailyLimit: 50,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      (prisma.domainRateLimit.findUnique as jest.Mock).mockResolvedValue({
        domain: "gmail.com",
        hourlyCount: 10,
        windowStart: new Date(),
      });

      const result = await performSafetyChecks("user-1", "sender-1", "gmail.com");

      expect(result.allowed).toBe(true);
    });

    it("should deny when sender in warmup", async () => {
      const { isInWarmup } = jest.requireMock("../../utils/warmupEvaluator");
      (isInWarmup as jest.Mock).mockResolvedValue(true);

      const result = await performSafetyChecks("user-1", "sender-1", "gmail.com");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("warmup");
    });
  });
});

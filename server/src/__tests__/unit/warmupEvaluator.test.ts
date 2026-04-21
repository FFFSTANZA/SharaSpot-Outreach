import { getWarmupDayLimit, isInWarmup, DEFAULT_WARMUP_DAILY_LIMITS } from "../../utils/warmupEvaluator";
import { prisma } from "../../config/prisma";

jest.mock("../../config/prisma", () => ({
    prisma: {
        warmupSchedule: {
            findUnique: jest.fn(),
        },
    },
}));

describe("warmupEvaluator", () => {
    const senderId = "sender-123";
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getWarmupDayLimit", () => {
        it("returns null if no schedule exists", async () => {
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue(null);
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBeNull();
        });

        it("returns null if opted out", async () => {
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: true,
                isActive: true,
            });
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBeNull();
        });

        it("returns null if inactive", async () => {
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: false,
                isActive: false,
            });
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBeNull();
        });

        it("returns correct limit for Day 0", async () => {
            const now = Date.now();
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: false,
                isActive: true,
                startDate: new Date(now - 1000), // Started just now
                durationDays: 14,
                dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
            });
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBe(DEFAULT_WARMUP_DAILY_LIMITS[0]);
        });

        it("returns correct limit for Day 5", async () => {
            const now = Date.now();
            const fiveDaysAgo = new Date(now - 5 * MS_PER_DAY - 1000);
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: false,
                isActive: true,
                startDate: fiveDaysAgo,
                durationDays: 14,
                dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
            });
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBe(DEFAULT_WARMUP_DAILY_LIMITS[5]);
        });

        it("returns null if warmup period completed (Day 15)", async () => {
            const now = Date.now();
            const fifteenDaysAgo = new Date(now - 15 * MS_PER_DAY);
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: false,
                isActive: true,
                startDate: fifteenDaysAgo,
                durationDays: 14,
                dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
            });
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBeNull();
        });

        it("uses custom daily limits if provided", async () => {
            const customLimits = [10, 20, 30];
            const now = Date.now();
            const oneDayAgo = new Date(now - MS_PER_DAY - 1000);
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: false,
                isActive: true,
                startDate: oneDayAgo,
                durationDays: 3,
                dailyLimits: customLimits,
            });
            const limit = await getWarmupDayLimit(senderId);
            expect(limit).toBe(20);
        });
    });

    describe("isInWarmup", () => {
        it("returns true if limit is not null", async () => {
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue({
                senderId,
                optedOut: false,
                isActive: true,
                startDate: new Date(),
                durationDays: 14,
                dailyLimits: DEFAULT_WARMUP_DAILY_LIMITS,
            });
            const warmup = await isInWarmup(senderId);
            expect(warmup).toBe(true);
        });

        it("returns false if limit is null", async () => {
            (prisma.warmupSchedule.findUnique as jest.Mock).mockResolvedValue(null);
            const warmup = await isInWarmup(senderId);
            expect(warmup).toBe(false);
        });
    });
});

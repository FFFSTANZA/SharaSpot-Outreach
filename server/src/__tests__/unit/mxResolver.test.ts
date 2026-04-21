import { resolveMxWithTiming, selectFastestMx, isHighTrafficProvider, getProviderThresholds } from "../../utils/mxResolver";
import { redis } from "../../config/redis";
import dns from "dns";

jest.mock("../../config/redis", () => ({
    redis: {
        get: jest.fn(),
        setex: jest.fn(),
    },
}));

jest.mock("dns", () => ({
    resolveMx: jest.fn(),
    resolve4: jest.fn(),
}));

describe("mxResolver", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("resolveMxWithTiming", () => {
        it("returns cached records if available", async () => {
            const cached = JSON.stringify([{ exchange: "mx.cached.com", priority: 10, latencyMs: 50 }]);
            (redis.get as jest.Mock).mockResolvedValue(cached);

            const result = await resolveMxWithTiming("cached.com");
            expect(result).toEqual(JSON.parse(cached));
            expect(dns.resolveMx).not.toHaveBeenCalled();
        });

        it("resolves and measures timing if not cached", async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);
            (dns.resolveMx as unknown as jest.Mock).mockImplementation((domain, cb) => {
                cb(null, [{ exchange: "mx1.com", priority: 10 }, { exchange: "mx2.com", priority: 20 }]);
            });
            (dns.resolve4 as unknown as jest.Mock).mockImplementation((host, cb) => {
                cb(null, ["1.2.3.4"]);
            });

            const result = await resolveMxWithTiming("test.com", true);

            expect(result).toHaveLength(2);
            expect(result[0].exchange).toBe("mx1.com");
            expect(result[0].latencyMs).toBeDefined();
            expect(redis.setex).toHaveBeenCalled();
        });

        it("sorts by priority then latency", async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);
            (dns.resolveMx as unknown as jest.Mock).mockImplementation((domain, cb) => {
                cb(null, [
                    { exchange: "slow-p10.com", priority: 10 },
                    { exchange: "fast-p20.com", priority: 20 },
                    { exchange: "fast-p10.com", priority: 10 },
                ]);
            });

            (dns.resolve4 as unknown as jest.Mock).mockImplementation((host, cb) => {
                if (host === "slow-p10.com") {
                    setTimeout(() => cb(null, ["1.1.1.1"]), 50);
                } else {
                    cb(null, ["2.2.2.2"]);
                }
            });

            const result = await resolveMxWithTiming("sort.com", false);

            expect(result[0].exchange).toBe("fast-p10.com"); // Priority 10, Fast
            expect(result[1].exchange).toBe("slow-p10.com"); // Priority 10, Slow
            expect(result[2].exchange).toBe("fast-p20.com"); // Priority 20
        });
    });

    describe("selectFastestMx", () => {
        it("returns the first record if list is not empty", () => {
            const records = [
                { exchange: "mx1.com", priority: 10, latencyMs: 20 },
                { exchange: "mx2.com", priority: 10, latencyMs: 50 },
            ];
            expect(selectFastestMx(records)).toBe("mx1.com");
        });

        it("returns empty string if list is empty", () => {
            expect(selectFastestMx([])).toBe("");
        });
    });

    describe("isHighTrafficProvider", () => {
        it("returns true for Gmail", () => {
            expect(isHighTrafficProvider("gmail.com")).toBe(true);
            expect(isHighTrafficProvider("sub.google.com")).toBe(true);
        });

        it("returns false for unknown domain", () => {
            expect(isHighTrafficProvider("private-corp.com")).toBe(false);
        });
    });

    describe("getProviderThresholds", () => {
        it("returns strict thresholds for Gmail", () => {
            const t = getProviderThresholds("gmail.com");
            expect(t.maxPerHour).toBe(100);
            expect(t.congestionThreshold).toBe(200);
        });

        it("returns default thresholds for unknown domain", () => {
            const t = getProviderThresholds("anything.com");
            expect(t.maxPerHour).toBe(300);
        });
    });
});

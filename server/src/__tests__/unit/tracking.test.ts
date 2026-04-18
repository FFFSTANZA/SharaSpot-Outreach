import { handleOpen, handleClick, bufferTrackingEvent } from "../../controllers/trackingControllers";
import { redis } from "../../config/redis";
import { Request, Response } from "express";

// Mock dependencies
jest.mock("../../config/redis", () => ({
    redis: {
        lpush: jest.fn().mockResolvedValue(1),
        rpop: jest.fn(),
    },
}));

jest.mock("../../config/prisma", () => ({
    prisma: {
        trackingEvent: {
            createMany: jest.fn(),
        },
        emailJob: {
            findMany: jest.fn(),
        },
    },
}));

jest.mock("../../utils/contactService", () => ({
    logContactActivityByEmail: jest.fn(),
}));

describe("Tracking Controllers", () => {
    const emailJobId = "job-123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("handleOpen", () => {
        it("should buffer an OPEN event and return a transparent GIF", async () => {
            const req = {
                params: { emailJobId },
                headers: { "user-agent": "Mozilla/5.0", "x-forwarded-for": "1.2.3.4" },
            } as unknown as Request;

            const res = {
                set: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
                end: jest.fn(),
            } as unknown as Response;

            await handleOpen(req, res);

            // Verify buffering
            expect(redis.lpush).toHaveBeenCalledWith(
                "tracking:events:buffer",
                expect.stringContaining('"eventType":"OPEN"')
            );
            expect(redis.lpush).toHaveBeenCalledWith(
                "tracking:events:buffer",
                expect.stringContaining('"emailJobId":"job-123"')
            );

            // Verify response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
                "Content-Type": "image/gif",
            }));
        });
    });

    describe("handleClick", () => {
        it("should buffer a CLICK event and redirect to the target URL", async () => {
            const targetUrl = "https://example.com/promo";
            const req = {
                params: { emailJobId },
                query: { url: encodeURIComponent(targetUrl) },
                headers: { "user-agent": "Mozilla/5.0" },
            } as unknown as Request;

            const res = {
                redirect: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            await handleClick(req, res);

            // Verify buffering
            expect(redis.lpush).toHaveBeenCalledWith(
                "tracking:events:buffer",
                expect.stringContaining('"eventType":"CLICK"')
            );
            expect(redis.lpush).toHaveBeenCalledWith(
                "tracking:events:buffer",
                expect.stringContaining(`"url":"${targetUrl}"`)
            );

            // Verify redirect
            expect(res.redirect).toHaveBeenCalledWith(302, targetUrl);
        });

        it("should return 400 if URL is missing", async () => {
            const req = {
                params: { emailJobId },
                query: {},
            } as unknown as Request;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            } as unknown as Response;

            await handleClick(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing url parameter" });
        });
    });
});

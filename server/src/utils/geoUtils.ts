import { Request } from "express";
import { logger } from "./logger";

export interface GeoInfo {
    countryCode: string | null;
    region: string | null;
}

const GEO_CACHE_TTL = 86400; // 24 hours — well within free-tier rate limits

/**
 * Extracts the real client IP from an Express request.
 * - Handles x-forwarded-for (may contain comma-separated proxy chain)
 * - Handles IPv4-mapped IPv6 addresses (::ffff:127.0.0.1)
 * - Falls back to req.ip then empty string
 */
export function extractClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        const first = (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
        if (first) return first;
    }
    const raw = req.ip || "";
    return raw.replace(/^::ffff:/, "");
}

function isPrivateIp(ip: string): boolean {
    if (!ip || ip === "::1" || ip === "127.0.0.1") return true;

    if (!ip.includes(":")) {
        return (
            ip.startsWith("127.") ||
            ip.startsWith("192.168.") ||
            ip.startsWith("10.") ||
            ip.startsWith("172.16.") ||
            ip.startsWith("172.17.") ||
            ip.startsWith("172.18.") ||
            ip.startsWith("172.19.") ||
            ip.startsWith("172.20.") ||
            ip.startsWith("172.21.") ||
            ip.startsWith("172.22.") ||
            ip.startsWith("172.23.") ||
            ip.startsWith("172.24.") ||
            ip.startsWith("172.25.") ||
            ip.startsWith("172.26.") ||
            ip.startsWith("172.27.") ||
            ip.startsWith("172.28.") ||
            ip.startsWith("172.29.") ||
            ip.startsWith("172.30.") ||
            ip.startsWith("172.31.") ||
            ip.startsWith("0.") ||
            ip.startsWith("169.254.")
        );
    }

    // IPv6 private ranges
    const firstGroup = ip.split(":")[0].toLowerCase();
    return (
        firstGroup === "fe80" ||
        (firstGroup.length === 4 && firstGroup >= "fc00" && firstGroup <= "fdff")
    );
}

/**
 * Attempts to read a cached geo result from Redis.
 */
async function getCachedCountryCode(ip: string): Promise<string | null> {
    try {
        const { redis } = await import("../config/redis");
        const cached = await redis.get(`geo:ip:${ip}`);
        if (cached) {
            logger.debug({ ip }, "GeoIP cache hit");
            return cached;
        }
    } catch {
        // Redis unavailable — skip cache
    }
    return null;
}

/**
 * Writes a geo result to Redis cache (best-effort).
 */
async function setCachedCountryCode(ip: string, countryCode: string): Promise<void> {
    try {
        const { redis } = await import("../config/redis");
        await redis.setex(`geo:ip:${ip}`, GEO_CACHE_TTL, countryCode);
    } catch {
        // Redis unavailable — skip cache
    }
}

// ─── Provider chain ──────────────────────────────────────────────

interface GeoProvider {
    name: string;
    lookup: (ip: string) => Promise<string | null>;
}

/**
 * Primary provider: ip-api.com (free, 45 req/min, fast, no API key).
 */
async function lookupIpApi(ip: string): Promise<string | null> {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,countryCode`, {
        signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) return null;
    const data = await response.json();
    return data?.status === "success" ? (data.countryCode ?? null) : null;
}

/**
 * Fallback provider: ipapi.co (1000 req/day, returns country_code).
 */
async function lookupIpapiCo(ip: string): Promise<string | null> {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(3000),
        headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.country_code ?? null;
}

/**
 * Second fallback: ipwho.is (generous free tier, returns country_code).
 */
async function lookupIpwhoIs(ip: string): Promise<string | null> {
    const response = await fetch(`https://ipwho.is/${ip}`, {
        signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.success === true ? (data.country_code ?? null) : null;
}

const GEO_PROVIDERS: GeoProvider[] = [
    { name: "ip-api.com", lookup: lookupIpApi },
    { name: "ipapi.co", lookup: lookupIpapiCo },
    { name: "ipwho.is", lookup: lookupIpwhoIs },
];

/**
 * Detects the country code from an IP address.
 *
 * Strategy:
 *  1. Check Redis cache (24h TTL) — skips external calls for repeat visitors.
 *  2. Try each provider in order until one succeeds.
 *  3. Cache the successful result in Redis.
 *
 * Returns null when all providers fail.
 */
export async function getCountryFromIp(ip: string): Promise<string | null> {
    if (isPrivateIp(ip)) {
        return process.env.DEFAULT_COUNTRY_CODE || "US";
    }

    const cached = await getCachedCountryCode(ip);
    if (cached) return cached;

    for (const provider of GEO_PROVIDERS) {
        try {
            const code = await provider.lookup(ip);
            if (code) {
                await setCachedCountryCode(ip, code);
                return code;
            }
        } catch (error) {
            logger.warn({ error, provider: provider.name, ip }, "GeoIP provider failed, trying next");
        }
    }

    logger.error({ ip }, "All GeoIP providers failed");
    return null;
}

export function isIndia(countryCode: string | null): boolean {
    return countryCode === "IN";
}

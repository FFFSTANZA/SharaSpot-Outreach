import { Request } from "express";
import { logger } from "./logger";

export interface GeoInfo {
    countryCode: string | null;
    region: string | null;
}

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
 * Detects the country code from an IP address.
 * Uses ip-api.com (free for non-commercial use, 45 req/min).
 */
export async function getCountryFromIp(ip: string): Promise<string | null> {
    if (isPrivateIp(ip)) {
        return process.env.DEFAULT_COUNTRY_CODE || "US";
    }

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,countryCode`);
        if (!response.ok) return null;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return null;

        const data = await response.json();
        if (data && data.status === "success") {
            return data.countryCode;
        }
    } catch (error) {
        logger.error({ error }, "GeoIP lookup failed:");
    }

    return null;
}

export function isIndia(countryCode: string | null): boolean {
    return countryCode === "IN";
}

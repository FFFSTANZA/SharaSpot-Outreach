export interface GeoInfo {
    countryCode: string | null;
    region: string | null;
}

/**
 * Detects the country code from an IP address.
 * Uses ip-api.com (free for non-commercial use, 45 req/min).
 */
export async function getCountryFromIp(ip: string): Promise<string | null> {
    // Handle localhost or invalid IPs
    if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        // If we are in development, check if there's an override or default to India if preferred by user
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
        console.error("GeoIP lookup failed:", error);
    }

    return null;
}

export function isIndia(countryCode: string | null): boolean {
    return countryCode === "IN";
}

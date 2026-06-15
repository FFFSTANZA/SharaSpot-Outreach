import dns from "dns";
import { promisify } from "util";
import { redis } from "../config/redis";
import { logger } from "./logger";

const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolve4 = promisify(dns.resolve4);

/**
 * MX Record with latency info
 */
export interface MxRecord {
  exchange: string;
  priority: number;
  latencyMs?: number;
}

/**
 * MX Resolver with latency measurement and caching
 * 
 * Features:
 * - Resolves MX records with timing
 * - Selects fastest MX based on latency
 * - Caches results in Redis (5 minute TTL)
 */

/**
 * Resolve MX records with timing measurement
 */
export async function resolveMxWithTiming(
  domain: string,
  useCache: boolean = true
): Promise<MxRecord[]> {
  const cacheKey = `mx:${domain}`;
  
  // Check cache first
  if (useCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  try {
    const mxRecords = await dnsResolveMx(domain);
    
    // Add priority and measure latency to each MX
    const results: MxRecord[] = await Promise.all(
      mxRecords.map(async (record) => {
        const startTime = Date.now();
        try {
          // Try to resolve the MX hostname
          await dnsResolve4(record.exchange);
          const latencyMs = Date.now() - startTime;
          
          return {
            exchange: record.exchange,
            priority: record.priority,
            latencyMs,
          };
        } catch {
          // If resolution fails, use default latency
          return {
            exchange: record.exchange,
            priority: record.priority,
            latencyMs: 100, // Default
          };
        }
      })
    );

    // Sort by priority (lower is better) and then by latency
    results.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return (a.latencyMs ?? 100) - (b.latencyMs ?? 100);
    });

    // Cache for 5 minutes
    if (useCache) {
      await redis.setex(cacheKey, 300, JSON.stringify(results));
    }

    return results;
  } catch (error) {
    logger.warn({ error }, `[MX] Failed to resolve MX for ${domain}:`);
    // Return empty on failure - will use fallback
    return [];
  }
}

/**
 * Select the fastest MX record
 * Returns the MX with lowest latency (after primary priority)
 */
export function selectFastestMx(records: MxRecord[]): string {
  if (records.length === 0) {
    return ""; // No MX found
  }

  // Already sorted by priority then latency in resolveMxWithTiming
  // Return the best one
  return records[0].exchange;
}

/**
 * Monitor SMTP conversation for abnormal delays
 * Returns true if delays exceed threshold
 */
export function hasAbnormalDelay(
  lastCommandTime: number,
  thresholdMs: number = 5000
): boolean {
  return lastCommandTime > thresholdMs;
}

/**
 * Get estimated SMTP latency for a domain
 * Uses cached data if available
 */
export async function getEstimatedLatency(domain: string): Promise<number> {
  const records = await resolveMxWithTiming(domain, true);
  
  if (records.length === 0) {
    return 200; // Default estimate
  }

  // Average the latencies
  const totalLatency = records.reduce(
    (sum, r) => sum + (r.latencyMs ?? 100),
    0
  );
  
  return Math.round(totalLatency / records.length);
}

/**
 * Check if domain is known high-traffic provider
 */
export function isHighTrafficProvider(domain: string): boolean {
  const highTrafficDomains = [
    "gmail.com",
    "google.com",
    "outlook.com",
    "microsoft.com",
    "yahoo.com",
    "aol.com",
    "icloud.com",
    "mail.com",
  ];
  
  const lowerDomain = domain.toLowerCase();
  return highTrafficDomains.some(d => lowerDomain.endsWith(d));
}

/**
 * Get provider-specific thresholds
 */
export function getProviderThresholds(domain: string): {
  maxPerHour: number;
  minDelayMs: number;
  congestionThreshold: number;
} {
  // Gmail is strict - 100/hour limit
  if (domain.toLowerCase().includes("gmail.com") || domain.toLowerCase().includes("google.com")) {
    return {
      maxPerHour: 100,
      minDelayMs: 36000, // 1 per 36 seconds minimum
      congestionThreshold: 200, // More sensitive
    };
  }

  // Outlook/Microsoft
  if (domain.toLowerCase().includes("outlook.com") || domain.toLowerCase().includes("microsoft.com")) {
    return {
      maxPerHour: 150,
      minDelayMs: 24000, // 1 per 24 seconds
      congestionThreshold: 250,
    };
  }

  // Default thresholds
  return {
    maxPerHour: 300,
    minDelayMs: 12000, // 1 per 12 seconds
    congestionThreshold: 400,
  };
}
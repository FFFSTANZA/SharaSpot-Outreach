import { promises as dns } from "node:dns";

export function normalizeRootDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export function normalizeSubdomain(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export function buildTrackingDomain(rootDomain: string, subdomain: string): string {
  return `${normalizeSubdomain(subdomain)}.${normalizeRootDomain(rootDomain)}`;
}

export function getTrackingDomainScope(req: { user?: { id: string; activeOrganizationId?: string | null } }) {
  const userId = req.user!.id;
  const organizationId = req.user?.activeOrganizationId ?? null;
  const scopeKey = organizationId ? `org:${organizationId}` : `user:${userId}`;
  return { userId, organizationId, scopeKey };
}

export function getExpectedTrackingCnameTarget(): string {
  const explicit = process.env.TRACKING_CNAME_TARGET?.trim().toLowerCase().replace(/\.$/, "");
  if (explicit) return explicit;

  const baseUrl = process.env.TRACKING_BASE_URL?.trim();
  if (baseUrl) {
    try {
      return new URL(baseUrl).hostname.toLowerCase().replace(/\.$/, "");
    } catch {
      // Fall through to the static default when TRACKING_BASE_URL is malformed.
    }
  }

  return process.env.TRACKING_DEFAULT_CNAME_TARGET || "track.yourdomain.com";
}

const DNS_TIMEOUT_MS = parseInt(process.env.DNS_TIMEOUT_MS || "10000", 10);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    promise.then((result) => {
      if (timer) clearTimeout(timer);
      return result;
    }),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        const err: any = new Error("DNS lookup timed out");
        err.code = "ETIMEOUT";
        reject(err);
      }, ms);
    }),
  ]);
}

export async function resolveTrackingCname(fullDomain: string): Promise<string[]> {
  try {
    const result = await withTimeout(dns.resolveCname(fullDomain), DNS_TIMEOUT_MS);
    return result.map((value) => value.toLowerCase().replace(/\.$/, ""));
  } catch (error: any) {
    if (error?.code === "ETIMEOUT") return [];
    if (error?.code === "ENODATA" || error?.code === "ENOTFOUND" || error?.code === "ENOTIMP" || error?.code === "SERVFAIL") {
      return [];
    }
    throw error;
  }
}

export function buildTrackingBaseUrlForDomain(fullDomain: string): string | null {
  const baseUrl = process.env.TRACKING_BASE_URL?.trim();
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    url.hostname = fullDomain;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

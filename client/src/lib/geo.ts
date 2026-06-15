const GEO_STORAGE_KEY = "sharaspot_region";
const GEO_EXPIRY_KEY = "sharaspot_region_expires";
const GEO_CACHE_DAYS = 1;

export type Region = "india" | "global";

/**
 * Returns the cached region from localStorage, or null if expired/missing.
 */
function getCachedRegion(): Region | null {
  if (typeof window === "undefined") return null;
  try {
    const expires = localStorage.getItem(GEO_EXPIRY_KEY);
    if (expires && Date.now() < Number(expires)) {
      const region = localStorage.getItem(GEO_STORAGE_KEY);
      if (region === "india" || region === "global") return region;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

/**
 * Persists the detected region to localStorage with a 24h expiry.
 */
function setCachedRegion(region: Region): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GEO_STORAGE_KEY, region);
    localStorage.setItem(GEO_EXPIRY_KEY, String(Date.now() + GEO_CACHE_DAYS * 86400000));
  } catch {
    // localStorage unavailable or full
  }
}

/**
 * Fetches the user's country code from the /geo API.
 */
async function fetchCountryCode(): Promise<string | null> {
  try {
    const res = await fetch("/geo");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.country_code ?? null;
  } catch {
    return null;
  }
}

/**
 * Detects the user's region using a multi-layer strategy:
 *  1. Check localStorage cache (instant, works on return visits)
 *  2. Fetch from /geo API (Next.js route with provider chain)
 *  3. Persist to localStorage for next visit
 *
 * Falls back to "global" (US $29) when all layers fail.
 */
export async function detectRegion(): Promise<Region> {
  const cached = getCachedRegion();
  if (cached) return cached;

  const countryCode = await fetchCountryCode();
  const region: Region = countryCode === "IN" ? "india" : "global";
  setCachedRegion(region);
  return region;
}

/**
 * Synchronous instant check — returns cached region or null.
 * Use this for initial render to avoid the "$29 flash".
 */
export function getCachedRegionSync(): Region | null {
  return getCachedRegion();
}
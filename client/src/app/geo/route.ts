import { NextRequest, NextResponse } from "next/server";

/**
 * Extracts the real client IP from the request headers.
 */
function extractClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  return null;
}

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.") ||
    ip.startsWith("0.") ||
    ip.startsWith("169.254.")
  );
}

// ─── Provider chain ──────────────────────────────────────────────

async function lookupIpapiCo(ip: string): Promise<string | null> {
  const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
  const res = await fetch(url, {
    signal: AbortSignal.timeout(4000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.country_code ?? null;
}

async function lookupIpApi(ip: string): Promise<string | null> {
  const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,countryCode`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.status === "success" ? (data.countryCode ?? null) : null;
}

async function lookupIpwhoIs(ip: string): Promise<string | null> {
  const res = await fetch(`https://ipwho.is/${ip}`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.success === true ? (data.country_code ?? null) : null;
}

type GeoProvider = { name: string; lookup: (ip: string) => Promise<string | null> };

const PROVIDERS: GeoProvider[] = [
  { name: "ipapi.co", lookup: lookupIpapiCo },
  { name: "ip-api.com", lookup: lookupIpApi },
  { name: "ipwho.is", lookup: lookupIpwhoIs },
];

export async function GET(request: NextRequest) {
  const ip = extractClientIp(request);
  const lookupIp = ip && !isPrivateIp(ip) ? ip : "";

  for (const provider of PROVIDERS) {
    try {
      const code = await provider.lookup(lookupIp);
      if (code) {
        return NextResponse.json({ country_code: code });
      }
    } catch {
      // try next provider
    }
  }

  return NextResponse.json({ country_code: null }, { status: 502 });
}

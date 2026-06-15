import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ country_code: null }, { status: 502 });
    const data = await res.json();
    return NextResponse.json({ country_code: data.country_code ?? null });
  } catch {
    return NextResponse.json({ country_code: null }, { status: 502 });
  }
}

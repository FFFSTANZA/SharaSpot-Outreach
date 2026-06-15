import { CookieOptions } from "express";

function parseCookieSecure(): boolean {
  const raw = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV === "production";
}

function resolveSameSite(secure: boolean): CookieOptions["sameSite"] {
  const override = process.env.COOKIE_SAME_SITE;
  if (override === "strict" || override === "lax" || override === "none") {
    return override;
  }
  return secure ? "strict" : "lax";
}

const secure = parseCookieSecure();

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure,
  sameSite: resolveSameSite(secure),
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

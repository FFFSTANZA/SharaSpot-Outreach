import { CookieOptions } from "express";

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

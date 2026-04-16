import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { refreshTokenCookieOptions } from "../config/cookies";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) { res.status(400).json({ message: "idToken is required" }); return; }

    // Log the token receipt
    console.log("Received idToken, verifying...");
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) { res.status(401).json({ message: "Invalid Google token" }); return; }

    const { email, name, picture } = payload;
    console.log(`Google payload: ${email}, ${name}`);
    if (!email || !name) { res.status(400).json({ message: "Incomplete profile" }); return; }

    console.log("Upserting user in database...");
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatarUrl: picture },
      create: { 
        email, 
        name, 
        avatarUrl: picture, 
        senders: { create: { email, name, appPassword: "" } },
        tags: {
          create: [
            { name: "Investor", color: "#ef4444" },
            { name: "Founder", color: "#f59e0b" },
            { name: "Recruiter", color: "#10b981" },
          ]
        }
      },
    });

    console.log("User upserted, generating tokens...");
    const newAccessToken = signAccessToken({ id: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({ id: user.id });

    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions);
    res.json({ accessToken: newAccessToken, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
  } catch (error) {
    console.error("=== LOGIN ERROR ===");
    console.error(error);
    console.error("===================");
    res.status(500).json({ message: "Login failed", error: String(error) });
  }
};
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) { res.status(401).json({ message: "Missing token" }); return; }
    let payload: { id: string };
    try { payload = verifyRefreshToken(refreshToken) as { id: string }; } catch { res.status(401).json({ message: "Invalid" }); return; }
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) { res.status(401).json({ message: "Expired or Invalid" }); return; }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) { res.status(401).json({ message: "User not found" }); return; }

    await prisma.refreshToken.update({ where: { token: refreshToken }, data: { revoked: true } });
    const newAccessToken = signAccessToken({ id: payload.id, email: user.email });
    const newRefreshToken = signRefreshToken({ id: payload.id });
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: payload.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions);
    res.json({ accessToken: newAccessToken });
  } catch (error) { res.status(500).json({ message: "Refresh failed" }); }
};
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
    res.clearCookie("refreshToken", { path: "/" });
    res.sendStatus(204);
  } catch (error) { res.status(500).json({ message: "Logout failed" }); }
};

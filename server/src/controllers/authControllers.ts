import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { refreshTokenCookieOptions } from "../config/cookies";
import { acceptOrganizationInviteForUser } from "./organizationControllers";
import { extractClientIp, getCountryFromIp, isIndia } from "../utils/geoUtils";
import { logger } from "../utils/logger";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, inviteToken } = (req.body || {}) as { idToken?: string; inviteToken?: string };
    if (!idToken) { res.status(400).json({ message: "idToken is required" }); return; }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    } catch {
      res.status(401).json({ message: "Invalid Google token" }); return;
    }
    const payload = ticket.getPayload();
    if (!payload) { res.status(401).json({ message: "Invalid Google token" }); return; }

    const { email, name, picture } = payload;
    if (!email || !name) { res.status(400).json({ message: "Incomplete profile" }); return; }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const isNewUser = !existingUser;

    // Detect region from IP on signup so pricing is geo-aware from the start
    const ipAddress = extractClientIp(req);
    const countryCode = ipAddress ? await getCountryFromIp(ipAddress) : null;
    const detectedRegion = isIndia(countryCode) ? "india" : "global";

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatarUrl: picture },
      create: {
        email, name, avatarUrl: picture,
        region: detectedRegion,
        senders: { create: { email, name, appPassword: "" } },
        tags: {
          create: [
            { name: "Investor", color: "#ef4444" },
            { name: "Founder", color: "#f59e0b" },
            { name: "Recruiter", color: "#10b981" },
          ],
        },
      },
    });

    // Only auto-create personal workspace for brand new users (first-ever login),
    // not for existing users who happen to have no active org (e.g. left a workspace).
    if (isNewUser && !user.activeOrganizationId && !inviteToken) {
      const org = await prisma.organization.create({
        data: {
          name: `${name || email}'s Workspace`,
          ownerId: user.id,
          members: {
            create: { userId: user.id, role: "OWNER" },
          },
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { activeOrganizationId: org.id },
      });
    }

    if (inviteToken) {
      const inviteResult = await acceptOrganizationInviteForUser(inviteToken, user.id, user.email);
      if (!inviteResult.accepted) {
        logger.warn(`[Auth] Invite acceptance failed for ${user.email}: ${inviteResult.reason}`);
      }
    }

    let freshUser = await prisma.user.findUnique({ where: { id: user.id } });
    // Second fallback: only for new users who had an invite that failed or no invite
    if (isNewUser && !freshUser?.activeOrganizationId) {
      const org = await prisma.organization.create({
        data: {
          name: `${name || email}'s Workspace`,
          ownerId: user.id,
          members: {
            create: { userId: user.id, role: "OWNER" },
          },
        },
      });
      freshUser = await prisma.user.update({
        where: { id: user.id },
        data: { activeOrganizationId: org.id },
      });
    }

    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
      activeOrganizationId: freshUser?.activeOrganizationId || null,
    });
    const newRefreshToken = signRefreshToken({ id: user.id });
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
    res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions);
    res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        activeOrganizationId: freshUser?.activeOrganizationId || null,
      },
    });
  } catch (error) {
    logger.error({ error }, "[Auth] googleLogin error");
    res.status(500).json({ message: "Login failed" });
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
    const newAccessToken = signAccessToken({
      id: payload.id,
      email: user.email,
      activeOrganizationId: user.activeOrganizationId || null,
    });
    const newRefreshToken = signRefreshToken({ id: payload.id });
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: payload.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error({ error }, "[Auth] refreshAccessToken error");
    res.status(500).json({ message: "Refresh failed" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
    res.clearCookie("refreshToken", { path: "/" });
    res.sendStatus(204);
  } catch (error) {
    logger.error({ error }, "[Auth] logout error");
    res.status(500).json({ message: "Logout failed" });
  }
};

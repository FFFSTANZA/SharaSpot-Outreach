import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/prisma";
import "../types/express";

interface DecodedToken {
  id: string;
  email: string;
  activeOrganizationId?: string | null;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Authorization header missing" });
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Invalid authorization format" });
    return;
  }

  try {
    const decoded = verifyAccessToken(token) as DecodedToken;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, activeOrganizationId: true },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    let activeOrganizationId = user.activeOrganizationId;
    if (activeOrganizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrganizationId,
            userId: user.id,
          },
        },
        select: { userId: true },
      });

      if (!membership) {
        activeOrganizationId = null;
        await prisma.user.update({
          where: { id: user.id },
          data: { activeOrganizationId: null },
        });
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      activeOrganizationId,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

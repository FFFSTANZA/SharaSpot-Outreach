import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";

export const requireCallingWorkspaceEnabled = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { callingEnabled: true } });
  if (!user?.callingEnabled) {
    res.status(403).json({ message: "Calling workspace is disabled" });
    return;
  }

  next();
};

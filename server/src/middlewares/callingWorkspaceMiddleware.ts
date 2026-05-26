import { NextFunction, Request, Response } from "express";

export const requireCallingWorkspaceEnabled = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
};

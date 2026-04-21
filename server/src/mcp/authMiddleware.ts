import { Request, Response, NextFunction } from "express";
import { validateMcpApiKey } from "./services/apiKeyService";

const apiKeyCache = new Map<string, { userId: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE = 1000;

async function getCachedUserId(key: string): Promise<string | null> {
  const cached = apiKeyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.userId;
  }
  
  const userId = await validateMcpApiKey(key);
  
  if (userId && apiKeyCache.size < MAX_CACHE) {
    apiKeyCache.set(key, { userId, expiresAt: Date.now() + CACHE_TTL });
  }
  
  return userId;
}

function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of apiKeyCache) {
    if (value.expiresAt < now) {
      apiKeyCache.delete(key);
    }
  }
}

setInterval(clearExpiredCache, CACHE_TTL);

export async function mcpAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32601, message: "Missing authorization header" },
    });
  }
  
  const key = authHeader.substring(7);
  
  if (key.startsWith("msk_")) {
    const userId = await getCachedUserId(key);
    
    if (!userId) {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32601, message: "Invalid or expired API key" },
      });
    }
    
    (req as any).user = { id: userId };
    (req as any).isApiKey = true;
    return next();
  }
  
  const { authMiddleware } = await import("../middlewares/authMiddleware");
  return authMiddleware(req, res, next);
}
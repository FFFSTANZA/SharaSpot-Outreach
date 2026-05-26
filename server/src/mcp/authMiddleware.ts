import { Request, Response, NextFunction } from "express";
import { validateMcpApiKey, McpApiKeyAuth } from "./services/apiKeyService";
import { checkPremiumStatus } from "../utils/premiumCheck";
import { MCP_ERROR_CODES } from "./types";

async function getApiKeyAuth(key: string): Promise<McpApiKeyAuth | null> {
  return validateMcpApiKey(key);
}

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
      error: { code: MCP_ERROR_CODES.AUTHENTICATION_FAILED, message: "Missing authorization header" },
    });
  }
  
  const key = authHeader.substring(7);
  
  if (key.startsWith("msk_")) {
    const auth = await getApiKeyAuth(key);
    
    if (!auth) {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: MCP_ERROR_CODES.AUTHENTICATION_FAILED, message: "Invalid or expired API key" },
      });
    }

    const premium = await checkPremiumStatus(auth.userId);
    if (!premium.isPremium) {
      return res.status(403).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: MCP_ERROR_CODES.PERMISSION_DENIED, message: "MCP access requires a premium subscription" },
      });
    }
    
    (req as any).user = {
      id: auth.userId,
      activeOrganizationId: auth.organizationId,
    };
    (req as any).mcpAuth = {
      apiKeyId: auth.id,
      isApiKey: true,
      userId: auth.userId,
      organizationId: auth.organizationId,
      permissions: auth.permissions,
    };
    return next();
  }
  
  const { authMiddleware } = await import("../middlewares/authMiddleware");
  return authMiddleware(req, res, async () => {
    const sessionUserId = req.user!.id;

    const premium = await checkPremiumStatus(sessionUserId);
    if (!premium.isPremium) {
      return res.status(403).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: MCP_ERROR_CODES.PERMISSION_DENIED, message: "MCP access requires a premium subscription" },
      });
    }

    (req as any).mcpAuth = {
      isApiKey: false,
      userId: sessionUserId,
      organizationId: req.user!.activeOrganizationId,
    };
    next();
  });
}

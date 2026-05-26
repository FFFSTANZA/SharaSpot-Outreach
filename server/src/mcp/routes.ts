import { Router, Request, Response, NextFunction } from "express";
import { mcpRequestHandler } from "./requestHandler";
import { mcpAuthMiddleware } from "./authMiddleware";
import { toolRegistry } from "./toolRegistry";
import { JSONRPC_ERROR_CODES, MCPAuthInfo, MCP_ERROR_CODES } from "./types";
import { rateLimit } from "express-rate-limit";

const router = Router();

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { jsonrpc: "2.0", id: null, error: { code: JSONRPC_ERROR_CODES.INVALID_REQUEST, message: "Too many requests" } },
});

const toolLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

router.post(
  "/",
  mcpLimiter,
  mcpAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).mcpAuth as MCPAuthInfo | undefined;
    if (!auth?.userId) {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: MCP_ERROR_CODES.AUTHENTICATION_FAILED, message: "Unauthorized" },
      });
    }

    try {
      const batch = Array.isArray(req.body) ? req.body : [req.body];
      if (Array.isArray(req.body) && batch.length === 0) {
        return res.status(400).json({
          jsonrpc: "2.0",
          id: null,
          error: { code: JSONRPC_ERROR_CODES.INVALID_REQUEST, message: "Batch cannot be empty" },
        });
      }
      if (batch.length > 10) {
        return res.status(400).json({
          jsonrpc: "2.0",
          id: null,
          error: { code: JSONRPC_ERROR_CODES.INVALID_REQUEST, message: "Batch size exceeds limit (max 10)" },
        });
      }

      const responses = await withTimeout(
        Promise.all(batch.map((request) => mcpRequestHandler.handle(request, auth))),
        25000
      );

      const result = batch.length === 1 ? responses[0] : responses;
      res.json(result);
    } catch (error) {
      if (error instanceof MCPTimeoutError) {
        return res.status(408).json({
          jsonrpc: "2.0",
          id: null,
          error: { code: MCP_ERROR_CODES.TIMEOUT, message: "Request timeout" },
        });
      }
      next(error);
    }
  }
);

router.get("/tools", toolLimiter, mcpAuthMiddleware, (req: Request, res: Response) => {
  res.json({
    tools: toolRegistry.listTools(),
  });
});

router.get("/capabilities", toolLimiter, mcpAuthMiddleware, (req: Request, res: Response) => {
  res.json({
    protocolVersion: "2024-11-05",
    capabilities: { tools: true },
    serverInfo: {
      name: "sharaspot-mcp",
      version: "1.0.0",
    },
  });
});

export default router;

class MCPTimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout!: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new MCPTimeoutError("Request timeout")), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

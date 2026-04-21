import { Router, Request, Response, NextFunction } from "express";
import { mcpRequestHandler } from "./requestHandler";
import { mcpAuthMiddleware } from "./authMiddleware";
import { toolRegistry } from "./toolRegistry";
import { rateLimit } from "express-rate-limit";

const router = Router();

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Too many requests" } },
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Unauthorized" },
      });
    }

    const timeout = setTimeout(() => {
      if (!res.writableEnded) {
        res.status(408).json({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32603, message: "Request timeout" },
        });
      }
    }, 25000);

    try {
      const batch = Array.isArray(req.body) ? req.body : [req.body];
      if (batch.length > 10) {
        clearTimeout(timeout);
        return res.status(400).json({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32600, message: "Batch size exceeds limit (max 10)" },
        });
      }

      const responses = await Promise.all(
        batch.map((request) => mcpRequestHandler.handle(request, userId))
      );

      clearTimeout(timeout);
      const result = batch.length === 1 ? responses[0] : responses;
      res.json(result);
    } catch (error) {
      clearTimeout(timeout);
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
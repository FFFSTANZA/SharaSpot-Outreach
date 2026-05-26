import express from "express";
import request from "supertest";
import mcpRoutes from "../../mcp/routes";
import { mcpRequestHandler } from "../../mcp/requestHandler";
import { toolRegistry } from "../../mcp/toolRegistry";

jest.mock("../../mcp/requestHandler", () => ({
  mcpRequestHandler: {
    handle: jest.fn(),
  },
}));

jest.mock("../../mcp/toolRegistry", () => ({
  toolRegistry: {
    listTools: jest.fn(),
  },
}));

jest.mock("../../mcp/authMiddleware", () => ({
  mcpAuthMiddleware: (req: any, res: any, next: any) => {
    if (req.headers["x-test-auth"] === "deny") {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32050, message: "Unauthorized" },
      });
    }
    req.mcpAuth = { isApiKey: true, userId: "u1", organizationId: "org1" };
    next();
  },
}));

describe("MCP routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/mcp", mcpRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles single JSON-RPC request", async () => {
    (mcpRequestHandler.handle as jest.Mock).mockResolvedValue({
      jsonrpc: "2.0",
      id: 1,
      result: "pong",
    });

    const res = await request(app)
      .post("/api/mcp")
      .send({ jsonrpc: "2.0", id: 1, method: "ping" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ jsonrpc: "2.0", id: 1, result: "pong" });
    expect(mcpRequestHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("handles batch JSON-RPC requests", async () => {
    (mcpRequestHandler.handle as jest.Mock)
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: 1, result: { ok: 1 } })
      .mockResolvedValueOnce({ jsonrpc: "2.0", id: 2, result: { ok: 2 } });

    const res = await request(app)
      .post("/api/mcp")
      .send([
        { jsonrpc: "2.0", id: 1, method: "tools/list" },
        { jsonrpc: "2.0", id: 2, method: "ping" },
      ]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(mcpRequestHandler.handle).toHaveBeenCalledTimes(2);
  });

  it("rejects empty batch requests", async () => {
    const res = await request(app)
      .post("/api/mcp")
      .send([]);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Batch cannot be empty");
  });

  it("rejects oversized batches", async () => {
    const batch = Array.from({ length: 11 }, (_, i) => ({
      jsonrpc: "2.0",
      id: i + 1,
      method: "ping",
    }));

    const res = await request(app)
      .post("/api/mcp")
      .send(batch);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Batch size exceeds limit");
  });

  it("returns unauthorized when auth middleware rejects request", async () => {
    const res = await request(app)
      .post("/api/mcp")
      .set("x-test-auth", "deny")
      .send({ jsonrpc: "2.0", id: 1, method: "ping" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Unauthorized");
  });

  it("returns tools and capabilities metadata", async () => {
    (toolRegistry.listTools as jest.Mock).mockReturnValue([
      { name: "contact_list", category: "contacts", access: "read" },
    ]);

    const toolsRes = await request(app).get("/api/mcp/tools");
    const capRes = await request(app).get("/api/mcp/capabilities");

    expect(toolsRes.status).toBe(200);
    expect(toolsRes.body.tools).toHaveLength(1);
    expect(capRes.status).toBe(200);
    expect(capRes.body.protocolVersion).toBe("2024-11-05");
  });
});

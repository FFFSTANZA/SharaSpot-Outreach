import { MCPRequestHandler } from "../../mcp/requestHandler";
import { toolRegistry } from "../../mcp/toolRegistry";
import { JSONRPC_ERROR_CODES, MCP_ERROR_CODES } from "../../mcp/types";

describe("MCPRequestHandler protocol validation", () => {
  it("allows stateless tools/list without shared initialized state", async () => {
    const handler = new MCPRequestHandler();

    const response = await handler.handle(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { isApiKey: false, userId: "u1" }
    );

    expect(response.error).toBeUndefined();
    expect(response.result).toHaveProperty("tools");
  });

  it("rejects malformed JSON-RPC envelopes", async () => {
    const handler = new MCPRequestHandler();

    const response = await handler.handle(
      { id: 1, method: "tools/list" },
      { isApiKey: false, userId: "u1" }
    );

    expect(response.error?.code).toBe(JSONRPC_ERROR_CODES.INVALID_REQUEST);
    expect(response.error?.message).toContain("jsonrpc");
  });

  it("validates required tool arguments before execution", async () => {
    const handler = new MCPRequestHandler();
    const toolName = `protocol_required_${Date.now()}`;
    const execute = jest.fn().mockResolvedValue({ success: true });

    toolRegistry.register({
      name: toolName,
      description: "Required arg test",
      category: "contacts",
      access: "read",
      inputSchema: {
        type: "object",
        properties: { contactId: { type: "string" } },
        required: ["contactId"],
      },
      handler: execute,
    });

    const response = await handler.handle(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: toolName, arguments: {} } },
      { isApiKey: false, userId: "u1" }
    );

    expect(response.error?.code).toBe(MCP_ERROR_CODES.INVALID_TOOL_ARGUMENTS);
    expect(execute).not.toHaveBeenCalled();
  });

  it("requires confirm true for destructive tools", async () => {
    const handler = new MCPRequestHandler();
    const toolName = `protocol_delete_${Date.now()}`;
    const execute = jest.fn().mockResolvedValue({ success: true });

    toolRegistry.register({
      name: toolName,
      description: "Destructive arg test",
      category: "contacts",
      access: "write",
      destructive: true,
      inputSchema: { type: "object", properties: {} },
      handler: execute,
    });

    const denied = await handler.handle(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: toolName, arguments: {} } },
      { isApiKey: false, userId: "u1" }
    );
    const allowed = await handler.handle(
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: toolName, arguments: { confirm: true } } },
      { isApiKey: false, userId: "u1" }
    );

    expect(denied.error?.code).toBe(MCP_ERROR_CODES.CONFIRMATION_REQUIRED);
    expect(allowed.result).toEqual({ success: true });
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

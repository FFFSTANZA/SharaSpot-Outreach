import { MCPRequestHandler } from "../../mcp/requestHandler";
import { toolRegistry } from "../../mcp/toolRegistry";

describe("MCPRequestHandler API-key permissions", () => {
  it("blocks read-only API keys from write tools before execution", async () => {
    const handler = new MCPRequestHandler();
    const toolName = `permission_test_write_${Date.now()}`;
    const execute = jest.fn().mockResolvedValue({ success: true });

    toolRegistry.register(
      {
        name: toolName,
        description: "Permission test write tool",
        inputSchema: { type: "object", properties: {} },
        handler: execute,
      },
      "contacts",
      "write"
    );

    await handler.handle(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      { isApiKey: true, userId: "u1", permissions: { access: "read", areas: ["contacts"] } }
    );

    const response = await handler.handle(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: toolName, arguments: {} } },
      { isApiKey: true, userId: "u1", permissions: { access: "read", areas: ["contacts"] } }
    );

    expect(response.error?.message).toBe("API key has read-only access");
    expect(execute).not.toHaveBeenCalled();
  });

  it("blocks API keys from unlisted tool categories", async () => {
    const handler = new MCPRequestHandler();
    const toolName = `permission_test_area_${Date.now()}`;
    const execute = jest.fn().mockResolvedValue({ success: true });

    toolRegistry.register(
      {
        name: toolName,
        description: "Permission test read tool",
        inputSchema: { type: "object", properties: {} },
        handler: execute,
      },
      "campaigns",
      "read"
    );

    await handler.handle(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      { isApiKey: true, userId: "u1", permissions: { access: "write", areas: ["contacts"] } }
    );

    const response = await handler.handle(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: toolName, arguments: {} } },
      { isApiKey: true, userId: "u1", permissions: { access: "write", areas: ["contacts"] } }
    );

    expect(response.error?.message).toBe("API key is not allowed to access campaigns");
    expect(execute).not.toHaveBeenCalled();
  });
});

import { randomUUID } from "crypto";
import {
  MCPRequest,
  MCPResponse,
  MCPError,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPCapabilities,
  JSONRPC_ERROR_CODES,
  MCP_ERROR_CODES,
  MCPContext,
} from "./types";
import { toolRegistry } from "./toolRegistry";

export class MCPRequestHandler {
  private initialized = false;
  private protocolVersion = "2024-11-05";
  private capabilities: MCPCapabilities = { tools: true };

  async handle(request: MCPRequest, userId: string): Promise<MCPResponse> {
    const responseId = request.id ?? randomUUID();

    try {
      if (request.method === "initialize") {
        const result = await this.initialize(
          request.params as MCPInitializeParams
        );
        return {
          jsonrpc: "2.0",
          id: responseId,
          result,
        };
      }

      if (!this.initialized && request.method !== "initialize") {
        return this.error(responseId, JSONRPC_ERROR_CODES.INVALID_REQUEST, 
          "MCP not initialized. Call initialize first.");
      }

      switch (request.method) {
        case "tools/list":
          return this.listTools(responseId);
        case "tools/call":
          return this.callTool(request, responseId, userId);
        case "ping":
          return { jsonrpc: "2.0", id: responseId, result: "pong" };
        default:
          return this.error(
            responseId,
            JSONRPC_ERROR_CODES.METHOD_NOT_FOUND,
            `Method ${request.method} not found`
          );
      }
    } catch (error) {
      return this.error(responseId, JSONRPC_ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal error");
    }
  }

  private async initialize(
    params: MCPInitializeParams
  ): Promise<MCPInitializeResult> {
    this.initialized = true;
    if (params.capabilities) {
      this.capabilities = { ...this.capabilities, ...params.capabilities };
    }

    return {
      protocolVersion: this.protocolVersion,
      capabilities: this.capabilities,
      serverInfo: {
        name: "sharaspot-mcp",
        version: "1.0.0",
        description: "SharaSpot MCP Server - Email outreach platform integration",
      },
    };
  }

  private listTools(responseId: string | number): MCPResponse {
    return {
      jsonrpc: "2.0",
      id: responseId,
      result: {
        tools: toolRegistry.listTools(),
      },
    };
  }

  private async callTool(
    request: MCPRequest,
    responseId: string | number,
    userId: string
  ): Promise<MCPResponse> {
    const params = request.params as { name: string; arguments?: Record<string, unknown> } | undefined;
    const { name, arguments: args = {} } = params || {};

    if (!name) {
      return this.error(responseId, MCP_ERROR_CODES.INVALID_TOOL_ARGUMENTS,
        "Tool name is required");
    }

    try {
      const context: MCPContext = {
        userId,
        requestId: String(responseId),
      };

      const result = await toolRegistry.execute(name, context, args);
      return {
        jsonrpc: "2.0",
        id: responseId,
        result,
      };
    } catch (error) {
      return this.error(responseId, MCP_ERROR_CODES.TOOL_EXECUTION_ERROR,
        error instanceof Error ? error.message : "Tool execution failed");
    }
  }

  private error(
    id: string | number,
    code: number,
    message: string,
    data?: unknown
  ): MCPResponse {
    const error: MCPError = { code, message, data };
    return {
      jsonrpc: "2.0",
      id,
      error,
    };
  }
}

export const mcpRequestHandler = new MCPRequestHandler();
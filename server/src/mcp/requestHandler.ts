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
  MCPAuthInfo,
} from "./types";
import { toolRegistry } from "./toolRegistry";

export class MCPRequestHandler {
  private readonly protocolVersion = "2024-11-05";
  private readonly capabilities: MCPCapabilities = { tools: true };

  async handle(request: unknown, auth: MCPAuthInfo): Promise<MCPResponse> {
    const responseId = getRequestId(request);

    try {
      const validationError = validateJsonRpcRequest(request);
      if (validationError) {
        return this.error(responseId, JSONRPC_ERROR_CODES.INVALID_REQUEST, validationError);
      }

      const rpcRequest = request as MCPRequest;

      if (rpcRequest.method === "initialize") {
        const paramsError = validateInitializeParams(rpcRequest.params);
        if (paramsError) {
          return this.error(responseId, JSONRPC_ERROR_CODES.INVALID_PARAMS, paramsError);
        }
        const result = await this.initialize(
          (rpcRequest.params || {}) as MCPInitializeParams
        );
        return {
          jsonrpc: "2.0",
          id: responseId,
          result,
        };
      }

      switch (rpcRequest.method) {
        case "tools/list":
          return this.listTools(responseId);
        case "tools/call":
          return this.callTool(rpcRequest, responseId, auth);
        case "ping":
          return { jsonrpc: "2.0", id: responseId, result: "pong" };
        default:
          return this.error(
            responseId,
            JSONRPC_ERROR_CODES.METHOD_NOT_FOUND,
            `Method ${rpcRequest.method} not found`
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
    return {
      protocolVersion: this.protocolVersion,
      capabilities: { ...this.capabilities },
      serverInfo: {
        name: "sharaspot-mcp",
        version: "1.0.0",
        description: "SharaSpot MCP Server - Email outreach platform integration",
      },
    };
  }

  private listTools(responseId: string | number | null): MCPResponse {
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
    responseId: string | number | null,
    auth: MCPAuthInfo
  ): Promise<MCPResponse> {
    const params = request.params as { name: string; arguments?: Record<string, unknown> } | undefined;
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      return this.error(responseId, JSONRPC_ERROR_CODES.INVALID_PARAMS, "tools/call params must be an object");
    }

    const { name, arguments: args = {} } = params;
    if (!name || typeof name !== "string") {
      return this.error(responseId, JSONRPC_ERROR_CODES.INVALID_PARAMS,
        "Tool name is required");
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      return this.error(responseId, JSONRPC_ERROR_CODES.INVALID_PARAMS, "Tool arguments must be an object");
    }

    try {
      const tool = toolRegistry.get(name);
      if (!tool) {
        return this.error(responseId, MCP_ERROR_CODES.TOOL_NOT_FOUND, `Tool ${name} not found`);
      }

      if (auth.isApiKey && auth.permissions) {
        if (!auth.permissions.areas.includes(tool.category)) {
          return this.error(responseId, MCP_ERROR_CODES.PERMISSION_DENIED,
            `API key is not allowed to access ${tool.category}`);
        }
        if (tool.access === "write" && auth.permissions.access !== "write") {
          return this.error(responseId, MCP_ERROR_CODES.PERMISSION_DENIED,
            "API key has read-only access");
        }
      }

      if (tool.requiresConfirmation && args.confirm !== true) {
        return this.error(
          responseId,
          MCP_ERROR_CODES.CONFIRMATION_REQUIRED,
          `Tool ${name} requires confirm: true`
        );
      }

      const argsError = validateToolArguments(tool.inputSchema, args);
      if (argsError) {
        return this.error(responseId, MCP_ERROR_CODES.INVALID_TOOL_ARGUMENTS, argsError);
      }

      const context: MCPContext = {
        userId: auth.userId,
        organizationId: auth.organizationId,
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
    id: string | number | null,
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

function getRequestId(request: unknown): string | number | null {
  if (request && typeof request === "object" && "id" in request) {
    const id = (request as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number" || id === null) return id;
  }
  return null;
}

function validateJsonRpcRequest(request: unknown): string | null {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    return "JSON-RPC request must be an object";
  }
  const candidate = request as Record<string, unknown>;
  if (candidate.jsonrpc !== "2.0") {
    return "jsonrpc must be \"2.0\"";
  }
  if (typeof candidate.method !== "string" || candidate.method.length === 0) {
    return "method is required";
  }
  if ("id" in candidate && candidate.id !== null && typeof candidate.id !== "string" && typeof candidate.id !== "number") {
    return "id must be a string, number, or null";
  }
  if ("params" in candidate && (candidate.params === null || typeof candidate.params !== "object" || Array.isArray(candidate.params))) {
    return "params must be an object when provided";
  }
  return null;
}

function validateInitializeParams(params: unknown): string | null {
  if (params === undefined) return null;
  if (!params || typeof params !== "object" || Array.isArray(params)) return "initialize params must be an object";
  const candidate = params as Record<string, unknown>;
  if (candidate.protocolVersion !== undefined && typeof candidate.protocolVersion !== "string") {
    return "protocolVersion must be a string";
  }
  if (candidate.clientInfo !== undefined) {
    if (!candidate.clientInfo || typeof candidate.clientInfo !== "object" || Array.isArray(candidate.clientInfo)) {
      return "clientInfo must be an object";
    }
  }
  return null;
}

function validateToolArguments(schema: Record<string, unknown>, args: Record<string, unknown>): string | null {
  const required = Array.isArray(schema.required) ? schema.required as string[] : [];
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === "") {
      return `Missing required tool argument: ${field}`;
    }
  }

  const properties = schema.properties && typeof schema.properties === "object"
    ? schema.properties as Record<string, Record<string, unknown>>
    : {};
  for (const [field, value] of Object.entries(args)) {
    const property = properties[field];
    if (!property || value === undefined || value === null) continue;
    const type = property.type;
    if (typeof type !== "string") continue;
    if (type === "array" && !Array.isArray(value)) return `${field} must be an array`;
    if (type === "boolean" && typeof value !== "boolean") return `${field} must be a boolean`;
    if (type === "number" && typeof value !== "number") return `${field} must be a number`;
    if (type === "string" && typeof value !== "string") return `${field} must be a string`;
    if (type === "object" && (typeof value !== "object" || Array.isArray(value))) return `${field} must be an object`;
  }
  return null;
}

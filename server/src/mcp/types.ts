export interface MCPRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  category: MCPToolCategory;
  access: MCPToolAccess;
  destructive: boolean;
  requiresConfirmation: boolean;
  handler: ToolHandler;
}

export type MCPToolCategory =
  | "contacts"
  | "contactLists"
  | "campaigns"
  | "senders"
  | "templates"
  | "analytics"
  | "inbox"
  | "prm"
  | "validation"
  | "calls"
  | "settings";

export type MCPToolAccess = "read" | "write";

export interface MCPKeyPermissions {
  access: MCPToolAccess;
  areas: MCPToolCategory[];
}

export interface MCPAuthInfo {
  apiKeyId?: string;
  isApiKey: boolean;
  userId: string;
  organizationId?: string | null;
  permissions?: MCPKeyPermissions;
}

export interface MCPJSONSchema {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
}

export interface MCPToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPResponseTool {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

export interface MCPProgressNotification {
  jsonrpc: "2.0";
  method: "notifications/progress";
  params: {
    progressToken: string | number;
    progress: number;
    total?: number;
  };
}

export type ToolHandler = (
  context: MCPContext,
  args: Record<string, unknown>
) => Promise<unknown>;

export interface MCPContext {
  userId: string;
  organizationId?: string | null;
  sessionId?: string;
  requestId: string;
}

export interface MCPInitializeParams {
  protocolVersion?: string;
  capabilities?: MCPCapabilities;
  clientInfo?: MCPClientInfo;
}

export interface MCPCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

export interface MCPClientInfo {
  name: string;
  version: string;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description?: string;
}

export const JSONRPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export const MCP_ERROR_CODES = {
  TOOL_NOT_FOUND: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  RESOURCE_NOT_FOUND: -32003,
  INVALID_TOOL_ARGUMENTS: -32004,
  PERMISSION_DENIED: -32005,
  CONFIRMATION_REQUIRED: -32006,
  AUTHENTICATION_FAILED: -32050,
  TIMEOUT: -32060,
} as const;

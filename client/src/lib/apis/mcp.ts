import api from "../axios";

export type McpKeyScope = "personal" | "organization";
export type McpToolAccess = "read" | "write";
export type McpToolCategory =
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

export interface McpKeyPermissions {
  access: McpToolAccess;
  areas: McpToolCategory[];
}

export interface McpApiKey {
  id: string;
  name: string;
  scope: McpKeyScope;
  permissions: McpKeyPermissions;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatedMcpApiKey extends McpApiKey {
  key: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  category: McpToolCategory;
  access: McpToolAccess;
  destructive: boolean;
  requiresConfirmation: boolean;
}

export interface McpCapabilities {
  protocolVersion: string;
  capabilities: { tools?: boolean; resources?: boolean; prompts?: boolean };
  serverInfo: { name: string; version: string; description?: string };
}

export const getMcpApiKeys = async (scope: McpKeyScope): Promise<McpApiKey[]> => {
  const res = await api.get("/api/mcp-keys", { params: { scope } });
  return res.data;
};

export const createMcpApiKey = async (data: {
  name: string;
  scope: McpKeyScope;
  permissions: McpKeyPermissions;
  expiresAt?: string;
}): Promise<CreatedMcpApiKey> => {
  const res = await api.post("/api/mcp-keys", data);
  return res.data;
};

export const revokeMcpApiKey = async (id: string, scope: McpKeyScope): Promise<void> => {
  await api.patch(`/api/mcp-keys/${id}/revoke`, { scope });
};

export const deleteMcpApiKey = async (id: string, scope: McpKeyScope): Promise<void> => {
  await api.delete(`/api/mcp-keys/${id}`, { data: { scope } });
};

export const getMcpTools = async (): Promise<McpTool[]> => {
  const res = await api.get("/api/mcp/tools");
  return res.data.tools;
};

export const getMcpCapabilities = async (): Promise<McpCapabilities> => {
  const res = await api.get("/api/mcp/capabilities");
  return res.data;
};

export interface McpJsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export const callMcpRpc = async <T = unknown>(
  endpoint: string,
  apiKey: string,
  payload: Record<string, unknown>
): Promise<McpJsonRpcResponse<T>> => {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

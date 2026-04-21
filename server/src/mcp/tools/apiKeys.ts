import { prisma } from "../../config/prisma";
import { MCPContext } from "../types";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { createMcpApiKey, listMcpApiKeys, revokeMcpApiKey } from "../services/apiKeyService";

async function createApiKey(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { name, permissions = {}, expiresAt } = args;

  const result = await createMcpApiKey(
    context.userId,
    String(name),
    permissions as Record<string, unknown>,
    expiresAt ? new Date(String(expiresAt)) : undefined
  );

  return {
    success: true,
    keyId: result.id,
    key: result.key,
    message: "Store this key securely - it cannot be retrieved again",
  };
}

async function listApiKeys(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const keys = await listMcpApiKeys(context.userId);

  return {
    apiKeys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    })),
    total: keys.length,
  };
}

async function revokeApiKey(
  context: MCPContext,
  args: Record<string, unknown>
): Promise<unknown> {
  const { keyId } = args;

  const success = await revokeMcpApiKey(context.userId, String(keyId));

  return {
    success,
    message: success ? "API key revoked" : "API key not found",
  };
}

export function registerApiKeyTools() {
  toolRegistry.register(
    {
      name: "api_key_create",
      description: "Create an API key for MCP access",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: { type: "string", description: "Descriptive name for this key" },
          permissions: { type: "object", description: "Optional permissions scope" },
          expiresAt: { type: "string", description: "Optional expiration date ISO" },
        },
        required: ["name"],
      },
      handler: createToolHandler({ name: "api_key_create", description: "", inputSchema: {} as never, handler: createApiKey }),
    },
    "settings"
  );

  toolRegistry.register(
    {
      name: "api_key_list",
      description: "List your API keys",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
      handler: createToolHandler({ name: "api_key_list", description: "", inputSchema: {} as never, handler: listApiKeys }),
    },
    "settings"
  );

  toolRegistry.register(
    {
      name: "api_key_revoke",
      description: "Revoke an API key",
      inputSchema: {
        type: "object" as const,
        properties: {
          keyId: { type: "string", description: "API key ID to revoke" },
        },
        required: ["keyId"],
      },
      handler: createToolHandler({ name: "api_key_revoke", description: "", inputSchema: {} as never, handler: revokeApiKey }),
    },
    "settings"
  );
}
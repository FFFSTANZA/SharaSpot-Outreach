import { MCPTool, MCPContext, MCPToolAccess, MCPToolCategory, ToolHandler } from "./types";

type ToolRegistration = Omit<Partial<MCPTool>, "name" | "description" | "inputSchema" | "handler"> & {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
};

class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private categories: Map<MCPToolCategory, string[]> = new Map();

  register(tool: ToolRegistration, category?: MCPToolCategory, access?: MCPToolAccess): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    const resolvedCategory = tool.category || category || "settings";
    const resolvedAccess = tool.access || access || inferAccess(tool.name);
    const destructive = tool.destructive ?? inferDestructive(tool.name);
    const requiresConfirmation = tool.requiresConfirmation ?? destructive;
    const inputSchema = withConfirmationSchema(tool.inputSchema, requiresConfirmation);
    const registeredTool: MCPTool = {
      ...tool,
      inputSchema,
      category: resolvedCategory,
      access: resolvedAccess,
      destructive,
      requiresConfirmation,
    };

    this.tools.set(tool.name, registeredTool);

    const existing = this.categories.get(resolvedCategory) || [];
    existing.push(tool.name);
    this.categories.set(resolvedCategory, existing);
  }

  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  getAll(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getByCategory(category: MCPToolCategory): MCPTool[] {
    const names = this.categories.get(category) || [];
    return names.map((name) => this.tools.get(name)!).filter(Boolean);
  }

  async execute(
    name: string,
    context: MCPContext,
    args: Record<string, unknown> = {}
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    const result = await tool.handler(context, args);
    if (result && typeof result === "object" && !Array.isArray(result) && "success" in result) {
      return result;
    }
    return { success: true, data: result };
  }

  listTools(): Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    category: MCPToolCategory;
    access: MCPToolAccess;
    destructive: boolean;
    requiresConfirmation: boolean;
  }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      category: tool.category,
      access: tool.access,
      destructive: tool.destructive,
      requiresConfirmation: tool.requiresConfirmation,
    }));
  }
}

export const toolRegistry = new MCPToolRegistry();

function inferAccess(toolName: string): MCPToolAccess {
  return /(^|_)(create|update|delete|launch|add|remove|revoke|pause|resume|cancel|sync|reply|apply|undo|archive|star|read|log|disposition|validate|upsert)($|_)/.test(toolName)
    ? "write"
    : "read";
}

function inferDestructive(toolName: string): boolean {
  return /(^|_)(delete|bulk_delete|launch|cancel|remove|revoke|apply|undo|archive|disposition)($|_)/.test(toolName);
}

function withConfirmationSchema(schema: Record<string, unknown>, requiresConfirmation: boolean): Record<string, unknown> {
  if (!requiresConfirmation || schema.type !== "object") return schema;
  const properties = typeof schema.properties === "object" && schema.properties !== null
    ? schema.properties as Record<string, unknown>
    : {};
  const required = Array.isArray(schema.required) ? schema.required as string[] : [];

  return {
    ...schema,
    properties: {
      ...properties,
      confirm: {
        type: "boolean",
        const: true,
        description: "Required for destructive or externally visible operator actions.",
      },
    },
    required: Array.from(new Set([...required, "confirm"])),
  };
}

export function createToolHandler(tool: ToolRegistration): ToolHandler {
  return async (context: MCPContext, args: Record<string, unknown>) => {
    try {
      return await tool.handler(context, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Tool execution failed: ${message}`);
    }
  };
}

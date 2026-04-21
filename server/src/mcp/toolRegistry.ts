import { MCPTool, MCPContext, ToolHandler } from "./types";

class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private categories: Map<string, string[]> = new Map();

  register(tool: MCPTool, category?: string): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }
    this.tools.set(tool.name, tool);

    if (category) {
      const existing = this.categories.get(category) || [];
      existing.push(tool.name);
      this.categories.set(category, existing);
    }
  }

  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  getAll(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getByCategory(category: string): MCPTool[] {
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
    return tool.handler(context, args);
  }

  listTools(): Array<{ name: string; description: string; inputSchema: unknown }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }
}

export const toolRegistry = new MCPToolRegistry();

export function createToolHandler(tool: MCPTool): ToolHandler {
  return async (context: MCPContext, args: Record<string, unknown>) => {
    try {
      return await tool.handler(context, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Tool execution failed: ${message}`);
    }
  };
}
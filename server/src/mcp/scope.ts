import { MCPContext } from "./types";

export function mcpScopeWhere<T extends Record<string, unknown>>(
  context: MCPContext,
  where: T = {} as T
): T & ({ organizationId: string } | { userId: string }) {
  if (context.organizationId) {
    return { ...where, organizationId: context.organizationId } as T & { organizationId: string };
  }

  return { ...where, userId: context.userId } as T & { userId: string };
}

export function mcpCreateData<T extends Record<string, unknown>>(
  context: MCPContext,
  data: T
): T & { userId: string; organizationId?: string } {
  return {
    ...data,
    userId: context.userId,
    ...(context.organizationId ? { organizationId: context.organizationId } : {}),
  };
}

import { toolRegistry } from "./toolRegistry";
import { mcpRequestHandler } from "./requestHandler";
import { registerContactTools } from "./tools/contacts";
import { registerCampaignTools } from "./tools/campaigns";
import { registerSenderTools } from "./tools/senders";
import { registerTemplateTools } from "./tools/templates";
import { registerAnalyticsTools } from "./tools/analytics";
import { registerContactListTools } from "./tools/contactLists";
import { registerApiKeyTools } from "./tools/apiKeys";

export * from "./types";
export { toolRegistry, mcpRequestHandler };

export function initializeMCP() {
  console.log("[MCP] Initializing MCP Server...");

  registerContactTools();
  registerCampaignTools();
  registerSenderTools();
  registerTemplateTools();
  registerAnalyticsTools();
  registerContactListTools();
  registerApiKeyTools();

  const toolCount = toolRegistry.getAll().length;
  console.log(`[MCP] Registered ${toolCount} tools`);

  return {
    toolCount,
    tools: toolRegistry.listTools(),
  };
}
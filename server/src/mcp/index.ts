import { toolRegistry } from "./toolRegistry";
import { mcpRequestHandler } from "./requestHandler";
import { validateMcpEncryptionKey } from "./services/apiKeyService";
import { registerContactTools } from "./tools/contacts";
import { registerCampaignTools } from "./tools/campaigns";
import { registerSenderTools } from "./tools/senders";
import { registerTemplateTools } from "./tools/templates";
import { registerAnalyticsTools } from "./tools/analytics";
import { registerContactListTools } from "./tools/contactLists";
import { registerApiKeyTools } from "./tools/apiKeys";
import { registerContactOperatorTools } from "./tools/contactOps";
import { registerCampaignOperatorTools } from "./tools/campaignOps";
import { registerInboxTools } from "./tools/inboxOps";
import { registerPrmTools } from "./tools/prmOps";
import { registerValidationTools } from "./tools/validationOps";
import { registerCallTools } from "./tools/callOps";
import { registerFollowUpTemplateTools } from "./tools/followUpTemplates";

export * from "./types";
export { toolRegistry, mcpRequestHandler };

export function initializeMCP() {
  validateMcpEncryptionKey();
  console.log("[MCP] Initializing MCP Server...");
  if (toolRegistry.getAll().length > 0) {
    const toolCount = toolRegistry.getAll().length;
    console.log(`[MCP] Already initialized with ${toolCount} tools`);
    return {
      toolCount,
      tools: toolRegistry.listTools(),
    };
  }

  registerContactTools();
  registerCampaignTools();
  registerSenderTools();
  registerTemplateTools();
  registerAnalyticsTools();
  registerContactListTools();
  registerApiKeyTools();
  registerContactOperatorTools();
  registerCampaignOperatorTools();
  registerInboxTools();
  registerPrmTools();
  registerValidationTools();
  registerCallTools();
  registerFollowUpTemplateTools();

  const toolCount = toolRegistry.getAll().length;
  console.log(`[MCP] Registered ${toolCount} tools`);

  return {
    toolCount,
    tools: toolRegistry.listTools(),
  };
}

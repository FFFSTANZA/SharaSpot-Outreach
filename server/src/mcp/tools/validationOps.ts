import { validateEmailsBatch } from "../../utils/emailValidator";
import { toolRegistry, createToolHandler } from "../toolRegistry";
import { fail, ok, sanitizeStringArray } from "../helpers";
import { MCPContext } from "../types";

async function validateBatch(_context: MCPContext, args: Record<string, unknown>) {
  const emails = sanitizeStringArray(args.emails, 1000, 254);
  if (!emails.length) return fail("emails array is required");
  const startedAt = Date.now();
  const result = await validateEmailsBatch(emails);
  return ok({
    ...result,
    processingTimeMs: Date.now() - startedAt,
    deduplicated: emails.length !== result.total,
    originalCount: emails.length,
  }, "Validation complete");
}

export function registerValidationTools() {
  toolRegistry.register({
    name: "validation_email_batch_check",
    description: "Validate a batch of email addresses",
    category: "validation",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        emails: { type: "array", items: { type: "string" }, description: "Email addresses to validate, max 1000" },
      },
      required: ["emails"],
    },
    handler: createToolHandler({ name: "validation_email_batch_check", description: "", inputSchema: {}, handler: validateBatch }),
  });
}

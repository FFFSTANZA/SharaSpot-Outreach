import { validateEmailsBatch } from "../../utils/emailValidator";
import { enrichContactInput, normalizeDomain, normalizeEmailAddress, normalizeWebsite } from "../../utils/contactEnrichment";
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

async function enrichContact(_context: MCPContext, args: Record<string, unknown>) {
  const result = await enrichContactInput({
    email: normalizeEmailAddress(args.email),
    website: normalizeWebsite(args.website),
    companyDomain: normalizeDomain(args.companyDomain),
    firstName: typeof args.firstName === "string" ? args.firstName : null,
    lastName: typeof args.lastName === "string" ? args.lastName : null,
  });

  return ok({
    email: result.email,
    website: result.website,
    companyDomain: result.companyDomain,
    techStack: result.techStack,
    discoveredEmails: result.discoveredEmails,
    validation: result.validation,
    lastEnrichedAt: result.lastEnrichedAt,
  }, "Contact enrichment complete");
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

  toolRegistry.register({
    name: "validation_contact_enrich_preview",
    description: "Discover a contact email from website/domain and detect the company tech stack",
    category: "validation",
    access: "write",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Optional email address to validate alongside enrichment" },
        website: { type: "string", description: "Company website URL" },
        companyDomain: { type: "string", description: "Company domain if no website is provided" },
        firstName: { type: "string", description: "Optional first name used to rank discovered emails" },
        lastName: { type: "string", description: "Optional last name used to rank discovered emails" },
      },
    },
    handler: createToolHandler({ name: "validation_contact_enrich_preview", description: "", inputSchema: {}, handler: enrichContact }),
  });
}

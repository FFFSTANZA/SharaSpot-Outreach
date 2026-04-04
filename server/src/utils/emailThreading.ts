/**
 * Email Threading Utility
 *
 * Generates and manages RFC 5322 compliant email threading headers:
 * - Message-ID: Unique identifier for each sent message
 * - In-Reply-To: References the parent message in a thread
 * - References: Full chain of Message-IDs from root to parent
 *
 * These headers ensure that replies and follow-ups land in the same
 * conversation thread in the recipient's email client.
 */

/**
 * Generates a RFC 5322 compliant Message-ID.
 *
 * Format: <timestamp.random@domain>
 * Example: <1712345678901.abc123@gmail.com>
 */
export function generateMessageId(domain: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `<${timestamp}.${random}@${domain}>`;
}

/**
 * Extracts the domain from an email address.
 * Returns empty string if parsing fails.
 */
export function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : "";
}

/**
 * Builds threading headers for a follow-up email.
 *
 * For the initial email (step 0), only a new Message-ID is generated.
 * For follow-ups, In-Reply-To and References are set to maintain the thread.
 *
 * @param senderEmail - The sender's email address (used for domain in Message-ID)
 * @param previousMessageId - The Message-ID of the previous email in the thread
 * @param rootMessageId - The Message-ID of the first email in the thread
 * @param previousReferences - The existing References header value (if any)
 * @returns { messageId, inReplyTo, references }
 */
export function buildThreadingHeaders(
  senderEmail: string,
  previousMessageId?: string | null,
  rootMessageId?: string | null,
  previousReferences?: string | null,
): { messageId: string; inReplyTo?: string; references?: string } {
  const domain = extractDomain(senderEmail) || "sharaspot.app";
  const messageId = generateMessageId(domain);

  if (!previousMessageId) {
    // Initial email — no threading headers needed
    return { messageId };
  }

  // Follow-up email — build In-Reply-To and References
  const inReplyTo = previousMessageId;

  // References chain: root + all intermediates + parent
  const existingRefs = previousReferences
    ? previousReferences.split(" ").filter(Boolean)
    : [];

  // Ensure root is first in the chain
  if (rootMessageId && !existingRefs.includes(rootMessageId)) {
    existingRefs.unshift(rootMessageId);
  }

  // Add the parent message ID if not already in the chain
  if (!existingRefs.includes(previousMessageId)) {
    existingRefs.push(previousMessageId);
  }

  const references = existingRefs.join(" ");

  return { messageId, inReplyTo, references };
}

/**
 * Parses a References header into an array of Message-IDs.
 * Handles both space-separated and angle-bracket-wrapped formats.
 */
export function parseReferences(references: string): string[] {
  return references
    .split(/\s+/)
    .map((ref) => ref.trim())
    .filter((ref) => ref.startsWith("<") && ref.endsWith(">"));
}

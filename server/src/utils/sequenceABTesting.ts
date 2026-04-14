import crypto from "crypto";
import { SequenceABVariant } from "@prisma/client";

/**
 * Selects an A/B variant for a recipient deterministically.
 */
export function selectVariant(
  recipientEmail: string,
  stepId: string,
  variants: SequenceABVariant[]
): SequenceABVariant | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Use a hash of recipientEmail + stepId to select a variant deterministically
  const hash = crypto
    .createHash("md5")
    .update(`${recipientEmail}-${stepId}`)
    .digest("hex");
  
  // Convert first 8 hex chars to an integer
  const hashInt = parseInt(hash.substring(0, 8), 16);
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  
  if (totalWeight === 0) return variants[0];

  let random = hashInt % totalWeight;
  
  for (const variant of variants) {
    if (random < variant.weight) {
      return variant;
    }
    random -= variant.weight;
  }

  return variants[variants.length - 1];
}

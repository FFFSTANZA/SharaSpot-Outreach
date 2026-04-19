import dns from "dns";
import { promisify } from "util";
import {
  FREE_EMAIL_DOMAINS,
  DISPOSABLE_DOMAINS,
  SUSPICIOUS_TLDS,
} from "../config/data";

const resolveMx = promisify(dns.resolveMx);
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface ValidationResult {
  email: string;
  valid: boolean;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  checks: {
    syntax: boolean;
    mx: boolean;
    disposable: boolean;
    free: boolean;
  };
}

/**
 * Robust email validation utility.
 * Conducts syntax analysis, TLD reputation check, and live MX record resolution.
 */
export async function validateEmail(email: string): Promise<ValidationResult> {
  const normalized = email.toLowerCase().trim();
  const domain = normalized.split("@")[1];

  let score = 0;
  const checks = {
    syntax: EMAIL_REGEX.test(normalized),
    mx: false,
    disposable: false,
    free: false,
  };

  if (!checks.syntax || !domain) {
    return {
      email: normalized,
      valid: false,
      score: 100,
      level: "critical",
      checks: { ...checks, syntax: false }
    };
  }

  checks.free = FREE_EMAIL_DOMAINS.has(domain);
  checks.disposable = DISPOSABLE_DOMAINS.has(domain);
  const tld = domain.split(".").pop() || "";
  const isSuspiciousTld = SUSPICIOUS_TLDS.has(tld);

  if (checks.disposable) score += 60;
  if (isSuspiciousTld) score += 30;

  // Live DNS Check
  try {
    const mxRecords = await resolveMx(domain);
    checks.mx = mxRecords && mxRecords.length > 0;
  } catch (error) {
    checks.mx = false;
  }

  if (!checks.mx) score += 50;

  // Final score normalization
  const finalScore = Math.min(100, score);
  const level = finalScore > 80 ? "critical" : finalScore > 50 ? "high" : finalScore > 20 ? "medium" : "low";

  return {
    email: normalized,
    valid: checks.mx && !checks.disposable,
    score: finalScore,
    level,
    checks,
  };
}

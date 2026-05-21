import * as dns from "dns";
import { promisify } from "util";
import {
  FREE_EMAIL_DOMAINS,
  DISPOSABLE_DOMAINS,
  SUSPICIOUS_TLDS,
  ROLE_BASED_KEYWORDS,
} from "../config/data";

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export interface ValidationIssue {
  type: "syntax" | "mx_record" | "disposable" | "role_based" | "typo" | "subdomain" | "free_email" | "catch_all" | "suspicious_tld" | "missing_name" | "long_local" | "numeric_only" | "consecutive_dots" | "trailing_dot" | "spf_missing" | "dmarc_missing";
  severity: "warning" | "error" | "info";
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  email: string;
  valid: boolean;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  issues: ValidationIssue[];
  checks: {
    syntax: boolean;
    mx: boolean;
    disposable: boolean;
    free: boolean;
    roleBased: boolean;
    catchAll: boolean;
    hasSPF: boolean;
    hasDMARC: boolean;
  };
  isFreeEmail: boolean;
  isCorporateEmail: boolean;
  isCatchAll: boolean;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

const TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gail.com": "gmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "outloo.com": "outlook.com",
  "outlok.com": "outlook.com",
  "outllook.com": "outlook.com",
  "protonmal.com": "protonmail.com",
  "protonmial.com": "protonmail.com",
};

const KNOWN_CATCH_ALL_DOMAINS = new Set([
  "apple.com",
  "microsoft.com",
  "ibm.com",
]);

function checkTypoDomain(domain: string): { isTypo: boolean; suggestion?: string } {
  if (TYPO_DOMAINS[domain]) {
    return { isTypo: true, suggestion: TYPO_DOMAINS[domain] };
  }
  
  for (const [typo, correct] of Object.entries(TYPO_DOMAINS)) {
    const typoParts = typo.split(".");
    const domainParts = domain.split(".");
    if (typoParts.length === domainParts.length) {
      let differences = 0;
      for (let i = 0; i < typoParts.length; i++) {
        if (typoParts[i] !== domainParts[i]) {
          const t1 = typoParts[i];
          const t2 = domainParts[i];
          if (Math.abs(t1.length - t2.length) > 1) {
            differences += 2;
          } else {
            let diffs = 0;
            const maxLen = Math.max(t1.length, t2.length);
            for (let j = 0; j < maxLen; j++) {
              if (t1[j] !== t2[j]) diffs++;
            }
            differences += diffs;
          }
        }
      }
      if (differences <= 2) {
        return { isTypo: true, suggestion: correct };
      }
    }
  }
  
  return { isTypo: false };
}

function analyzeLocalPart(local: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (local.length > 64) {
    issues.push({
      type: "long_local",
      severity: "error",
      message: "Local part exceeds 64 characters (RFC 5321 limit)",
    });
  }
  
  if (/^[0-9]+$/.test(local)) {
    issues.push({
      type: "numeric_only",
      severity: "warning",
      message: "Email contains only numbers in local part",
      suggestion: "Numeric-only emails are often spam traps or invalid",
    });
  }
  
  if (/\.\./.test(local)) {
    issues.push({
      type: "consecutive_dots",
      severity: "error",
      message: "Consecutive dots in local part are invalid",
    });
  }
  
  if (local.endsWith(".")) {
    issues.push({
      type: "trailing_dot",
      severity: "error",
      message: "Trailing dot in local part is invalid",
    });
  }
  
  return issues;
}

async function checkSPF(domain: string): Promise<boolean> {
  try {
    const txtRecords = await resolveTxt(domain);
    return txtRecords.some(record => 
      record.some(r => r.startsWith("v=spf1"))
    );
  } catch {
    return false;
  }
}

async function checkDMARC(domain: string): Promise<boolean> {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const txtRecords = await resolveTxt(dmarcDomain);
    return txtRecords.some(record => 
      record.some(r => r.toLowerCase().startsWith("v=dmarc1"))
    );
  } catch {
    return false;
  }
}

async function checkCatchAll(domain: string): Promise<boolean> {
  if (KNOWN_CATCH_ALL_DOMAINS.has(domain)) {
    return true;
  }
  
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return false;
    }
    
    const testAddress = `sharaspot-test-${Date.now()}@${domain}`;
    try {
      await resolveMx(domain);
      return false;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export async function validateEmail(email: string): Promise<ValidationResult> {
  const normalized = email.toLowerCase().trim();
  const parts = normalized.split("@");
  const local = parts[0];
  const domain = parts[1];
  const issues: ValidationIssue[] = [];
  let riskScore = 0;

  const checks = {
    syntax: EMAIL_REGEX.test(normalized),
    mx: false,
    disposable: false,
    free: false,
    roleBased: false,
    catchAll: false,
    hasSPF: false,
    hasDMARC: false,
  };

  if (!checks.syntax || !domain || !local) {
    return {
      email: normalized,
      valid: false,
      score: 100,
      level: "critical",
      issues: [{ type: "syntax", severity: "error", message: "Invalid email format" }],
      checks,
      isFreeEmail: false,
      isCorporateEmail: false,
      isCatchAll: false,
      riskScore: 100,
      riskLevel: "critical",
    };
  }

  const localIssues = analyzeLocalPart(local);
  issues.push(...localIssues);
  localIssues.forEach(issue => {
    if (issue.severity === "error") riskScore += 30;
    else if (issue.severity === "warning") riskScore += 15;
  });

  checks.free = FREE_EMAIL_DOMAINS.has(domain);
  checks.disposable = DISPOSABLE_DOMAINS.has(domain);
  
  const isRoleBased = ROLE_BASED_KEYWORDS.some(keyword => 
    local === keyword || local.startsWith(keyword + ".") || local.startsWith(keyword + "+")
  );
  checks.roleBased = isRoleBased;

  const tld = domain.split(".").pop() || "";
  const isSuspiciousTld = SUSPICIOUS_TLDS.has(tld);

  const typoCheck = checkTypoDomain(domain);
  if (typoCheck.isTypo) {
    issues.push({
      type: "typo",
      severity: "warning",
      message: `Possible typo in domain "${domain}"`,
      suggestion: `Did you mean "${typoCheck.suggestion}"?`,
    });
    riskScore += 40;
  }

  if (checks.disposable) {
    issues.push({
      type: "disposable",
      severity: "error",
      message: "Disposable email address detected",
      suggestion: "Use a permanent email address for better deliverability",
    });
    riskScore += 60;
  }

  if (isSuspiciousTld) {
    issues.push({
      type: "suspicious_tld",
      severity: "warning",
      message: `TLD ".${tld}" is associated with higher spam rates`,
    });
    riskScore += 20;
  }

  if (checks.roleBased) {
    issues.push({
      type: "role_based",
      severity: "warning",
      message: "Role-based email address detected",
      suggestion: "Personal email addresses have higher engagement rates",
    });
    riskScore += 15;
  }

  if (checks.free) {
    issues.push({
      type: "free_email",
      severity: "info",
      message: "Free email provider detected",
    });
  }

  try {
    const mxRecords = await resolveMx(domain);
    checks.mx = mxRecords && mxRecords.length > 0;
    
    if (mxRecords && mxRecords.length > 0) {
      checks.catchAll = await checkCatchAll(domain);
    }
  } catch {
    checks.mx = false;
  }

  if (!checks.mx) {
    issues.push({
      type: "mx_record",
      severity: "error",
      message: "No MX records found for domain",
      suggestion: "This domain cannot receive emails",
    });
    riskScore += 50;
  }

  const [hasSPF, hasDMARC] = await Promise.all([
    checkSPF(domain),
    checkDMARC(domain),
  ]);
  checks.hasSPF = hasSPF;
  checks.hasDMARC = hasDMARC;

  if (!hasSPF && !checks.free) {
    issues.push({
      type: "spf_missing",
      severity: "warning",
      message: "Domain has no SPF record",
      suggestion: "Missing SPF may indicate poor email infrastructure",
    });
    riskScore += 10;
  }

  if (!hasDMARC && !checks.free) {
    issues.push({
      type: "dmarc_missing",
      severity: "info",
      message: "Domain has no DMARC record",
    });
  }

  const finalScore = Math.min(100, riskScore);
  const riskLevel = finalScore > 80 ? "critical" : finalScore > 50 ? "high" : finalScore > 20 ? "medium" : "low";
  const level = riskLevel;

  return {
    email: normalized,
    valid: checks.mx && !checks.disposable && finalScore < 80,
    score: finalScore,
    level,
    issues,
    checks,
    isFreeEmail: checks.free,
    isCorporateEmail: !checks.free && !checks.disposable,
    isCatchAll: checks.catchAll,
    riskScore: finalScore,
    riskLevel,
  };
}

export interface BatchValidationResult {
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  freeEmails: number;
  corporateEmails: number;
  results: ValidationResult[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    syntaxErrors: number;
    mxErrors: number;
    disposableEmails: number;
    typosFound: number;
  };
  recommendations: string[];
}

export async function validateEmailsBatch(
  emails: string[]
): Promise<BatchValidationResult> {
  const uniqueEmails = Array.from(new Set(emails.map((e) => e.toLowerCase().trim())));

  const results: ValidationResult[] = [];
  const chunkSize = 20;
  for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
    const chunk = uniqueEmails.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(validateEmail));
    results.push(...chunkResults);
  }

  const valid = results.filter((r) => r.valid).length;
  const invalid = results.filter((r) => !r.valid).length;
  const risky = results.filter((r) => r.riskLevel === "high" || r.riskLevel === "critical").length;
  const freeEmails = results.filter((r) => r.isFreeEmail).length;
  const corporateEmails = results.filter((r) => r.isCorporateEmail).length;

  const summary = {
    criticalCount: results.filter((r) => r.level === "critical").length,
    highCount: results.filter((r) => r.level === "high").length,
    mediumCount: results.filter((r) => r.level === "medium").length,
    lowCount: results.filter((r) => r.level === "low").length,
    syntaxErrors: results.filter((r) => r.issues.some((i) => i.type === "syntax")).length,
    mxErrors: results.filter((r) => r.issues.some((i) => i.type === "mx_record")).length,
    disposableEmails: results.filter((r) => r.issues.some((i) => i.type === "disposable")).length,
    typosFound: results.filter((r) => r.issues.some((i) => i.type === "typo")).length,
  };

  const recommendations: string[] = [];
  if (summary.disposableEmails > 0) {
    recommendations.push(`Remove ${summary.disposableEmails} disposable email addresses to improve deliverability`);
  }
  if (summary.typosFound > 0) {
    recommendations.push(`Fix ${summary.typosFound} potential domain typos to avoid bounces`);
  }
  if (summary.mxErrors > 0) {
    recommendations.push(`${summary.mxErrors} emails have invalid MX records and will bounce`);
  }
  if (risky > uniqueEmails.length * 0.2) {
    recommendations.push("High percentage of risky emails detected - consider cleaning your list");
  }
  if (freeEmails > uniqueEmails.length * 0.5) {
    recommendations.push("Over 50% free email providers - corporate emails typically have better engagement");
  }

  return {
    total: uniqueEmails.length,
    valid,
    invalid,
    risky,
    freeEmails,
    corporateEmails,
    results,
    summary,
    recommendations,
  };
}

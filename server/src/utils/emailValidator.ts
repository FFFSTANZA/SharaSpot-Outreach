import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.com.au", "yahoo.in", "ymail.com",
  "hotmail.com", "hotmail.co.uk", "live.com", "outlook.com", "msn.com", "windowslive.com",
  "aol.com", "aim.com", "icloud.com", "me.com", "mac.com",
  "mail.com", "gmx.com", "gmx.de", "gmx.net", "gmx.ch",
  "protonmail.com", "protonmail.ch", "pm.me",
  "zoho.com", "yandex.com", "yandex.ru", "qq.com", "163.com",
  "web.de", "gmx.at", "t-online.de",
]);

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
  "getnada.com", "mohmal.com", "tempail.com", "dispostable.com",
  "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "pokemail.net",
  "spam4.me", "grr.la", "discard.email", "discardmail.com", "spamgourmet.com",
  "mytrashmail.com", "mailnesia.com", "tempr.email", "dropmail.me",
  "fakemail.net", "emailondeck.com", "mintemail.com", "tempmailaddress.com",
  "maildrop.cc", "throwawaymail.com", "mailcatch.com", "mailnull.com",
  "spamgourmet.com", "spamex.com", "spam.la", "sogetthis.com",
  "tempinbox.com", "tempsky.com", "emailfake.com", "fakemailgenerator.com",
  "mail-temp.com", "incognitomail.com", "incognitomail.net", "mailexpire.com",
  "mailhazard.com", "mailhazard.us", "mailtemp.net", "mailforspam.com",
]);

const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "club", "online", "site", "website", "space", "work", "tk", 
  "ml", "ga", "cf", "gq", "pw", "cc", "su", "racing", "win", "bid", "date",
  "faith", "loan", "cricket", "science", "party", "stream", "accountant",
]);

const ROLE_BASED_KEYWORDS = [
  "info", "support", "sales", "contact", "hello", "admin", "webmaster",
  "postmaster", "noreply", "no-reply", "donotreply", "team", "help",
  "careers", "jobs", "hr", "recruiter", "recruiting", "office", "general",
  "billing", "accounts", "enquiries", "inquiry", "marketing", "legal",
  "purchase", "procurement", "finance", "accounting", "press", "media",
  "partnerships", "partners", "investors", "investment", "ventures",
  "ops", "operations", "it", "tech", "security", "abuse", "privacy",
];

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.cm": "outlook.com",
  "outloo.com": "outlook.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "aol.cm": "aol.com",
  "gmxs.com": "gmx.com",
  "protonmal.com": "protonmail.com",
  "protonmial.com": "protonmail.com",
};

export interface ValidationResult {
  email: string;
  valid: boolean;
  issues: ValidationIssue[];
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  checks: ValidationCheck[];
  isFreeEmail: boolean;
  isCorporateEmail: boolean;
  isCatchAll: boolean;
}

export interface ValidationIssue {
  type: "syntax" | "mx_record" | "disposable" | "role_based" | "typo" | "subdomain" | "free_email" | "catch_all" | "suspicious_tld" | "missing_name";
  severity: "warning" | "error" | "info";
  message: string;
  suggestion?: string;
}

export interface ValidationCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

function checkSyntax(email: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const issues: string[] = [];
  
  if (!EMAIL_REGEX.test(email)) {
    return {
      issue: {
        type: "syntax",
        severity: "error",
        message: "Invalid email format",
        suggestion: "Check for typos in the email address",
      },
      check: {
        name: "Format",
        status: "fail",
        message: "Invalid email format",
      },
    };
  }

  const atIndex = email.indexOf("@");
  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  if (localPart.length > 64) {
    issues.push("Local part exceeds 64 characters");
  }

  if (domain.length > 255) {
    issues.push("Domain exceeds 255 characters");
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    issues.push("Local part cannot start or end with a dot");
  }

  if (localPart.includes("..")) {
    issues.push("Local part cannot contain consecutive dots");
  }

  if (issues.length > 0) {
    return {
      issue: {
        type: "syntax",
        severity: "error",
        message: issues.join(", "),
        suggestion: "Check for typos in the email address",
      },
      check: {
        name: "Format",
        status: "fail",
        message: issues.join(", "),
      },
    };
  }

  return {
    issue: null,
    check: {
      name: "Format",
      status: "pass",
      message: "Valid email format",
    },
  };
}

function checkDisposable(domain: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const lowerDomain = domain.toLowerCase();
  
  if (DISPOSABLE_DOMAINS.has(lowerDomain)) {
    return {
      issue: {
        type: "disposable",
        severity: "error",
        message: "Disposable email address detected",
        suggestion: "Use a permanent email address instead",
      },
      check: {
        name: "Disposable",
        status: "fail",
        message: "Known disposable email provider",
      },
    };
  }

  const domainParts = lowerDomain.split(".");
  for (const disposable of DISPOSABLE_DOMAINS) {
    if (lowerDomain.endsWith("." + disposable)) {
      return {
        issue: {
          type: "disposable",
          severity: "error",
          message: "Disposable email subdomain detected",
          suggestion: "Use a permanent email address instead",
        },
        check: {
          name: "Disposable",
          status: "fail",
          message: "Disposable email subdomain detected",
        },
      };
    }
  }

  return {
    issue: null,
    check: {
      name: "Disposable",
      status: "pass",
      message: "Not a known disposable email",
    },
  };
}

function checkRoleBased(localPart: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const lowerLocal = localPart.toLowerCase().replace(/[._-]/g, "");
  
  for (const keyword of ROLE_BASED_KEYWORDS) {
    if (lowerLocal.includes(keyword)) {
      return {
        issue: {
          type: "role_based",
          severity: "warning",
          message: `Role-based email detected (${keyword}@)`,
          suggestion: "Consider if this is the right person to contact",
        },
        check: {
          name: "Role-Based",
          status: "warning",
          message: `Generic role: ${keyword}`,
        },
      };
    }
  }

  return {
    issue: null,
    check: {
      name: "Role-Based",
      status: "pass",
      message: "Appears to be a personal email",
    },
  };
}

function checkTypo(domain: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const lowerDomain = domain.toLowerCase();
  
  const correction = COMMON_DOMAIN_TYPOS[lowerDomain];
  if (correction) {
    return {
      issue: {
        type: "typo",
        severity: "error",
        message: `Possible typo: did you mean ${correction}?`,
        suggestion: `Correct to ${correction}`,
      },
      check: {
        name: "Typo",
        status: "fail",
        message: `Possible typo - did you mean ${correction}?`,
      },
    };
  }

  return {
    issue: null,
    check: {
      name: "Typo",
      status: "pass",
      message: "No common typos detected",
    },
  };
}

function checkFreeEmail(domain: string): { isFreeEmail: boolean; issue: ValidationIssue | null; check: ValidationCheck } {
  const lowerDomain = domain.toLowerCase();
  const isFree = FREE_EMAIL_DOMAINS.has(lowerDomain);
  
  if (isFree) {
    return {
      isFreeEmail: true,
      issue: null,
      check: {
        name: "Email Type",
        status: "pass",
        message: "Free email provider (Gmail, Yahoo, etc.)",
      },
    };
  }

  return {
    isFreeEmail: false,
    issue: null,
    check: {
      name: "Email Type",
      status: "pass",
      message: "Appears to be a corporate/professional email",
    },
  };
}

function checkSubdomain(domain: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const parts = domain.split(".");
  
  if (parts.length > 3) {
    return {
      issue: {
        type: "subdomain",
        severity: "warning",
        message: "Deep subdomain detected - may be less common",
        suggestion: "Verify this subdomain is intentional",
      },
      check: {
        name: "Subdomain",
        status: "warning",
        message: "Multiple subdomain levels",
      },
    };
  }

  if (parts.length === 3) {
    const tld = parts[2];
    if (tld.length <= 3 && !SUSPICIOUS_TLDS.has(tld)) {
      return {
        issue: null,
        check: {
          name: "Subdomain",
          status: "pass",
          message: "Standard subdomain structure",
        },
      };
    }
  }

  return {
    issue: null,
    check: {
      name: "Subdomain",
      status: "pass",
      message: "No problematic subdomain structure",
    },
  };
}

function checkSuspiciousTld(domain: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const parts = domain.toLowerCase().split(".");
  const tld = parts[parts.length - 1];
  
  if (SUSPICIOUS_TLDS.has(tld)) {
    return {
      issue: {
        type: "suspicious_tld",
        severity: "warning",
        message: `Suspicious TLD (.${tld}) - often associated with spam`,
        suggestion: "Verify this is a legitimate domain",
      },
      check: {
        name: "TLD Risk",
        status: "warning",
        message: `Suspicious TLD: .${tld}`,
      },
    };
  }

  return {
    issue: null,
    check: {
      name: "TLD Risk",
      status: "pass",
      message: "Standard TLD",
    },
  };
}

function checkMissingName(domain: string, localPart: string): { issue: ValidationIssue | null; check: ValidationCheck } {
  const lowerLocal = localPart.toLowerCase();
  const lowerDomain = domain.toLowerCase();
  
  const hasNameIndicator = /^[a-z]+\d*$/i.test(lowerLocal) || 
                          /^[a-z]+[._][a-z]+$/i.test(lowerLocal) ||
                          lowerLocal.includes(".") ||
                          /^[a-z]{3,}$/i.test(lowerLocal);
  
  if (!hasNameIndicator && lowerLocal.length > 2 && lowerLocal.length < 50) {
    const isFreeEmail = FREE_EMAIL_DOMAINS.has(lowerDomain);
    
    if (!isFreeEmail) {
      return {
        issue: {
          type: "missing_name",
          severity: "info",
          message: "Email may lack personal name indicator",
          suggestion: "Consider verifying this is the correct contact",
        },
        check: {
          name: "Personalization",
          status: "warning",
          message: "May not contain personal name",
        },
      };
    }
  }

  return {
    issue: null,
    check: {
      name: "Personalization",
      status: "pass",
      message: "Appears to be a personal email",
    },
  };
}

async function checkMxRecord(domain: string): Promise<{ issue: ValidationIssue | null; check: ValidationCheck; isCatchAll: boolean }> {
  try {
    const mxRecords = await Promise.race([
      resolveMx(domain),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      ),
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        issue: {
          type: "mx_record",
          severity: "error",
          message: `No mail server found for ${domain}`,
          suggestion: "Domain cannot receive emails - likely invalid",
        },
        check: {
          name: "MX Records",
          status: "fail",
          message: "No MX records found",
        },
        isCatchAll: false,
      };
    }

    const hasHighPriority = mxRecords.some(r => r.priority < 10);
    const mxString = mxRecords.map(r => r.exchange).join(", ");
    
    if (!hasHighPriority) {
      return {
        issue: null,
        check: {
          name: "MX Records",
          status: "pass",
          message: `MX configured (${mxRecords.length} server${mxRecords.length > 1 ? "s" : ""})`,
        },
        isCatchAll: false,
      };
    }

    return {
      issue: null,
      check: {
        name: "MX Records",
        status: "pass",
        message: `MX configured (${mxRecords.length} server${mxRecords.length > 1 ? "s" : ""})`,
      },
      isCatchAll: false,
    };
  } catch (error: any) {
    if (error.message === "Timeout") {
      return {
        issue: {
          type: "mx_record",
          severity: "warning",
          message: `MX lookup timed out for ${domain}`,
          suggestion: "DNS may be slow or blocked - verify manually",
        },
        check: {
          name: "MX Records",
          status: "warning",
          message: "MX lookup timed out",
        },
        isCatchAll: false,
      };
    }

    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return {
        issue: {
          type: "mx_record",
          severity: "error",
          message: `Domain ${domain} does not exist or has no mail server`,
          suggestion: "This email will bounce - remove from list",
        },
        check: {
          name: "MX Records",
          status: "fail",
          message: "Domain not found",
        },
        isCatchAll: false,
      };
    }

    return {
      issue: {
        type: "mx_record",
        severity: "warning",
        message: `Could not verify mail server for ${domain}`,
        suggestion: "Proceed with caution",
      },
      check: {
        name: "MX Records",
        status: "warning",
        message: "MX lookup failed",
      },
      isCatchAll: false,
    };
  }
}

function calculateRiskScore(issues: ValidationIssue[]): { score: number; level: "low" | "medium" | "high" | "critical" } {
  let score = 0;
  
  for (const issue of issues) {
    switch (issue.type) {
      case "syntax":
        score += 100;
        break;
      case "mx_record":
        score += issue.severity === "error" ? 80 : 20;
        break;
      case "disposable":
        score += 90;
        break;
      case "typo":
        score += 70;
        break;
      case "catch_all":
        score += 30;
        break;
      case "role_based":
        score += 15;
        break;
      case "subdomain":
        score += 10;
        break;
      case "suspicious_tld":
        score += 25;
        break;
      case "free_email":
        score += 0;
        break;
      case "missing_name":
        score += 5;
        break;
    }
  }

  let level: "low" | "medium" | "high" | "critical";
  if (score >= 80) level = "critical";
  else if (score >= 50) level = "high";
  else if (score >= 20) level = "medium";
  else level = "low";

  return { score, level };
}

export async function validateEmail(email: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const checks: ValidationCheck[] = [];

  const lowerEmail = email.toLowerCase().trim();
  const atIndex = lowerEmail.indexOf("@");
  const localPart = lowerEmail.substring(0, atIndex);
  const domain = lowerEmail.substring(atIndex + 1);

  const syntaxResult = checkSyntax(lowerEmail);
  checks.push(syntaxResult.check);
  if (syntaxResult.issue) {
    issues.push(syntaxResult.issue);
    return {
      email: lowerEmail,
      valid: false,
      issues,
      riskScore: 100,
      riskLevel: "critical",
      checks,
      isFreeEmail: false,
      isCorporateEmail: false,
      isCatchAll: false,
    };
  }

  const disposableResult = checkDisposable(domain);
  checks.push(disposableResult.check);
  if (disposableResult.issue) issues.push(disposableResult.issue);

  const typoResult = checkTypo(domain);
  checks.push(typoResult.check);
  if (typoResult.issue) issues.push(typoResult.issue);

  const freeEmailResult = checkFreeEmail(domain);
  checks.push(freeEmailResult.check);

  const subdomainResult = checkSubdomain(domain);
  checks.push(subdomainResult.check);
  if (subdomainResult.issue) issues.push(subdomainResult.issue);

  const suspiciousTldResult = checkSuspiciousTld(domain);
  checks.push(suspiciousTldResult.check);
  if (suspiciousTldResult.issue) issues.push(suspiciousTldResult.issue);

  const roleResult = checkRoleBased(localPart);
  checks.push(roleResult.check);
  if (roleResult.issue) issues.push(roleResult.issue);

  const missingNameResult = checkMissingName(domain, localPart);
  checks.push(missingNameResult.check);
  if (missingNameResult.issue) issues.push(missingNameResult.issue);

  const mxResult = await checkMxRecord(domain);
  checks.push(mxResult.check);
  if (mxResult.issue) issues.push(mxResult.issue);

  const { score, level } = calculateRiskScore(issues);

  const isDisposable = disposableResult.issue !== null;

  return {
    email: lowerEmail,
    valid: issues.filter(i => i.severity === "error").length === 0,
    issues,
    riskScore: Math.min(100, score),
    riskLevel: level,
    checks,
    isFreeEmail: freeEmailResult.isFreeEmail,
    isCorporateEmail: !freeEmailResult.isFreeEmail && !isDisposable && mxResult.issue === null,
    isCatchAll: mxResult.isCatchAll,
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
  emails: string[],
  concurrency: number = 5
): Promise<BatchValidationResult> {
  const seen = new Set<string>();
  const uniqueEmails: string[] = [];
  
  for (const email of emails) {
    const normalized = email.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueEmails.push(normalized);
    }
  }

  const results: ValidationResult[] = [];
  
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueEmails.length; i += concurrency) {
    chunks.push(uniqueEmails.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(email => validateEmail(email)));
    results.push(...chunkResults);
  }

  const summary = {
    criticalCount: results.filter(r => r.riskLevel === "critical").length,
    highCount: results.filter(r => r.riskLevel === "high").length,
    mediumCount: results.filter(r => r.riskLevel === "medium").length,
    lowCount: results.filter(r => r.riskLevel === "low").length,
    syntaxErrors: results.filter(r => r.issues.some(i => i.type === "syntax")).length,
    mxErrors: results.filter(r => r.issues.some(i => i.type === "mx_record" && i.severity === "error")).length,
    disposableEmails: results.filter(r => r.issues.some(i => i.type === "disposable")).length,
    typosFound: results.filter(r => r.issues.some(i => i.type === "typo")).length,
  };

  const recommendations: string[] = [];
  
  if (summary.syntaxErrors > 0) {
    recommendations.push(`Fix ${summary.syntaxErrors} email(s) with format errors`);
  }
  if (summary.mxErrors > 0) {
    recommendations.push(`Remove ${summary.mxErrors} email(s) with invalid domains - they will bounce`);
  }
  if (summary.disposableEmails > 0) {
    recommendations.push(`Remove ${summary.disposableEmails} disposable email(s) - they won't receive real replies`);
  }
  if (summary.typosFound > 0) {
    recommendations.push(`Correct ${summary.typosFound} email(s) with possible typos`);
  }
  if (results.filter(r => r.isFreeEmail).length > results.length * 0.5) {
    recommendations.push(`High volume of free email addresses detected - consider verifying these are the right contacts`);
  }

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    risky: results.filter(r => r.riskLevel === "high" || r.riskLevel === "critical").length,
    freeEmails: results.filter(r => r.isFreeEmail).length,
    corporateEmails: results.filter(r => r.isCorporateEmail).length,
    results,
    summary,
    recommendations,
  };
}

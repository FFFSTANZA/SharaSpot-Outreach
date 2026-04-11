/**
 * Spam Detector — Rule-based spam score analysis.
 * 
 * NO AI needed. Uses proven pattern matching and content analysis:
 * 1. Spam trigger words (weighted list)
 * 2. Excessive ALL CAPS detection
 * 3. Excessive punctuation
 * 4. Link-to-text ratio
 * 5. HTML structure issues
 * 6. Common spam patterns
 * 
 * Returns spam score 0-100 and actionable feedback.
 */

export interface SpamAnalysisResult {
  score: number; // 0-100 (higher = more likely spam)
  level: "safe" | "warning" | "high_risk" | "very_high_risk";
  checks: SpamCheckResult[];
  suggestions: string[];
}

export interface SpamCheckResult {
  check: string;
  passed: boolean;
  details: string;
  penalty: number; // Points added to score
}

// Spam trigger words with weights (higher = more spammy)
const SPAM_TRIGGERS: Record<string, number> = {
  // Urgency/Fear tactics
  "urgent": 8,
  "act now": 10,
  "limited time": 8,
  "expires": 6,
  "don't wait": 10,
  "last chance": 10,
  "today only": 8,
  "hurry": 8,
  "immediate": 6,
  
  // Money/GET
  "free": 5,
  "free money": 15,
  "make cash": 15,
  "make money": 10,
  "extra income": 8,
  "earn money": 10,
  "cash bonus": 12,
  "$$$": 12,
  "100% free": 10,
  "no cost": 8,
  "no fee": 6,
  "no obligation": 6,
  "risk-free": 8,
  
  // Too good to be true
  "guaranteed": 8,
  "no experience": 8,
  "work from home": 10,
  "be your own boss": 8,
  "financial freedom": 10,
  "double your": 12,
  "increase sales": 5,
  "boost income": 10,
  
  // Pressure tactics
  "limited offer": 10,
  "special promotion": 6,
  "exclusive deal": 8,
  "only to you": 8,
  "you've been selected": 12,
  "congratulations": 6,
  "winner": 12,
  "won": 10,
  "prize": 12,
  
  // Spam-like patterns
  "click here": 8,
  "buy now": 10,
  "order now": 10,
  "act fast": 10,
  "while supplies last": 10,
  "going fast": 8,
  "almost gone": 8,
  "final call": 10,
  
  // Suspicious
  "credit card": 6,
  "invest": 6,
  "mortgage": 6,
  "debt": 8,
  "weight loss": 8,
  "lose weight": 8,
  "diet": 6,
  "beauty": 6,
  "anti-aging": 8,
  "enhancement": 8,
  "enlarge": 12,
  "hot": 5,
  "teen": 8,
  "singles": 8,
  "dating": 6,
};

// Words that trigger false positive (commercial but legitimate)
const FALSE_POSITIVE_ALLOWLIST = [
  "book", "meeting", "schedule", "calendar", "demo", "trial",
  "feedback", "help", "support", "update", "newsletter",
  "introducing", "announcing", "invitation", "verify", "confirm",
];

// Excessive punctuation patterns
const EXCESSIVE_PUNCTUATION = /[!]{3,}|[?]{3,}|[$]{2,}/g;

// ALL CAPS words (minimum 3 chars to avoid acronyms)
const CAPS_PATTERN = /\b[A-Z]{3,}\b/g;

/**
 * Analyzes email content for spam signals.
 * Returns score 0-100 and breakdown.
 */
export function analyzeSpamScore(
  subject: string,
  body: string,
  html?: string
): SpamAnalysisResult {
  const checks: SpamCheckResult[] = [];
  let totalPenalty = 0;

  // Check 1: Spam trigger words
  const triggerCheck = checkSpamTriggers(subject, body);
  checks.push(triggerCheck);
  totalPenalty += triggerCheck.penalty;

  // Check 2: ALL CAPS usage
  const capsCheck = checkExcessiveCaps(subject, body);
  checks.push(capsCheck);
  totalPenalty += capsCheck.penalty;

  // Check 3: Excessive punctuation
  const punctCheck = checkExcessivePunctuation(subject, body);
  checks.push(punctCheck);
  totalPenalty += punctCheck.penalty;

  // Check 4: Link density
  const linkCheck = checkLinkDensity(body, html);
  checks.push(linkCheck);
  totalPenalty += linkCheck.penalty;

  // Check 5: Subject line issues
  const subjectCheck = checkSubjectLine(subject);
  checks.push(subjectCheck);
  totalPenalty += subjectCheck.penalty;

  // Check 6: HTML quality
  const htmlCheck = checkHtmlQuality(html);
  checks.push(htmlCheck);
  totalPenalty += htmlCheck.penalty;

  // Check 7: Personalization
  const personalizeCheck = checkPersonalization(subject, body);
  checks.push(personalizeCheck);
  totalPenalty += personalizeCheck.penalty;

  // Calculate final score (cap at 100)
  const score = Math.min(100, totalPenalty);

  // Determine level
  let level: SpamAnalysisResult["level"];
  if (score < 20) level = "safe";
  else if (score < 40) level = "warning";
  else if (score < 60) level = "high_risk";
  else level = "very_high_risk";

  // Generate suggestions
  const suggestions = generateSuggestions(checks);

  return { score, level, checks, suggestions };
}

function checkSpamTriggers(subject: string, body: string): SpamCheckResult {
  const text = (subject + " " + body).toLowerCase();
  let matches: string[] = [];
  let penalty = 0;

  for (const [word, weight] of Object.entries(SPAM_TRIGGERS)) {
    if (text.includes(word)) {
      // Check allowlist
      const isAllowed = FALSE_POSITIVE_ALLOWLIST.some(
        allowed => word.toLowerCase().includes(allowed.toLowerCase())
      );
      if (!isAllowed) {
        matches.push(word);
        penalty += weight;
      }
    }
  }

  return {
    check: "Spam Trigger Words",
    passed: matches.length === 0,
    details: matches.length > 0
      ? `Found: ${matches.slice(0, 5).join(", ")}${matches.length > 5 ? "..." : ""}`
      : "No spam triggers found",
    penalty,
  };
}

function checkExcessiveCaps(subject: string, body: string): SpamCheckResult {
  const allCapsWords = body.match(CAPS_PATTERN) || [];
  const subjectCaps = subject.match(CAPS_PATTERN) || [];
  const total = allCapsWords.length + subjectCaps.length;
  const threshold = 5;

  if (total > threshold) {
    return {
      check: "Excessive ALL CAPS",
      passed: false,
      details: `Found ${total} ALL CAPS words (threshold: ${threshold})`,
      penalty: Math.min(20, (total - threshold) * 2),
    };
  }

  return {
    check: "Excessive ALL CAPS",
    passed: true,
    details: `Found ${total} ALL CAPS words`,
    penalty: 0,
  };
}

function checkExcessivePunctuation(subject: string, body: string): SpamCheckResult {
  const combined = subject + " " + body;
  const exclamations = (combined.match(/!/g) || []).length;
  const questions = (combined.match(/\?/g) || []).length;
  const dollarSigns = (combined.match(/\$/g) || []).length;

  let penalty = 0;
  if (exclamations > 3) penalty += 5;
  if (questions > 5) penalty += 5;
  if (dollarSigns > 2) penalty += 5;

  return {
    check: "Excessive Punctuation",
    passed: penalty === 0,
    details: `!${exclamations}, ?${questions}, $$${dollarSigns}`,
    penalty,
  };
}

function checkLinkDensity(body: string, html?: string): SpamCheckResult {
  if (!html) {
    return {
      check: "Link Density",
      passed: true,
      details: "No HTML to check",
      penalty: 0,
    };
  }

  // Count links
  const linkMatches = html.match(/<a\s/g) || [];
  const linkCount = linkMatches.length;

  // Estimate text length (rough)
  const textLength = body.length;
  const linkRatio = textLength > 0 ? (linkCount * 100) / textLength : 0;

  // More than 1 link per 200 chars is suspicious
  if (linkRatio > 0.5 || linkCount > 5) {
    return {
      check: "Link Density",
      passed: false,
      details: `${linkCount} links (${linkRatio.toFixed(1)}% ratio)`,
      penalty: Math.min(15, linkCount * 3),
    };
  }

  return {
    check: "Link Density",
    passed: true,
    details: `${linkCount} links (${linkRatio.toFixed(1)}% ratio)`,
    penalty: 0,
  };
}

function checkSubjectLine(subject: string): SpamCheckResult {
  let penalty = 0;
  const checks: string[] = [];

  // Subject length
  if (subject.length > 60) {
    penalty += 5;
    checks.push("too long");
  }

  // Subject ALL CAPS
  if (subject === subject.toUpperCase() && subject.length > 10) {
    penalty += 15;
    checks.push("ALL CAPS");
  }

  // Check for Re: or Fwd: abuse
  if (/^(re:|fwd:|fw:)\s*/i.test(subject)) {
    // This is legitimate for forwarding
  }

  // Subject has spam patterns
  if (/free|guaranteed|win|prize/i.test(subject)) {
    penalty += 10;
    checks.push("spam keywords");
  }

  return {
    check: "Subject Line",
    passed: penalty === 0,
    details: checks.length > 0 ? checks.join(", ") : "Looks good",
    penalty,
  };
}

function checkHtmlQuality(html?: string): SpamCheckResult {
  if (!html) {
    return {
      check: "HTML Quality",
      passed: true,
      details: "Plain text email (safe)",
      penalty: 0,
    };
  }

  let penalty = 0;
  const checks: string[] = [];

  // Check for hidden text (spam technique)
  if (/display:\s*none|visibility:\s*hidden/i.test(html)) {
    penalty += 15;
    checks.push("hidden text");
  }

  // Check for tiny text (spam technique)
  if (/font-size:\s*1px|font-size:\s*0px/i.test(html)) {
    penalty += 15;
    checks.push("tiny text");
  }

  // Check for misaligned text
  if (/<center>/i.test(html)) {
    penalty += 5;
    checks.push("centered");
  }

  // Check for excessive colors
  const colorMatches = html.match(/#[A-F0-9]{6}/gi) || [];
  if (colorMatches.length > 7) {
    penalty += 5;
    checks.push("too many colors");
  }

  return {
    check: "HTML Quality",
    passed: penalty < 10,
    details: checks.length > 0 ? checks.join(", ") : "Looks good",
    penalty,
  };
}

function checkPersonalization(subject: string, body: string): SpamCheckResult {
  // Check if body has personalization variables
  const hasName = /\{\{name\}\}|\{\{firstName\}\}/i.test(body);
  const hasCompany = /\{\{company\}\}|\{\{companyName\}\}/i.test(body);
  const hasCustom = /\{\{[^}]+\}\}/.test(body);

  let score = 0;
  if (!hasName && !hasCompany && !hasCustom) score = 10;
  else if (hasName || hasCompany) score = 0;
  else score = 5;

  return {
    check: "Personalization",
    passed: score < 10,
    details: hasName || hasCompany || hasCustom
      ? "Personalization variables found"
      : "No personalization detected",
    penalty: score,
  };
}

function generateSuggestions(checks: SpamCheckResult[]): string[] {
  const suggestions: string[] = [];

  for (const check of checks) {
    if (!check.passed && check.check === "Spam Trigger Words") {
      suggestions.push("Remove or rephrase trigger words like 'free', 'guaranteed', 'act now'");
    }
    if (!check.passed && check.check === "Excessive ALL CAPS") {
      suggestions.push("Reduce ALL CAPS words - use sentence case instead");
    }
    if (!check.passed && check.check === "Excessive Punctuation") {
      suggestions.push("Reduce exclamation marks and special characters");
    }
    if (!check.passed && check.check === "Link Density") {
      suggestions.push("Remove excess links or add more text content");
    }
    if (!check.passed && check.check === "Subject Line") {
      suggestions.push("Keep subject line under 50 characters, avoid spam words");
    }
    if (!check.passed && check.check === "HTML Quality") {
      suggestions.push("Avoid hidden text, tiny fonts, or excessive colors");
    }
    if (!check.passed && check.check === "Personalization") {
      suggestions.push("Add personalization: {{firstName}}, {{company}}");
    }
  }

  return suggestions;
}

/**
 * Quick spam score check (just returns score).
 * Useful for batch checking.
 */
export function quickSpamScore(subject: string, body: string): number {
  return analyzeSpamScore(subject, body).score;
}
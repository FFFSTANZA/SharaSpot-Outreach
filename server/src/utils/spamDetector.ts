import { SPAM_TRIGGERS } from "../config/data";

export interface SpamAnalysisResult {
  score: number;
  level: "safe" | "warning" | "high_risk";
  triggers: string[];
  metrics: {
    capsRatio: number;
    punctuationDensity: number;
    linkRatio: number;
    linkCount: number;
  };
}

/**
 * Spam Detector — Purposeful content analysis.
 * Uses weighted word matching and systemic style checks.
 */
export function analyzeSpamScore(subject: string, body: string): SpamAnalysisResult {
  const combined = (subject + " " + body).trim();
  const lowerCombined = combined.toLowerCase();
  let score = 0;
  const triggers: string[] = [];

  // 1. Keyword analysis
  for (const [word, weight] of Object.entries(SPAM_TRIGGERS)) {
    if (lowerCombined.includes(word)) {
      triggers.push(word);
      score += weight;
    }
  }

  // 2. ALL CAPS evaluation
  const words = combined.split(/\s+/);
  const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase());
  const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;

  if (capsRatio > 0.2) score += 20;
  if (capsRatio > 0.4) score += 30;

  // 3. Punctuation density
  const specialChars = (combined.match(/[!$?*]/g) || []).length;
  const punctuationDensity = combined.length > 0 ? specialChars / combined.length : 0;

  if (punctuationDensity > 0.05) score += 15;
  if (/[!]{3,}/.test(combined)) score += 10;

  // 4. Outreach-specific checks
  // Link ratio
  const bodyText = body.replace(/<[^>]+>/g, "");
  const linkTextMatches = body.match(/<a[^>]*>(.*?)<\/a>/gi) || [];
  const linkText = linkTextMatches.map(a => a.replace(/<[^>]+>/g, "")).join("");
  const urlMatches = body.match(/\bhttps?:\/\/[^\s<>"']+/gi) || [];
  const linkCount = linkTextMatches.length + urlMatches.length;
  const linkedTextLength = linkText.length + urlMatches.join("").length;
  const linkRatio = bodyText.length > 0 ? linkedTextLength / bodyText.length : 0;
  
  if (linkRatio > 0.4) {
    score += 20;
    triggers.push("high-link-ratio");
  }

  if (linkCount > 2) {
    score += 10 + ((linkCount - 3) * 5);
    triggers.push("too-many-links");
  }
  
  // Image-only check
  const hasImages = /<img[^>]+>/i.test(body);
  if (hasImages && bodyText.trim().length < 50) {
    score += 25;
    triggers.push("image-only");
  }
  
  // HTML layout check
  if (/max-width:\s*600px/i.test(body) && /margin:\s*0\s+auto/i.test(body)) {
    score += 15;
    triggers.push("marketing-template-layout");
  }

  const finalScore = Math.min(100, score);
  const level = finalScore > 60 ? "high_risk" : finalScore > 25 ? "warning" : "safe";

  return {
    score: finalScore,
    level,
    triggers: triggers.slice(0, 5),
    metrics: {
      capsRatio,
      punctuationDensity,
      linkRatio,
      linkCount,
    },
  };
}

/**
 * Simplified spam score — returns only the numeric score.
 */
export function quickSpamScore(subject: string, body: string): number {
  return analyzeSpamScore(subject, body).score;
}

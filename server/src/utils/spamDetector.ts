import { SPAM_TRIGGERS } from "../config/data";

export interface SpamAnalysisResult {
  score: number;
  level: "safe" | "warning" | "high_risk";
  triggers: string[];
  metrics: {
    capsRatio: number;
    punctuationDensity: number;
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

  const finalScore = Math.min(100, score);
  const level = finalScore > 60 ? "high_risk" : finalScore > 25 ? "warning" : "safe";

  return {
    score: finalScore,
    level,
    triggers: triggers.slice(0, 5),
    metrics: {
      capsRatio,
      punctuationDensity,
    },
  };
}

/**
 * Simplified spam score — returns only the numeric score.
 */
export function quickSpamScore(subject: string, body: string): number {
  return analyzeSpamScore(subject, body).score;
}

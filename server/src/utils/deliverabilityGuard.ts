import { analyzeSpamScore, SpamAnalysisResult } from "./spamDetector";

export const INBOX_FIRST_MIN_DELAY_SECONDS = 30;
export const INBOX_FIRST_MAX_HOURLY_PER_SENDER = 40;
export const INBOX_FIRST_WARNING_SCORE = 45;
export const INBOX_FIRST_BLOCK_SCORE = 70;

export interface InboxFirstSettings {
  delaySeconds: number;
  hourlyLimit: number;
  trackOpens: boolean;
  trackClicks: boolean;
}

export interface DeliverabilityAssessment {
  analysis: SpamAnalysisResult;
  blocked: boolean;
  warnings: string[];
}

export function normalizeInboxFirstSettings(input: {
  delaySeconds: number;
  hourlyLimit: number;
  trackOpens?: boolean;
  trackClicks?: boolean;
}): InboxFirstSettings {
  return {
    delaySeconds: Math.max(input.delaySeconds, INBOX_FIRST_MIN_DELAY_SECONDS),
    hourlyLimit: Math.min(
      Math.max(1, input.hourlyLimit),
      INBOX_FIRST_MAX_HOURLY_PER_SENDER,
    ),
    trackOpens: input.trackOpens === true,
    trackClicks: input.trackClicks === true,
  };
}

export function assessDeliverability(
  subject: string,
  plainTextBody: string,
): DeliverabilityAssessment {
  const analysis = analyzeSpamScore(subject, plainTextBody);
  const warnings: string[] = [];

  if (analysis.score >= INBOX_FIRST_WARNING_SCORE) {
    warnings.push(`content score ${analysis.score}`);
  }

  if (analysis.metrics.linkRatio > 0.35) {
    warnings.push("too much linked text");
  }

  if (analysis.metrics.linkCount > 2) {
    warnings.push("too many links");
  }

  if (analysis.metrics.punctuationDensity > 0.04) {
    warnings.push("heavy punctuation");
  }

  if (analysis.triggers.length > 0) {
    warnings.push(`trigger terms: ${analysis.triggers.join(", ")}`);
  }

  return {
    analysis,
    blocked: analysis.score >= INBOX_FIRST_BLOCK_SCORE,
    warnings,
  };
}

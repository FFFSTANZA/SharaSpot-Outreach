import { getRecentCongestionScore } from "./signalCollector";

/**
 * Timing Decision
 * Result of evaluating SMTP congestion
 */
export interface TimingDecision {
  action: "SEND_IMMEDIATELY" | "HOLD_AND_RETRY" | "DELAY_TO_NEXT_WINDOW";
  reason: string;
  suggestedDelayMs: number;
  statusMessage: string;
  congestionScore: number;
}

/**
 * Timing Engine
 * 
 * Evaluates congestion signals to make delivery decisions:
 * - LOW (<150ms): Send immediately
 * - MEDIUM (150-400ms): Hold 30-120s, recheck
 * - HIGH (>400ms): Delay to next window
 */

/**
 * Evaluate timing based on congestion score
 */
export function evaluateTiming(congestionScore: number): TimingDecision {
  if (congestionScore < 150) {
    return {
      action: "SEND_IMMEDIATELY",
      reason: "Low congestion detected",
      suggestedDelayMs: 0,
      statusMessage: "Low congestion detected, sending immediately",
      congestionScore,
    };
  } else if (congestionScore < 400) {
    // Medium congestion: hold for 30-120 seconds
    const holdMs = 30000 + Math.random() * 90000;
    return {
      action: "HOLD_AND_RETRY",
      reason: "Medium congestion, optimizing delivery window",
      suggestedDelayMs: Math.round(holdMs),
      statusMessage: "Optimizing delivery...",
      congestionScore,
    };
  } else {
    // High congestion: delay to next window (5-15 minutes)
    const delayMs = 300000 + Math.random() * 600000;
    return {
      action: "DELAY_TO_NEXT_WINDOW",
      reason: "High congestion detected",
      suggestedDelayMs: Math.round(delayMs),
      statusMessage: "High congestion, queuing for optimal window",
      congestionScore,
    };
  }
}

/**
 * Get optimal send window for a domain
 * Analyzes historical signal logs to find low-congestion periods
 */
export async function getOptimalSendWindow(
  recipientDomain: string
): Promise<{
  hour: number; // 0-23 hour of day
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  confidence: number; // 0-100
}> {
  // Default to typical low-traffic windows
  // Early morning (6-8 AM) and late evening (10 PM - 12 AM) tend to be lower traffic
  // Weekend mornings also typically see less email traffic
  
  // In production, this would analyze historical data
  // For now, return a reasonable default window
  return {
    hour: 7, // 7 AM
    dayOfWeek: 3, // Wednesday (arbitrary - would be calculated)
    confidence: 50,
  };
}

/**
 * Apply micro-timing randomization
 * Adds 500ms-3000ms random delay to appear more human
 */
export function applyMicroJitter(): number {
  const baseMs = 500;
  const rangeMs = 2500;
  return baseMs + Math.round(Math.random() * rangeMs);
}

/**
 * Calculate next available slot
 * Returns delay until the next low-congestion window
 */
export async function calculateOptimalDelay(
  recipientDomain: string,
  baseDelayMs: number = 0
): Promise<number> {
  // Get recent congestion history
  const recentScore = await getRecentCongestionScore(recipientDomain, 2);
  
  const decision = evaluateTiming(recentScore);
  
  // Combine base delay with congestion-based delay
  const totalDelay = baseDelayMs + decision.suggestedDelayMs + applyMicroJitter();
  
  return totalDelay;
}

/**
 * Get status message for current priority state
 */
export function getStatusMessage(
  decision: TimingDecision
): string {
  return decision.statusMessage;
}

/**
 * Determine if we should proceed or wait
 */
export function shouldProceed(decision: TimingDecision): boolean {
  return decision.action === "SEND_IMMEDIATELY";
}

/**
 * Get hold duration for retry
 */
export function getHoldDuration(decision: TimingDecision): number {
  if (decision.action === "HOLD_AND_RETRY") {
    return decision.suggestedDelayMs;
  }
  return 0;
}
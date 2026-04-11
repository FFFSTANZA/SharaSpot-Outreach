/**
 * Priority Retry Policy
 * 
 * Exponential backoff with max retries:
 * - Retry 1: 2 minutes
 * - Retry 2: 5 minutes
 * - Max retries: 2
 */

export const MAX_PRIORITY_RETRIES = 2;

/**
 * Calculate retry delay based on attempt number
 * Uses exponential backoff: 2min → 5min
 */
export function calculateRetryDelay(attemptNumber: number): number {
  const baseDelays = [
    2 * 60 * 1000,  // 2 minutes
    5 * 60 * 1000,  // 5 minutes
  ];

  if (attemptNumber >= baseDelays.length) {
    return baseDelays[baseDelays.length - 1];
  }

  return baseDelays[attemptNumber];
}

/**
 * Should retry based on attempt number
 */
export function shouldRetry(attemptNumber: number): boolean {
  return attemptNumber < MAX_PRIORITY_RETRIES;
}

/**
 * Get max retry count
 */
export function getMaxRetries(): number {
  return MAX_PRIORITY_RETRIES;
}

/**
 * Get retry status message
 */
export function getRetryStatusMessage(attemptNumber: number): string {
  if (attemptNumber === 0) {
    return "First attempt";
  }
  
  const delay = calculateRetryDelay(attemptNumber);
  const delayMinutes = Math.round(delay / 60000);
  
  return `Retry ${attemptNumber}/${MAX_PRIORITY_RETRIES} - retrying in ${delayMinutes} minutes`;
}

/**
 * Calculate total timeout
 * Maximum time to wait before giving up
 */
export function getTotalTimeoutMs(): number {
  // Sum of all retry delays: 2min + 5min = 7 minutes
  // Plus some buffer for the actual send attempts
  return 10 * 60 * 1000;
}
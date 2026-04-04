/**
 * Business Hours Utility
 *
 * Determines whether the current time falls within the configured business
 * hours window for a given timezone. Used by the email worker to decide
 * whether to send an email now or defer it.
 *
 * All time checks use the recipient's local time (via the campaign's
 * configured timezone) so that sends respect the recipient's workday,
 * not the server's UTC clock.
 */

/**
 * Returns the current hour (0-23) in a given IANA timezone.
 * Falls back to UTC if the timezone is invalid.
 */
export function getHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === "hour");
    return parseInt(hourPart?.value ?? "0", 10);
  } catch {
    return new Date().getUTCHours();
  }
}

/**
 * Returns the current day-of-week (0=Sunday, 6=Saturday) in a given timezone.
 */
export function getDayOfWeekInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const dayStr = formatter.format(new Date());
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    return dayMap[dayStr] ?? new Date().getUTCDay();
  } catch {
    return new Date().getUTCDay();
  }
}

/**
 * Checks if the current time is within business hours.
 *
 * @param timezone - IANA timezone string (e.g. "America/New_York")
 * @param startHour - Start of business (0-23), null means no restriction
 * @param endHour - End of business (0-23), null means no restriction
 * @returns { allowed: boolean; reason?: string; retryAt?: Date }
 */
export function isWithinBusinessHours(
  timezone: string,
  startHour: number | null,
  endHour: number | null,
): { allowed: boolean; reason?: string; retryAt?: Date } {
  // No business hours configured — allow send
  if (startHour === null && endHour === null) {
    return { allowed: true };
  }

  const currentHour = getHourInTimezone(timezone);
  const start = startHour ?? 0;
  const end = endHour ?? 23;

  if (currentHour >= start && currentHour < end) {
    return { allowed: true };
  }

  // Calculate when business hours open next
  const now = new Date();
  let retryAt: Date;

  try {
    // Build a date string in the target timezone for today at startHour
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayParts = tzFormatter.formatToParts(now);
    const year = parseInt(todayParts.find((p) => p.type === "year")?.value ?? now.getFullYear().toString(), 10);
    const month = parseInt(todayParts.find((p) => p.type === "month")?.value ?? (now.getMonth() + 1).toString(), 10);
    const day = parseInt(todayParts.find((p) => p.type === "day")?.value ?? now.getDate().toString(), 10);

    // Try today at startHour
    const todayStart = new Date(year, month - 1, day, start, 0, 0, 0);
    // We need to convert this to UTC properly — use a simpler approach
    retryAt = new Date(now.getTime());

    // If we're before startHour, business opens later today
    if (currentHour < start) {
      retryAt.setHours(start, 0, 0, 0);
      // Adjust for timezone offset
      const utcStr = retryAt.toLocaleString("en-US", { timeZone: "UTC" });
      const tzStr = retryAt.toLocaleString("en-US", { timeZone: timezone });
      const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime();
      retryAt = new Date(retryAt.getTime() - offsetMs);
    } else {
      // We're after endHour — business opens tomorrow at startHour
      retryAt.setDate(retryAt.getDate() + 1);
      retryAt.setHours(start, 0, 0, 0);
      const utcStr = retryAt.toLocaleString("en-US", { timeZone: "UTC" });
      const tzStr = retryAt.toLocaleString("en-US", { timeZone: timezone });
      const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime();
      retryAt = new Date(retryAt.getTime() - offsetMs);
    }
  } catch {
    // Fallback: just retry in 1 hour
    retryAt = new Date(now.getTime() + 3600000);
  }

  return {
    allowed: false,
    reason: "outside-business-hours",
    retryAt,
  };
}

/**
 * Calculates the delay (in milliseconds) until business hours open.
 * Returns 0 if already within business hours or no hours are configured.
 */
export function getDelayUntilBusinessHours(
  timezone: string,
  startHour: number | null,
  endHour: number | null,
): number {
  const result = isWithinBusinessHours(timezone, startHour, endHour);
  if (result.allowed || !result.retryAt) return 0;
  return Math.max(0, result.retryAt.getTime() - Date.now());
}

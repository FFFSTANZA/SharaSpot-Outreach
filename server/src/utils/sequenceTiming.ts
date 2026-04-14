import { addHours, addDays, setHours, setMinutes, setSeconds, getDay, startOfDay } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

export interface SendTimeConfig {
  businessHoursOnly?: boolean;
  businessStartHour?: number; // 0-23
  businessEndHour?: number;   // 0-23
  skipWeekends?: boolean;
  sendAtSpecificTime?: string; // "HH:mm"
  timezone?: string;
}

/**
 * Calculates the next valid send time based on configuration and current scheduled time.
 */
export function calculateSendTime(
  baseTime: Date,
  config: SendTimeConfig | null
): Date {
  if (!config) return baseTime;

  let scheduledDate = new Date(baseTime);
  const timezone = config.timezone || "UTC";

  // 1. Handle specific send time if set
  if (config.sendAtSpecificTime) {
    const [hours, minutes] = config.sendAtSpecificTime.split(":").map(Number);
    
    // We want to set it to this time in the target timezone
    const dateStr = formatInTimeZone(scheduledDate, timezone, "yyyy-MM-dd");
    scheduledDate = toDate(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`, { timeZone: timezone });
    
    // If we've already passed this time today, move to tomorrow
    if (scheduledDate < baseTime) {
      scheduledDate = addDays(scheduledDate, 1);
    }
  }

  // Loop to find the next valid day (considering weekends and business hours)
  // Max 10 iterations to prevent infinite loop
  for (let i = 0; i < 10; i++) {
    const dayOfWeek = getDay(scheduledDate); // 0 (Sun) to 6 (Sat)
    
    // 2. Handle weekends
    if (config.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      scheduledDate = addDays(startOfDay(scheduledDate), 1);
      continue;
    }

    // 3. Handle business hours
    if (config.businessHoursOnly) {
      const startHour = config.businessStartHour ?? 9;
      const endHour = config.businessEndHour ?? 17;
      
      const currentHour = parseInt(formatInTimeZone(scheduledDate, timezone, "H"));
      
      if (currentHour < startHour) {
        // Too early, move to start of business hours today
        const dateStr = formatInTimeZone(scheduledDate, timezone, "yyyy-MM-dd");
        scheduledDate = toDate(`${dateStr}T${startHour.toString().padStart(2, '0')}:00:00`, { timeZone: timezone });
      } else if (currentHour >= endHour) {
        // Too late, move to start of business hours tomorrow
        const dateStr = formatInTimeZone(scheduledDate, timezone, "yyyy-MM-dd");
        const tomorrow = addDays(toDate(dateStr, { timeZone: timezone }), 1);
        const tomorrowStr = formatInTimeZone(tomorrow, timezone, "yyyy-MM-dd");
        scheduledDate = toDate(`${tomorrowStr}T${startHour.toString().padStart(2, '0')}:00:00`, { timeZone: timezone });
        continue;
      }
    }
    
    // If we reached here, the day is valid and time is within business hours (if applicable)
    break;
  }

  return scheduledDate;
}

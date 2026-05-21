/**
 * Calendly Integration Service
 * 
 * Features:
 * 1. Generate meeting booking links with pre-filled data
 * 2. Generate embeddable Calendly button/link for templates
 * 3. Webhook endpoint handling for meeting booked
 * 
 * NO API key needed for basic links - Calendly supports URL parameters.
 * For webhook notifications, you set the webhook URL in Calendly dashboard.
 */

export interface CalendlyPreFill {
  name?: string;
  email?: string;
  company?: string;
  customAnswers?: Record<string, string>;
}

export interface CalendlyConfig {
  username: string; // Your Calendly username or event type URI
  eventType?: string; // Specific event type slug
  baseUrl?: string;
}

/**
 * Default Calendly base URL.
 */
export const CALENDLY_BASE_URL = "https://calendly.com";

/**
 * Generates a Calendly booking URL with pre-filled participant data.
 * 
 * Usage in email:
 * - As a link: "Book a time: {calendlyLink}"
 * - As button: [Book Meeting](calendlyLink)
 * 
 * @param config - Calendly configuration
 * @param preFill - Participant data to pre-fill
 * @returns Full Calendly URL with parameters
 */
export function generateCalendlyUrl(
  config: CalendlyConfig,
  preFill: CalendlyPreFill
): string {
  const baseUrl = config.baseUrl || CALENDLY_BASE_URL;
  const eventPart = config.eventType ? `/${config.eventType}` : "";
  
  // Build Calendly URL with pre-fill parameters
  const params = new URLSearchParams();
  
  if (preFill.name) params.append("name", preFill.name);
  if (preFill.email) params.append("email", preFill.email);
  if (preFill.company) params.append("a1", preFill.company); // a1 = custom answer #1
  
  // Custom answers (Calendly allows a1-a10)
  if (preFill.customAnswers) {
    for (const [key, value] of Object.entries(preFill.customAnswers)) {
      const keyNum = parseInt(key.replace("a", ""));
      if (keyNum >= 1 && keyNum <= 10) {
        params.append(`a${keyNum}`, value);
      }
    }
  }
  
  const paramString = params.toString();
  return `${baseUrl}/${config.username}${eventPart}${paramString ? "?" + paramString : ""}`;
}

/**
 * Verifies a Calendly username/link is valid.
 * Validates URL format (without API token) for simplicity.
 */
export function verifyCalendlyLink(
  calendlyUrl: string,
  _apiToken?: string
): { valid: boolean; username?: string; eventType?: string } {
  try {
    // Extract username and event type from URL
    const cleaned = calendlyUrl
      .replace("https://", "")
      .replace("http://", "")
      .replace("calendly.com/", "")
      .replace("www.calendly.com/", "");
    
    const parts = cleaned.split("/");
    const username = parts[0];
    const eventType = parts[1];
    
    if (!username) {
      return { valid: false };
    }
    
    // Validate URL format (alphanumeric and dashes only)
    const isValidFormat = /^[a-zA-Z0-9-]+$/.test(username);
    return {
      valid: isValidFormat,
      username,
      eventType,
    };
  } catch {
    return { valid: false };
  }
}

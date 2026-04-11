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
 * Generates a Calendly button HTML for email templates.
 * Returns both the button and a fallback text link.
 */
export function generateCalendlyButton(
  config: CalendlyConfig,
  preFill: CalendlyPreFill,
  options: {
    buttonText?: string;
    buttonStyle?: "button" | "link";
    color?: string;
    textColor?: string;
  } = {}
): { html: string; textLink: string } {
  const url = generateCalendlyUrl(config, preFill);
  const buttonText = options.buttonText || "Book a time";
  const bgColor = options.color || "#00A63E"; // Brand green default
  const txtColor = options.textColor || "#FFFFFF";
  
  // HTML button (for HTML emails)
  const buttonHtml = `
<a href="${url}" 
   style="display:inline-block;padding:12px 24px;background-color:${bgColor};color:${txtColor};text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
  ${buttonText}
</a>`.trim();
  
  // Plain text fallback
  const textLink = `${buttonText}: ${url}`;
  
  return {
    html: buttonHtml,
    textLink,
  };
}

/**
 * Generates a Calendly inline embed code.
 * For use on web pages or sophisticated email clients.
 */
export function generateCalendlyInlineEmbed(
  config: CalendlyConfig,
  options: {
    prefill?: CalendlyPreFill;
    hideEventTypeDetails?: boolean;
    hideLandingPageDetails?: boolean;
    backgroundColor?: string;
    textColor?: string;
    primaryColor?: string;
  } = {}
): string {
  const baseUrl = config.baseUrl || CALENDLY_BASE_URL;
  const eventUrl = config.eventType 
    ? `${baseUrl}/${config.username}/${config.eventType}`
    : `${baseUrl}/${config.username}`;
  
  // Build pre-fill data
  const params: string[] = [];
  if (options.prefill?.name) params.push(`name=${encodeURIComponent(options.prefill.name)}`);
  if (options.prefill?.email) params.push(`email=${encodeURIComponent(options.prefill.email)}`);
  if (options.prefill?.company) params.push(`a1=${encodeURIComponent(options.prefill.company)}`);
  
  // Build data Attributes for Calendly embed
  const attrs = [
    `data-url="${eventUrl}"`,
    options.hideEventTypeDetails ? 'data-hide_event_type_details="1"' : '',
    options.hideLandingPageDetails ? 'data-hide_landing_page_details="1"' : '',
    options.backgroundColor ? `data-background_color="${options.backgroundColor}"` : '',
    options.textColor ? `data-text_color="${options.textColor}"` : '',
    options.primaryColor ? `data-primary_color="${options.primaryColor}"` : '',
  ].filter(Boolean).join(" ");
  
  return `<!-- Calendly inline widget -->
<div class="calendly-inline-widget" ${attrs}></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>`;
}

/**
 * Generates Calendly popup trigger code.
 * Opens Calendly in a popup when button is clicked.
 */
export function generateCalendlyPopup(
  config: CalendlyConfig,
  buttonOptions: {
    text?: string;
    color?: string;
    textColor?: string;
  } = {}
): { buttonHtml: string; script: string } {
  const baseUrl = config.baseUrl || CALENDLY_BASE_URL;
  const eventUrl = config.eventType 
    ? `${baseUrl}/${config.username}/${config.eventType}`
    : `${baseUrl}/${config.username}`;
  
  const btnText = buttonOptions.text || "Book a Meeting";
  const bgColor = buttonOptions.color || "#00A63E";
  const txtColor = buttonOptions.textColor || "#FFFFFF";
  
  const buttonHtml = `
<button type="button" 
        onclick="Calendly.initPopupWidget({url: '${eventUrl}'});return false;"
        style="padding:12px 24px;background-color:${bgColor};color:${txtColor};border:none;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer;">
  ${btnText}
</button>`.trim();
  
  const script = `
<!-- Calendly script -->
<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>`.trim();
  
  return { buttonHtml, script };
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

/**
 * Webhook payload types (when Calendly notifies of booking).
 */
export interface CalendlyWebhookPayload {
  event: "invitee.created" | "invitee.canceled";
  payload: {
    event: string;
    invitee: {
      uri: string;
      email: string;
      name: string;
      status: string;
      questions_and_answers: Array<{
        question: string;
        answer: string;
      }>;
      cancellations?: Array<{
        reason: string;
      }>;
    };
    scheduling_link: {
      uri: string;
      name: string;
      owner: string;
      owner_type: string;
    };
    questions_and_answers: Array<{
      question: string;
      answer: string;
    }>;
    tracking: {
      utm_campaign?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_content?: string;
      utm_term?: string;
    };
  };
}

/**
 * Parses Calendly webhook payload.
 */
export function parseCalendlyWebhook(payload: CalendlyWebhookPayload): {
  type: "booked" | "canceled";
  invitee: {
    email: string;
    name: string;
  };
  eventName?: string;
  customAnswers: Record<string, string>;
} {
  const { event, payload: data } = payload;
  
  if (event === "invitee.canceled") {
    return {
      type: "canceled",
      invitee: {
        email: data.invitee.email,
        name: data.invitee.name,
      },
      eventName: data.scheduling_link?.name,
      customAnswers: {},
    };
  }
  
  // Parse custom answers
  const customAnswers: Record<string, string> = {};
  for (const qa of data.questions_and_answers || []) {
    customAnswers[qa.question] = qa.answer;
  }
  
  return {
    type: "booked",
    invitee: {
      email: data.invitee.email,
      name: data.invitee.name,
    },
    eventName: data.scheduling_link?.name,
    customAnswers,
  };
}
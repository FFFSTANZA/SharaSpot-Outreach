/**
 * Email Preprocessor — transforms outgoing email HTML to add tracking.
 *
 * 1. Tracking pixel injection: appends a 1x1 transparent image that records opens.
 * 2. Link rewriting: rewrites <a href> URLs to route through the tracking endpoint.
 *
 * Both transformations are skipped when the corresponding campaign flag is false.
 */

export interface PreprocessOptions {
  emailJobId: string;
  trackingBaseUrl: string;
  trackOpens: boolean;
  trackClicks: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  campaignId?: string;
}

function extractUtmParams(href: string): { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string } {
  const url = new URL(href);
  return {
    utmSource: url.searchParams.get("utm_source") || undefined,
    utmMedium: url.searchParams.get("utm_medium") || undefined,
    utmCampaign: url.searchParams.get("utm_campaign") || undefined,
    utmContent: url.searchParams.get("utm_content") || undefined,
    utmTerm: url.searchParams.get("utm_term") || undefined,
  };
}

function buildTrackingUrl(options: PreprocessOptions, originalUrl: string, utmParams?: ReturnType<typeof extractUtmParams>): string {
  const params = new URLSearchParams();
  params.set("url", originalUrl);
  
  const utmSource = utmParams?.utmSource || options.utmSource;
  const utmMedium = utmParams?.utmMedium || options.utmMedium;
  const utmCampaign = utmParams?.utmCampaign || options.utmCampaign;
  
  if (utmSource) params.set("utm_source", utmSource);
  if (utmMedium) params.set("utm_medium", utmMedium);
  if (utmCampaign) params.set("utm_campaign", utmCampaign);
  if (utmParams?.utmContent) params.set("utm_content", utmParams.utmContent);
  if (utmParams?.utmTerm) params.set("utm_term", utmParams.utmTerm);
  if (options.campaignId) params.set("campaign", options.campaignId);
  
  return `${options.trackingBaseUrl}/track/click/${options.emailJobId}?${params.toString()}`;
}

/**
 * 1x1 transparent GIF as a base64 data URI fallback.
 * The actual pixel is served by the /track/open endpoint.
 */
const TRACKING_PIXEL_TEMPLATE = (src: string) =>
  `<img src="${src}" width="1" height="1" style="display:block!important;width:1px!important;height:1px!important;border:0!important;margin:0!important;padding:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;position:absolute!important" alt="" />`;

/**
 * Regex to match <a href="..."> tags.
 * Captures the full tag with attributes, the href value, and preserves the rest.
 * Uses a non-greedy match on the href value to handle both single and double quotes.
 */
const LINK_REGEX = /<a\s([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>/gi;

/**
 * Preprocesses email HTML to inject tracking pixel and rewrite links.
 *
 * - If trackOpens is true, appends a tracking pixel before </body> or at the end.
 * - If trackClicks is true, rewrites all <a href> URLs (except mailto: and #) to
 *   route through /track/click/:emailJobId?url=<encoded>.
 */
export function preprocessEmailHtml(
  html: string,
  options: PreprocessOptions
): string {
  let result = html;

  // Link rewriting (must happen before pixel injection to avoid rewriting the pixel's URL)
  if (options.trackClicks) {
    result = rewriteLinks(result, options);
  }

  // Pixel injection
  if (options.trackOpens) {
    result = injectTrackingPixel(result, options);
  }

  return result;
}

function injectTrackingPixel(html: string, options: PreprocessOptions): string {
  const pixelUrl = `${options.trackingBaseUrl}/track/open/${options.emailJobId}`;
  const pixelTag = TRACKING_PIXEL_TEMPLATE(pixelUrl);

  // Insert before </body> if present, otherwise append to end
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}</body>`);
  }
  return html + pixelTag;
}

function rewriteLinks(html: string, options: PreprocessOptions): string {
  return html.replace(LINK_REGEX, (match, before, href, after) => {
    if (href.startsWith("mailto:")) return match;
    if (href.startsWith("#")) return match;
    if (href.includes("/track/click/")) return match;
    if (href.startsWith("javascript:")) return match;
    
    const utmParams = extractUtmParams(href);
    const trackingUrl = buildTrackingUrl(options, href, utmParams);
    return `<a ${before} href="${trackingUrl}" ${after}>`;
  });
}

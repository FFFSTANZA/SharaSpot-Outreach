import { FREE_EMAIL_DOMAINS } from "../config/data";
import { validateEmail, ValidationResult } from "./emailValidator";

const TECH_SIGNATURES: Array<{ name: string; test: (html: string, source: string) => boolean }> = [
  { name: "Next.js", test: (html, source) => /__NEXT_DATA__|_next\//i.test(source) },
  { name: "React", test: (html, source) => /data-reactroot|react-dom|react(?:\.min)?\.js/i.test(source) },
  { name: "Vue", test: (_html, source) => /__VUE__|vue(?:\.runtime)?(?:\.global)?(?:\.prod)?\.js/i.test(source) },
  { name: "Angular", test: (html, source) => /ng-version|angular(?:\.min)?\.js/i.test(source) },
  { name: "WordPress", test: (_html, source) => /wp-content|wp-includes|wp-json/i.test(source) },
  { name: "Shopify", test: (_html, source) => /cdn\.shopify\.com|shopify\.theme|x-shopify/i.test(source) },
  { name: "Webflow", test: (_html, source) => /webflow\.js|webflow\.css/i.test(source) },
  { name: "Wix", test: (_html, source) => /wixstatic\.com|_wixCssrules/i.test(source) },
  { name: "Squarespace", test: (_html, source) => /static\.squarespace\.com|squarespace-cdn/i.test(source) },
  { name: "HubSpot", test: (_html, source) => /js\.hs-scripts\.com|hsforms\.net/i.test(source) },
  { name: "Intercom", test: (_html, source) => /intercom\.io|window\.intercomSettings/i.test(source) },
  { name: "Stripe", test: (_html, source) => /js\.stripe\.com|stripe-button/i.test(source) },
  { name: "Tailwind CSS", test: (_html, source) => /tailwind(?:\.min)?\.css|tailwindcss/i.test(source) },
  { name: "Google Analytics", test: (_html, source) => /googletagmanager\.com|gtag\(|ga\(/i.test(source) },
];

const DEFAULT_PATHS = ["", "/contact", "/contact-us", "/about", "/about-us", "/team", "/company", "/leadership"];
const USER_AGENT = "Mozilla/5.0 (compatible; SharaSpotEnricher/1.0; +https://sharaspot.app)";

export interface ContactEnrichmentInput {
  email?: string | null;
  website?: string | null;
  companyDomain?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ContactEnrichmentResult {
  email: string | null;
  website: string | null;
  companyDomain: string | null;
  company: string | null;
  phone: string | null;
  techStack: string[];
  validation: ValidationResult | null;
  discoveredEmails: string[];
  lastEnrichedAt: Date | null;
}

type FetchedPage = { url: string; html: string; contentType: string | null };
type JsonRecord = Record<string, unknown>;

export function normalizeEmailAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export function normalizeWebsite(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let trimmed = value.trim();
  if (!trimmed) return null;
  // Strip repeated protocol prefixes (safety for corrupted data)
  while (/^https?:\/\/https?:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^https?:\/\//i, "");
  }
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeDomain(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(withoutProtocol) ? withoutProtocol : null;
}

export function extractEmailsFromHtml(html: string): string[] {
  if (!html) return [];

  const decoded = html
    .replace(/&commat;|&#64;|&#x40;/gi, "@")
    .replace(/&period;|&#46;|&#x2e;/gi, ".")
    .replace(/&nbsp;|&#160;/gi, " ");

  const normalized = decoded
    .replace(/\s*(?:\[at\]|\(at\)|\{at\}|\sat\s)\s*/gi, "@")
    .replace(/\s*(?:\[dot\]|\(dot\)|\{dot\}|\sdot\s)\s*/gi, ".");

  const results = new Set<string>();
  const add = (candidate: string) => {
    const clean = candidate.toLowerCase().trim().replace(/^mailto:/, "").replace(/["'<>),;]+$/g, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return;
    if (/\.(png|jpe?g|gif|svg|webp|ico|css|js)$/i.test(clean)) return;
    if (clean.includes("..") || clean.length > 254) return;
    results.add(clean);
  };

  for (const match of decoded.matchAll(/mailto:([^"'\s?#]+)/gi)) {
    try {
      add(decodeURIComponent(match[1]));
    } catch {
      add(match[1]);
    }
  }

  for (const match of normalized.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
    add(match[0]);
  }

  return Array.from(results);
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&commat;|&#64;|&#x40;/gi, "@")
    .replace(/&period;|&#46;|&#x2e;/gi, ".")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetaContent(html: string, attributePattern: RegExp): string | null {
  for (const match of html.matchAll(/<meta\b[^>]*?(?:property|name)=(["'])(.*?)\1[^>]*?content=(["'])(.*?)\3[^>]*?>/gi)) {
    if (attributePattern.test(match[2])) {
      return match[4].trim() || null;
    }
  }
  for (const match of html.matchAll(/<meta\b[^>]*?content=(["'])(.*?)\1[^>]*?(?:property|name)=(["'])(.*?)\3[^>]*?>/gi)) {
    if (attributePattern.test(match[4])) {
      return match[2].trim() || null;
    }
  }
  return null;
}

function extractJsonLdRecords(html: string): JsonRecord[] {
  const records: JsonRecord[] = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const queue = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of queue) {
        if (item && typeof item === "object") {
          records.push(item as JsonRecord);
        }
      }
    } catch {
      continue;
    }
  }
  return records;
}

function getStringFromJsonRecord(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeCompanyName(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/\s*[|\-:•].*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 2) return null;
  if (/^(home|contact|about|welcome)$/i.test(cleaned)) return null;
  return cleaned.slice(0, 80);
}

function inferCompanyFromDomain(domain: string | null): string | null {
  if (!domain) return null;
  const base = domain.replace(/^www\./, "").split(".")[0];
  if (!base) return null;
  return base
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || null;
}

export function extractCompanyNameFromHtml(html: string, companyDomain?: string | null): string | null {
  for (const record of extractJsonLdRecords(html)) {
    const normalized = normalizeCompanyName(getStringFromJsonRecord(record, ["name", "legalName", "alternateName"]));
    if (normalized) return normalized;
  }

  const candidates = [
    extractMetaContent(html, /^og:site_name$/i),
    extractMetaContent(html, /^(application-name|apple-mobile-web-app-title)$/i),
    extractMetaContent(html, /^twitter:title$/i),
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCompanyName(candidate ? stripHtml(candidate) : null);
    if (normalized) return normalized;
  }

  return inferCompanyFromDomain(companyDomain ?? null);
}

function normalizePhoneCandidate(value: string): string | null {
  const cleaned = value.replace(/[^\d+()\-\.\s]/g, "").replace(/\s+/g, " ").trim();
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return cleaned;
}

export function extractPhoneFromHtml(html: string): string | null {
  for (const record of extractJsonLdRecords(html)) {
    const normalized = normalizePhoneCandidate(getStringFromJsonRecord(record, ["telephone", "phone"]) ?? "");
    if (normalized) return normalized;
  }

  for (const match of html.matchAll(/tel:([^"'#?<]+)/gi)) {
    const normalized = normalizePhoneCandidate(decodeURIComponent(match[1].trim()));
    if (normalized) return normalized;
  }

  const text = stripHtml(html);
  for (const match of text.matchAll(/(?:\+?\d[\d().\-\s]{6,}\d)/g)) {
    const normalized = normalizePhoneCandidate(match[0]);
    if (normalized) return normalized;
  }

  return null;
}

function buildGeneratedEmailCandidates(companyDomain: string | null, firstName?: string | null, lastName?: string | null): string[] {
  if (!companyDomain) return [];

  const first = firstName?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const last = lastName?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (!first && !last) return [];

  const patterns = new Set<string>();
  const add = (local: string) => {
    if (!local || local.length < 2) return;
    patterns.add(`${local}@${companyDomain}`);
  };

  add(first);
  add(last);
  add(`${first}.${last}`);
  add(`${first}${last}`);
  add(`${first}${last.charAt(0)}`);
  add(`${first.charAt(0)}${last}`);
  add(`${first.charAt(0)}.${last}`);
  add(`${last}.${first}`);

  return Array.from(patterns);
}

export function detectTechStack(html: string, url: string, contentType?: string | null): string[] {
  const source = `${url}\n${contentType ?? ""}\n${html}`;
  return TECH_SIGNATURES.filter((signature) => signature.test(html, source)).map((signature) => signature.name);
}

function buildCandidateUrls(website: string | null, companyDomain: string | null): string[] {
  const base = website ?? (companyDomain ? `https://${companyDomain}` : null);
  if (!base) return [];
  const urls = new Set<string>();
  for (const path of DEFAULT_PATHS) {
    try {
      urls.add(new URL(path || "/", base).toString().replace(/\/$/, ""));
    } catch {
      continue;
    }
  }
  return Array.from(urls).slice(0, 5);
}

async function fetchPage(url: string): Promise<FetchedPage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("text/html")) return null;
    return {
      url: response.url,
      html: await response.text(),
      contentType,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRelevantPages(website: string | null, companyDomain: string | null): Promise<FetchedPage[]> {
  const pages = await Promise.all(buildCandidateUrls(website, companyDomain).map(fetchPage));
  const deduped = new Map<string, FetchedPage>();
  for (const page of pages) {
    if (!page) continue;
    if (!deduped.has(page.url)) deduped.set(page.url, page);
  }
  return Array.from(deduped.values());
}

function scoreEmailCandidate(candidate: string, preferredDomain: string | null, firstName?: string | null, lastName?: string | null): number {
  const [local, domain] = candidate.split("@");
  let score = 0;
  if (preferredDomain && domain === preferredDomain) score += 40;
  if (preferredDomain && domain.endsWith(`.${preferredDomain}`)) score += 25;
  if (!FREE_EMAIL_DOMAINS.has(domain)) score += 20;
  if (!/^(info|hello|contact|support|sales|admin|team)$/i.test(local)) score += 10;

  const first = firstName?.trim().toLowerCase();
  const last = lastName?.trim().toLowerCase();
  if (first && local.includes(first)) score += 8;
  if (last && local.includes(last)) score += 8;
  return score;
}

async function selectBestEmailCandidate(
  candidates: string[],
  preferredDomain: string | null,
  firstName?: string | null,
  lastName?: string | null
): Promise<{ email: string | null; validation: ValidationResult | null }> {
  if (!candidates.length) return { email: null, validation: null };

  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreEmailCandidate(candidate, preferredDomain, firstName, lastName) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const validations = await Promise.all(ranked.map(async ({ candidate, score }) => ({
    candidate,
    score,
    validation: await validateEmail(candidate),
  })));

  const best = validations.sort((a, b) => {
    if (Number(b.validation.valid) !== Number(a.validation.valid)) {
      return Number(b.validation.valid) - Number(a.validation.valid);
    }
    if (a.validation.riskScore !== b.validation.riskScore) {
      return a.validation.riskScore - b.validation.riskScore;
    }
    return b.score - a.score;
  })[0];

  return { email: best?.candidate ?? null, validation: best?.validation ?? null };
}

export async function enrichContactInput(input: ContactEnrichmentInput): Promise<ContactEnrichmentResult> {
  const providedEmail = normalizeEmailAddress(input.email);
  const website = normalizeWebsite(input.website);
  const companyDomain = normalizeDomain(input.companyDomain) ?? (website ? new URL(website).hostname.replace(/^www\./, "") : null);

  let validation: ValidationResult | null = providedEmail ? await validateEmail(providedEmail) : null;
  const pages = website || companyDomain ? await fetchRelevantPages(website, companyDomain) : [];
  const discoveredEmails = Array.from(new Set(pages.flatMap((page) => extractEmailsFromHtml(page.html))));
  const generatedEmailCandidates = buildGeneratedEmailCandidates(companyDomain, input.firstName, input.lastName);
  const company = pages.map((page) => extractCompanyNameFromHtml(page.html, companyDomain)).find(Boolean) ?? inferCompanyFromDomain(companyDomain);
  const phone = pages.map((page) => extractPhoneFromHtml(page.html)).find(Boolean) ?? null;

  let resolvedEmail = providedEmail;
  const candidatePool = discoveredEmails.length > 0 ? discoveredEmails : generatedEmailCandidates;
  if (!resolvedEmail && candidatePool.length) {
    const picked = await selectBestEmailCandidate(candidatePool, companyDomain, input.firstName, input.lastName);
    resolvedEmail = picked.email;
    validation = picked.validation;
  }

  const techStack = Array.from(new Set(
    pages.flatMap((page) => detectTechStack(page.html, page.url, page.contentType))
  )).slice(0, 12);

  return {
    email: resolvedEmail,
    website,
    companyDomain,
    company,
    phone,
    techStack,
    validation,
    discoveredEmails,
    lastEnrichedAt: website || companyDomain ? new Date() : null,
  };
}

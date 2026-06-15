import { FREE_EMAIL_DOMAINS } from "../config/data";
import {
  detectTechStack,
  extractCompanyNameFromHtml,
  extractEmailsFromHtml,
  extractPhoneFromHtml,
  normalizeDomain,
  normalizeEmailAddress,
  normalizeWebsite,
} from "./contactEnrichment";

const DEFAULT_PATHS = ["", "/contact", "/contact-us", "/about", "/about-us", "/team", "/company", "/leadership", "/sitemap.xml"];
const USER_AGENT = "Mozilla/5.0 (compatible; SharaSpotCompanyEnricher/1.0; +https://sharaspot.app)";
const COMPANY_EMAIL_LOCALS = new Set(["hello", "info", "contact", "sales", "team", "support", "partnerships"]);

type FetchedPage = { url: string; body: string; contentType: string | null };

export interface CompanyEnrichmentInput {
  name?: string | null;
  website?: string | null;
  domain?: string | null;
  email?: string | null;
}

export interface CompanyEnrichmentResult {
  name: string | null;
  website: string | null;
  domain: string;
  primaryEmail: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  techStack: string[];
  lastEnrichedAt: Date;
}

type SocialLinks = {
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
};

const normalizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
};

export function deriveCompanyDomain(input: { website?: string | null; domain?: string | null; email?: string | null }): string | null {
  const directDomain = normalizeDomain(input.domain);
  if (directDomain) return directDomain;

  const website = normalizeWebsite(input.website);
  if (website) {
    return new URL(website).hostname.replace(/^www\./, "");
  }

  const email = normalizeEmailAddress(input.email);
  if (!email) return null;
  const emailDomain = email.split("@")[1] ?? null;
  if (!emailDomain || FREE_EMAIL_DOMAINS.has(emailDomain)) return null;
  return emailDomain;
}

function buildCandidateUrls(website: string | null, domain: string): string[] {
  const base = website ?? `https://${domain}`;
  const urls = new Set<string>();
  for (const path of DEFAULT_PATHS) {
    try {
      urls.add(new URL(path || "/", base).toString().replace(/\/$/, ""));
    } catch {
      continue;
    }
  }
  return Array.from(urls).slice(0, 6);
}

async function fetchPage(url: string): Promise<FetchedPage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,application/xml,text/xml" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("text/html") && !contentType.includes("text/xml") && !contentType.includes("application/xml") && !contentType.includes("application/xhtml")) return null;
    return {
      url: response.url,
      body: await response.text(),
      contentType,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRelevantPages(website: string | null, domain: string): Promise<FetchedPage[]> {
  const pages = await Promise.all(buildCandidateUrls(website, domain).map(fetchPage));
  const deduped = new Map<string, FetchedPage>();
  for (const page of pages) {
    if (!page) continue;
    if (!deduped.has(page.url)) deduped.set(page.url, page);
  }
  return Array.from(deduped.values());
}

function pickCompanyEmail(candidates: string[], preferredDomain: string): string | null {
  const ranked = Array.from(new Set(candidates))
    .map((candidate) => {
      const [local = "", domain = ""] = candidate.split("@");
      let score = 0;
      if (domain === preferredDomain) score += 40;
      if (!FREE_EMAIL_DOMAINS.has(domain)) score += 20;
      if (COMPANY_EMAIL_LOCALS.has(local)) score += 25;
      if (/^(noreply|no-reply|privacy|security)$/i.test(local)) score -= 30;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.candidate ?? null;
}

function extractSocialLinksFromHtml(html: string): SocialLinks {
  const links = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((match) => match[1]);
  const pick = (pattern: RegExp) => links.find((link) => pattern.test(link)) ?? null;

  return {
    linkedinUrl: pick(/linkedin\.com\/(company|in)\//i),
    twitterUrl: pick(/(?:twitter|x)\.com\//i),
    githubUrl: pick(/github\.com\//i),
    facebookUrl: pick(/facebook\.com\//i),
    instagramUrl: pick(/instagram\.com\//i),
  };
}

export async function enrichCompanyProfile(input: CompanyEnrichmentInput): Promise<CompanyEnrichmentResult> {
  const domain = deriveCompanyDomain(input);
  if (!domain) {
    throw new Error("A business website or work email is required");
  }

  const directWebsite = normalizeWebsite(input.website) ?? `https://${domain}`;
  const pages = await fetchRelevantPages(directWebsite, domain);
  const publicHtmlPages = pages.filter((page) => !(page.contentType ?? "").includes("xml"));
  const discoveredEmails = publicHtmlPages.flatMap((page) => extractEmailsFromHtml(page.body));
  const mergedSocials = publicHtmlPages.reduce<SocialLinks>((acc, page) => {
    const next = extractSocialLinksFromHtml(page.body);
    return {
      linkedinUrl: acc.linkedinUrl ?? next.linkedinUrl,
      twitterUrl: acc.twitterUrl ?? next.twitterUrl,
      githubUrl: acc.githubUrl ?? next.githubUrl,
      facebookUrl: acc.facebookUrl ?? next.facebookUrl,
      instagramUrl: acc.instagramUrl ?? next.instagramUrl,
    };
  }, {
    linkedinUrl: null,
    twitterUrl: null,
    githubUrl: null,
    facebookUrl: null,
    instagramUrl: null,
  });

  const techStack = Array.from(new Set(publicHtmlPages.flatMap((page) => detectTechStack(page.body, page.url, page.contentType)))).slice(0, 12);

  return {
    name: normalizeOptionalText(input.name)
      ?? publicHtmlPages.map((page) => extractCompanyNameFromHtml(page.body, domain)).find(Boolean)
      ?? domain.replace(/^www\./, "").split(".")[0].replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    website: directWebsite,
    domain,
    primaryEmail: pickCompanyEmail(discoveredEmails, domain),
    phone: publicHtmlPages.map((page) => extractPhoneFromHtml(page.body)).find(Boolean) ?? null,
    linkedinUrl: mergedSocials.linkedinUrl,
    twitterUrl: mergedSocials.twitterUrl,
    githubUrl: mergedSocials.githubUrl,
    facebookUrl: mergedSocials.facebookUrl,
    instagramUrl: mergedSocials.instagramUrl,
    techStack,
    lastEnrichedAt: new Date(),
  };
}

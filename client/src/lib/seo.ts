import type { Metadata } from "next";
import { BRAND_CONFIG } from "@/lib/config";

export const SITE_NAME = BRAND_CONFIG.name;
export const COMPANY_NAME = BRAND_CONFIG.company;
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || BRAND_CONFIG.url;
export const DEFAULT_OG_IMAGE = "/og-image.jpg";
export const ALT_OG_IMAGE = "/og-image.png";

export function absoluteUrl(path = "/") {
  return path.startsWith("http") ? path : new URL(path, SITE_URL).toString();
}

export function absoluteOgImageUrl(path = DEFAULT_OG_IMAGE) {
  return absoluteUrl(path);
}

export const OG_IMAGES = [
  { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} open graph preview` },
  { url: ALT_OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} open graph preview (alt)` },
];

export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const canonical = path === "/" ? SITE_URL : absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE, ALT_OG_IMAGE],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildSearchActionJsonLd(targetUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${targetUrl}/#website`,
    "url": targetUrl,
    "name": SITE_NAME,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${targetUrl}/faq?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildSoftwareFeatureList() {
  return [
    "Multi-sender email rotation",
    "Adaptive sender warmup",
    "Automated follow-up sequences",
    "Open and click tracking",
    "Reply detection and auto-stop",
    "Email validation and risk scoring",
    "Partner relationship management (PRM)",
    "Call tracking and disposition logging",
    "MCP integrations for AI agent access",
    "Team collaboration with role-based access",
    "Priority delivery infrastructure",
    "Campaign analytics and reporting",
    "Human-like sending schedules",
    "Encrypted credential storage",
  ];
}

export function buildSameAsList() {
  return [
    "https://sharaspot.in",
  ];
}

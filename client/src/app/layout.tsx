import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { BRAND_CONFIG } from "@/lib/config";
import {
  COMPANY_NAME,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildSameAsList,
  buildSoftwareFeatureList,
  absoluteOgImageUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "SharaSpot | Cold Outreach Platform for Deliverability, Replies, and Pipeline",
    template: "%s | SharaSpot",
  },
  description:
    "SharaSpot helps founders, sales teams, recruiters, and partnership teams run disciplined cold outreach with sender rotation, warmup, reply detection, analytics, and delivery controls.",
  keywords: [
    "cold outreach platform",
    "cold email software",
    "cold email deliverability",
    "sales outreach platform",
    "founder outreach tool",
    "investor outreach software",
    "recruiting outreach software",
    "partner outreach CRM",
    "email warmup tool",
    "sender rotation software",
    "reply detection software",
    "inbox placement tool",
    "SharaSpot",
    COMPANY_NAME,
  ],
  authors: [{ name: COMPANY_NAME, url: SITE_URL }],
  creator: COMPANY_NAME,
  publisher: COMPANY_NAME,
  formatDetection: {
    email: false,
    telephone: false,
  },
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "SharaSpot | Cold Outreach Platform for Deliverability, Replies, and Pipeline",
    description:
      "Cold outreach software for founders, sales teams, recruiters, and partner teams. Warm up senders, rotate volume safely, stop follow-ups on replies, and protect deliverability.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SharaSpot cold outreach platform preview",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SharaSpot cold outreach platform preview (alt)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SharaSpot | Cold Outreach Platform for Deliverability, Replies, and Pipeline",
    description:
      "Run cold outreach with sender rotation, warmup, reply detection, analytics, and delivery controls.",
    images: ["/og-image.jpg", "/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/sharaspot-icon.png", type: "image/png", sizes: "128x128" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/sharaspot-icon.png",
    shortcut: "/favicon.svg",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
  other: {
    "apple-mobile-web-app-title": SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFFFFF",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": COMPANY_NAME,
      "url": SITE_URL,
      "brand": {
        "@type": "Brand",
        "name": SITE_NAME
      },
      "logo": {
        "@type": "ImageObject",
        "url": absoluteUrl("/sharaspot-icon.png"),
        "width": "128",
        "height": "128"
      },
      "sameAs": buildSameAsList(),
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@folonite.in",
        "url": BRAND_CONFIG.supportUrl
      }
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": SITE_NAME,
      "publisher": { "@id": `${SITE_URL}/#organization` },
      "description": BRAND_CONFIG.description,
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${SITE_URL}/faq?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      "name": SITE_NAME,
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Email Outreach & Deliverability",
      "operatingSystem": "Web",
      "url": SITE_URL,
      "description": "Cold outreach platform with sender rotation, warmup, reply detection, analytics, partner relationship management, and delivery controls.",
      "brand": {
        "@type": "Brand",
        "name": SITE_NAME
      },
      "offers": {
        "@type": "Offer",
        "price": BRAND_CONFIG.pricing.global.amount.toFixed(2),
        "priceCurrency": BRAND_CONFIG.pricing.global.currency,
        "description": `${BRAND_CONFIG.pricing.trialDays}-day free trial, then ${BRAND_CONFIG.pricing.global.symbol}${BRAND_CONFIG.pricing.global.amount}/month`
      },
      "featureList": buildSoftwareFeatureList(),
      "screenshot": {
        "@type": "ImageObject",
        "url": absoluteOgImageUrl(),
        "width": "1200",
        "height": "630"
      }
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      "url": SITE_URL,
      "name": SITE_NAME,
      "isPartOf": {
        "@id": `${SITE_URL}/#website`
      },
      "about": {
        "@id": `${SITE_URL}/#software`
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": absoluteUrl("/og-image.jpg")
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", ".speakable"]
      }
    }
  ]
};

import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body className="antialiased h-full">
        <GoogleAnalytics gaId={GA_ID} />
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

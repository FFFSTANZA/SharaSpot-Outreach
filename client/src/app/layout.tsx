import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { BRAND_CONFIG } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://sharaspot.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SharaSpot — Cold Outreach That Gets Replies",
    template: "%s | SharaSpot",
  },
  description: "SharaSpot helps founders reach investors, sales teams close more deals, and recruiters hire top talent — by making sure your cold emails land in the primary inbox, not spam. Set up in minutes, no technical knowledge needed.",
  keywords: [
    "cold email for founders",
    "investor outreach tool",
    "cold email that lands in inbox",
    "outreach for sales teams",
    "recruiting cold email tool",
    "cold email reply rate",
    "email outreach for startups",
    "how to reach investors by email",
    "cold email not going to spam",
    "personal outreach tool",
    "SharaSpot",
    "Folonite",
    "B2B outreach automation",
    "email deliverability tool",
    "SaaS outreach platform",
  ],
  authors: [{ name: "Folonite", url: siteUrl }],
  creator: "Folonite",
  publisher: "Folonite",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "SharaSpot",
    title: "SharaSpot — Cold Outreach That Gets Replies",
    description: "High-stakes cold outreach for founders and sales teams. Ensure your emails land in the primary inbox with multi-sender rotation and AI follow-ups.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SharaSpot - High-Performance Outreach System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SharaSpot — Cold Outreach That Gets Replies",
    description: "Ensure your cold emails land in the primary inbox. SharaSpot uses multi-sender rotation and AI to maximize your outreach results.",
    images: ["/og-image.jpg"],
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
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "Folonite",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/favicon.svg`,
        "width": "512",
        "height": "512"
      }
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "SharaSpot",
      "publisher": { "@id": `${siteUrl}/#organization` },
      "inLanguage": "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      "name": "SharaSpot",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "url": siteUrl,
      "description": "Professional cold outreach platform with multi-sender rotation and AI follow-up generation.",
      "offers": {
        "@type": "Offer",
        "price": BRAND_CONFIG.pricing.global.amount.toFixed(2),
        "priceCurrency": BRAND_CONFIG.pricing.global.currency
      }
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the AI Follow-up Generator work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SharaSpot uses a proprietary 'Context Locking' engine that analyzes your original email to identify unique value anchors and crafts follow-ups that feel like a direct continuation of your first message."
          }
        },
        {
          "@type": "Question",
          "name": "Can I use multiple email accounts?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. SharaSpot is built for scale. You can connect multiple SMTP accounts and our multi-sender rotation engine will automatically distribute your campaign volume across all of them."
          }
        }
      ]
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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

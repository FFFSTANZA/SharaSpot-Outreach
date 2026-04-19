import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

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
  description: "SharaSpot helps founders reach investors, sales teams close more deals, and recruiters hire top talent — by making sure your cold emails land in the inbox, not spam. Set up in minutes, no technical knowledge needed.",
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
    description: "SharaSpot helps founders, sales teams, and recruiters reach the right people by email — and actually get replied to.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SharaSpot - Personal Outreach System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SharaSpot — Cold Outreach That Gets Replies",
    description: "SharaSpot helps founders, sales teams, and recruiters reach the right people by email — and actually get replied to.",
    images: ["/og-image.png"],
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
    google: "your-google-site-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>

      </body>
    </html>
  );
}

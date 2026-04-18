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

const siteUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://sharaspot.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SharaSpot — Personal Outreach System That Gets Replies",
    template: "%s | SharaSpot",
  },
  description: "SharaSpot sends emails like a human, not a bot. Multi-sender rotation, automatic warmup, human-like scheduling, reply detection, and real-time tracking. Send cold outreach at scale without landing in spam.",
  keywords: [
    "cold email outreach",
    "email automation",
    "multi-sender email",
    "email warmup",
    "reply tracking",
    "personal outreach",
    "cold email tool",
    "email sequencing",
    "deliverability optimization",
    "sales outreach",
    "job seeker email tool",
    "founder outreach",
    "recruiter email tool",
    "SharaSpot",
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
    title: "SharaSpot — Personal Outreach System That Gets Replies",
    description: "SharaSpot sends emails like a human, not a bot. Multi-sender rotation, automatic warmup, human-like scheduling, reply detection, and real-time tracking.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SharaSpot — Personal Outreach System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SharaSpot — Personal Outreach System That Gets Replies",
    description: "SharaSpot sends emails like a human, not a bot. Multi-sender rotation, automatic warmup, human-like scheduling, reply detection, and real-time tracking.",
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Warmup, Throttling & Sequences",
  description: "Answers to common questions about SharaSpot email warmup, rate limiting, multi-sender rotation, follow-up sequences, tracking, security, and campaign management.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

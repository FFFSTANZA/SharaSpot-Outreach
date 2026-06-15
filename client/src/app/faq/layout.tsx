import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Cold Outreach FAQ: Deliverability, Warmup, Sender Rotation, and Replies",
  description:
    "Answers to common SharaSpot questions about cold email deliverability, warmup, rate limits, multi-sender rotation, follow-up sequences, tracking, security, and campaign workflows.",
  path: "/faq",
  keywords: [
    "cold email faq",
    "deliverability faq",
    "email warmup questions",
    "sender rotation faq",
    "reply detection software",
    "cold outreach help",
  ],
});

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

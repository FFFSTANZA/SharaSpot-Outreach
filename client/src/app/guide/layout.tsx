import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Cold Outreach Guide: Sender Setup, Campaigns, Sequences, and Deliverability",
  description:
    "Learn how to use SharaSpot for sender setup, multi-sender campaigns, warmup, sequences, validation, analytics, inbox workflows, PRM, and best practices for cold outreach.",
  path: "/guide",
  keywords: [
    "cold outreach guide",
    "cold email guide",
    "sender setup guide",
    "email deliverability guide",
    "outbound sequence guide",
    "sales outreach best practices",
  ],
});

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

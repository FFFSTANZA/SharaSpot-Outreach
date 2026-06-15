import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Priority Delivery Research and Inbox Placement Benchmarks",
  description:
    "Review SharaSpot Priority delivery positioning and benchmark data comparing standard email delivery with stricter inbox-first routing controls.",
  path: "/priority",
  keywords: [
    "inbox placement benchmark",
    "priority email delivery",
    "cold email deliverability research",
    "email infrastructure benchmark",
    "outreach performance comparison",
  ],
});

export default function PriorityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

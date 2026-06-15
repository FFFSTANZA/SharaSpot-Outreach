import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact SharaSpot Support and Sales",
  description:
    "Contact the SharaSpot team for support, questions, onboarding help, bug reports, and product feedback.",
  path: "/contact",
  keywords: [
    "contact sharaspot",
    "sharaspot support",
    "outreach software support",
    "cold email onboarding help",
  ],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

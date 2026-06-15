import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Read the SharaSpot terms of service for access, usage, billing, and platform responsibilities.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

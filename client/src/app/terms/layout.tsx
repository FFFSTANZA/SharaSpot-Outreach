import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Simple, Fair Terms",
  description: "SharaSpot terms of service. Clear, fair terms for using our personal outreach platform. No legalese, just clarity.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

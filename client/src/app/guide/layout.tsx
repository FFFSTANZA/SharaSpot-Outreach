import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Guide — Multi-Sender Campaigns, Throttling & Sequences",
  description: "Learn how to use SharaSpot for multi-sender campaigns, smart throttling, follow-up sequences, template variables, email tracking, and best practices for cold outreach.",
  alternates: {
    canonical: "/guide",
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

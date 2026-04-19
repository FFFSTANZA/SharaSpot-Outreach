import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priority Mail Benchmark - SharaSpot Research",
  description: "Independent benchmark testing comparing standard email delivery vs SharaSpot Priority Mail. See delivery speed, inbox rates, and performance data.",
  alternates: {
    canonical: "/priority",
  },
};

export default function PriorityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Your Data, Your Control",
  description: "SharaSpot privacy policy. Learn what data we collect, how we protect your credentials with AES-256 encryption, and what we never do with your information.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

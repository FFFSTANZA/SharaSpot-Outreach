import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Support & Help",
  description: "Get in touch with the SharaSpot team. Email us at support@folonite.in or use our support form for questions, bug reports, or feature requests.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Secure Google Authentication",
  description: "Sign in to SharaSpot with your Google account. Secure OAuth authentication with no passwords stored on our servers.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

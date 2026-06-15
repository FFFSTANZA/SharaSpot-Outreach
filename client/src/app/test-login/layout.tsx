import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Test Login",
  description: "Internal test login route.",
  path: "/test-login",
  noIndex: true,
});

export default function TestLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

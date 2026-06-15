import type { Metadata } from "next";
import { DashboardClientLayout } from "./DashboardClientLayout";

export const metadata: Metadata = {
  title: "Dashboard | SharaSpot",
  description: "Manage your campaigns, senders, templates, and outreach workflows.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}

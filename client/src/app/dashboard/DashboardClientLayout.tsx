"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "./Sidebar";

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="dashboard-content flex h-full bg-[#F8FAFC] font-sans overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col min-w-0 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 lg:ml-52">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

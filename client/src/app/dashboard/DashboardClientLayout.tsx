"use client";

import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "./Sidebar";

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="dashboard-content flex h-full bg-[#F8FAFC] font-sans overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col min-w-0 overflow-y-auto px-1.5 py-1.5 sm:px-2 sm:py-2 lg:ml-52">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

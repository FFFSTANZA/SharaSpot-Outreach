"use client";

import { useRef, useCallback, useState } from "react";
import { SidebarItem } from "@/components/SidebarItem";
import { SidebarProps } from "@/types";
import { useSidebar } from "@/hooks/useSidebar";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { X, Megaphone, LogOut, FileText, Plus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { logout } from "@/lib/apis";
import { cn } from "@/lib/utils";

export function Sidebar({ currentLabel, setLabel, onItemClick, items }: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isOpen, close } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);

  const handleNavClick = useCallback(
    (item: (typeof items)[number]) => {
      if (pathname !== "/dashboard") {
        const queryParams = new URLSearchParams();
        if (item.label === "Scheduled") queryParams.set("status", "PENDING");
        if (item.label === "Sent") queryParams.set("status", "SENT");
        if (item.label === "Starred") queryParams.set("starred", "true");

        const qs = queryParams.toString();
        router.push(qs ? `/dashboard?${qs}` : "/dashboard");
        close();
        return;
      }

      setLabel(item.label);
      onItemClick?.(item.label);
      close();
    },
    [pathname, router, setLabel, onItemClick, close],
  );

  const handleCompose = useCallback(() => {
    router.push("/dashboard/compose");
    close();
  }, [router, close]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Best-effort — proceed with client-side cleanup even if API fails
    }
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientX - touchStartX.current < -50) close();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo Group */}
      <div className="mb-5 pt-1 shrink-0">
        <Link href="/dashboard" onClick={close} className="inline-block hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </Link>
      </div>

      {/* Compose Button - Brand CTA with glow */}
      <div className="mb-5 shrink-0">
        <button
          onClick={handleCompose}
          className="
            w-full flex items-center gap-2 px-4 py-2.5
            bg-[#FF6D01] text-white rounded-lg
            text-sm font-medium shadow-sm
            hover:bg-[#E56200] hover:shadow-[0_0_16px_rgba(255,109,1,0.25)]
            active:scale-[0.99] active:duration-75
            transition-all duration-150
          "
        >
          <Plus className="h-4 w-4" />
          <span>Compose</span>
        </button>
      </div>

      {/* Primary Context Navigation - Gmail style with brand colors */}
      <nav className="space-y-0.5 shrink-0">
        <div className="px-3 mb-1.5">
          <p className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest leading-none">Inbox</p>
        </div>
        {items.map((item, idx) => (
          <SidebarItem
            key={idx}
            {...item}
            isActive={currentLabel === item.label}
            onClick={() => handleNavClick(item)}
          />
        ))}
      </nav>

      {/* System Actions & Footer */}
      <div className="mt-auto pt-4 border-t border-[#E8EAED] space-y-0.5 shrink-0">
        <div className="px-3 mb-1.5">
          <p className="text-[10px] font-bold text-[#9AA0A6] uppercase tracking-widest leading-none">Management</p>
        </div>

        <Link
          href="/dashboard/campaigns"
          onClick={close}
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 border-l-4",
            pathname === "/dashboard/campaigns"
              ? "bg-[#E8F5E9] text-[#037A31] border-l-[#00A63E]"
              : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#1A1D21] border-l-transparent"
          )}
        >
          <Megaphone className={cn("h-4 w-4", pathname === "/dashboard/campaigns" ? "text-[#00A63E]" : "text-[#9AA0A6] group-hover:text-[#5F6368]")} />
          <span>Campaigns</span>
        </Link>

        <Link
          href="/dashboard/templates"
          onClick={close}
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 border-l-4",
            pathname === "/dashboard/templates"
              ? "bg-[#E8F5E9] text-[#037A31] border-l-[#00A63E]"
              : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#1A1D21] border-l-transparent"
          )}
        >
          <FileText className={cn("h-4 w-4", pathname === "/dashboard/templates" ? "text-[#00A63E]" : "text-[#9AA0A6] group-hover:text-[#5F6368]")} />
          <span>Templates</span>
        </Link>

        {/* Removed Analytics link from here as per user request */}


        <div className="pt-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group flex items-center justify-between px-3 py-2.5 text-[#9AA0A6] hover:bg-[#FCE8E7] hover:text-[#C5221F] rounded-md cursor-pointer transition-all duration-150 w-full disabled:opacity-50 active:scale-[0.99] border-l-4 border-l-transparent"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View - Gmail/Outlook style */}
      <aside className="hidden lg:flex h-full w-[256px] flex-col bg-white border-r border-[#E8EAED] p-4">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
            onClick={close}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-hidden="true"
          />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white p-4 shadow-xl flex flex-col"
            role="dialog"
            aria-label="Navigation sidebar"
          >
            <button
              onClick={close}
              className="absolute right-3 top-3 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5F6368] hover:text-[#1A1D21] hover:bg-[#F1F3F4] transition-all"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
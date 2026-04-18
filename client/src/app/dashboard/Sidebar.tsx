"use client";

import { useRef, useCallback, useState } from "react";
import { SidebarItem } from "@/components/SidebarItem";
import { SidebarProps } from "@/types";
import { useSidebar } from "@/hooks/useSidebar";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { X, Megaphone, LogOut, FileText, Plus, Settings, CreditCard } from "lucide-react";
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
      <div className="mb-8 pt-1 shrink-0">
        <Link href="/dashboard" onClick={close} className="inline-block hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </Link>
      </div>

      {/* Compose Button - Brand CTA with glow */}
      <div className="mb-8 shrink-0">
        <button
          onClick={handleCompose}
          className="
            w-full flex items-center justify-center gap-3 h-12
            bg-brand text-white rounded-2xl
            text-sm font-black shadow-lg shadow-brand/20
            hover:bg-brand-hover hover:scale-[1.02]
            active:scale-[0.98]
            transition-all duration-300
          "
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          <span>COMPOSE</span>
        </button>
      </div>

      {/* Primary Context Navigation - Modern style with brand colors */}
      <nav className="space-y-1 shrink-0">
        <div className="px-4 mb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Inbox</p>
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
      <div className="mt-auto pt-8 border-t border-gray-50 space-y-1 shrink-0">
        <div className="px-4 mb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Management</p>
        </div>

        <Link
          href="/dashboard/campaigns"
          onClick={close}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
            pathname === "/dashboard/campaigns"
              ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Megaphone className={cn("h-4 w-4", pathname === "/dashboard/campaigns" ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
          <span>Campaigns</span>
        </Link>

        <Link
          href="/dashboard/templates"
          onClick={close}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
            pathname === "/dashboard/templates"
              ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <FileText className={cn("h-4 w-4", pathname === "/dashboard/templates" ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
          <span>Templates</span>
        </Link>

        <Link
          href="/dashboard/settings/billing"
          onClick={close}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
            pathname === "/dashboard/settings/billing"
              ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <CreditCard className={cn("h-4 w-4", pathname === "/dashboard/settings/billing" ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
          <span>Billing</span>
        </Link>

        <Link
          href="/dashboard/settings"
          onClick={close}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
            pathname === "/dashboard/settings"
              ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Settings className={cn("h-4 w-4", pathname === "/dashboard/settings" ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
          <span>Settings</span>
        </Link>

        <div className="pt-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group flex items-center justify-between px-4 py-3 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-2xl cursor-pointer transition-all duration-300 w-full disabled:opacity-50 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-bold">{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <aside className="hidden lg:flex h-full w-[260px] flex-col bg-white border-r border-gray-100 p-5 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={close}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-hidden="true"
          />
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white p-5 shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Navigation sidebar"
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 h-10 w-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
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

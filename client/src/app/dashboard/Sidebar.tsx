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
import Button from "@/components/Button";

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
    } catch { }
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  const menuGroups = [
    {
      title: "Navigation",
      links: items.map(item => ({
        ...item,
        isActive: currentLabel === item.label,
        onClick: () => handleNavClick(item)
      }))
    },
    {
      title: "Outreach",
      links: [
        { label: "Campaigns", href: "/dashboard/campaigns", icon: <Megaphone size={18} /> },
        { label: "Templates", href: "/dashboard/templates", icon: <FileText size={18} /> },
      ]
    },
    {
      title: "Account",
      links: [
        { label: "Billing", href: "/dashboard/settings/billing", icon: <CreditCard size={18} /> },
        { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="mb-10 px-2 shrink-0">
        <Link href="/dashboard" onClick={close} className="inline-block hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </Link>
      </div>

      <div className="mb-8 shrink-0">
        <Button
          className="w-full justify-start gap-3 h-11"
          onClick={handleCompose}
        >
          <Plus size={18} />
          <span>New Campaign</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 mb-3 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.links.map((link: any, idx) => {
                const isActive = link.isActive !== undefined ? link.isActive : pathname === link.href;

                if (link.onClick) {
                  return (
                    <button
                      key={link.label}
                      onClick={link.onClick}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                        isActive
                          ? "bg-brand/10 text-brand"
                          : "text-text-secondary hover:bg-interactive-hover hover:text-text-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(isActive ? "text-brand" : "text-text-muted group-hover:text-text-secondary")}>
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                      </div>
                      {link.count !== undefined && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          isActive ? "bg-brand text-white" : "bg-border-light text-text-muted"
                        )}>
                          {link.count}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                      isActive
                        ? "bg-brand/10 text-brand"
                        : "text-text-secondary hover:bg-interactive-hover hover:text-text-primary"
                    )}
                  >
                    <span className={cn(isActive ? "text-brand" : "text-text-muted group-hover:text-text-secondary")}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border-light shrink-0">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-semibold text-text-muted hover:text-error-text hover:bg-error-bg transition-colors disabled:opacity-50"
        >
          <LogOut size={18} />
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex h-full w-[264px] flex-col bg-white border-r border-border-light p-6">
        {sidebarContent}
      </aside>

      {isOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-text-primary/10 backdrop-blur-sm animate-in" onClick={close} />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white p-6 border-r border-border-light shadow-2xl animate-up">
            <button
              onClick={close}
              className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-primary"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
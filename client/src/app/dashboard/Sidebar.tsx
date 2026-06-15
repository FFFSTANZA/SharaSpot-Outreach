"use client";

import { useCallback, useState, useEffect, useRef, Suspense } from "react";

import { useSidebar } from "@/hooks/useSidebar";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  X,
  LogOut,
  FileText,
  Plus,
  Settings,
  Users,
  Mail,
  Inbox,
  Clock,
  Send,
  Pause,
  CheckCircle,
  PhoneCall,
  ChevronDown,
  Building2,
  PlusCircle,
  ServerCog,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { logout, getUnreadCount, getSenders, getOrganizations, switchOrganization, createOrganization } from "@/lib/apis";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import type { OrganizationSummary } from "@/types";

function SidebarFallback() {
  return (
    <>
      <aside className="hidden fixed left-0 top-0 z-30 h-dvh w-52 flex-col border-r border-border-light bg-white px-2.5 py-3 lg:flex overflow-y-auto" />
      <div className="fixed inset-0 z-40 bg-text-primary/10 backdrop-blur-sm lg:hidden" />
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarInner />
    </Suspense>
  );
}

function SidebarInner() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const { isOpen, close } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const statusParam = searchParams?.get("status") || null;

  useEffect(() => {
    getSenders().then(senders => {
      if (senders[0]?.id) {
        getUnreadCount(senders[0].id).then(res => {
          setUnreadCount(res.unreadCount || 0);
        }).catch(() => { });
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    getOrganizations().then(setOrgs).catch(() => { });
  }, [user?.activeOrganizationId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOrg = orgs.find(o => o.id === user?.activeOrganizationId);
  const userOwnsOrg = orgs.some(o => o.role === "OWNER");

  const handleSwitchOrg = async (orgId: string) => {
    try {
      const { accessToken } = await switchOrganization(orgId);
      localStorage.setItem("accessToken", accessToken);
      await refreshUser();
      setOrgs(prev => prev.map(o => ({ ...o, isActive: o.id === orgId })));
      setOrgDropdownOpen(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to switch org:", e);
    }
  };

  const handleCreateOrg = async () => {
    const name = window.prompt(
      "Enter organization name:\n\nNote: A subscription is required to access SharaSpot in your own workspace."
    );
    if (!name?.trim()) return;
    try {
      const org = await createOrganization(name.trim());
      if (org.accessToken) {
        localStorage.setItem("accessToken", org.accessToken);
      }
      await refreshUser();
      setOrgDropdownOpen(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to create org:", e);
    }
  };

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
      title: "Campaigns",
      links: [
        { label: "All Campaigns", href: "/dashboard", icon: <LayoutDashboard size={15} />, isActive: pathname === "/dashboard" && !statusParam },
        { label: "Scheduled", href: "/dashboard?status=SCHEDULED", icon: <Clock size={15} />, isActive: statusParam === "SCHEDULED" },
        { label: "Sending", href: "/dashboard?status=SENDING", icon: <Send size={15} />, isActive: statusParam === "SENDING" },
        { label: "Paused", href: "/dashboard?status=PAUSED", icon: <Pause size={15} />, isActive: statusParam === "PAUSED" },
        { label: "Completed", href: "/dashboard?status=COMPLETED", icon: <CheckCircle size={15} />, isActive: statusParam === "COMPLETED" },
      ],
    },
    {
      title: "Daily work",
      links: [
        { label: "Inbox", href: "/dashboard/inbox", icon: <Inbox size={15} />, count: unreadCount },
        { label: "Contacts", href: "/dashboard/prm", icon: <Users size={15} /> },
        { label: "Calls", href: "/dashboard/calls", icon: <PhoneCall size={15} /> },
      ],
    },
    {
      title: "Improve",
      links: [
        { label: "Templates", href: "/dashboard/templates", icon: <FileText size={15} /> },
        { label: "Accounts", href: "/dashboard/senders", icon: <Mail size={15} /> },
      ],
    },
    {
      title: "Workspace",
      links: [
        { label: "Team", href: "/dashboard/team", icon: <Users size={15} /> },
        { label: "MCP", href: "/dashboard/mcp", icon: <ServerCog size={15} /> },
        { label: "Settings", href: "/dashboard/settings", icon: <Settings size={15} /> },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <Link href="/dashboard" onClick={close} className="mb-3 inline-block transition-opacity hover:opacity-80">
          <Logo size="sm" />
        </Link>

        <div className="relative" ref={orgDropdownRef}>
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-2 rounded-md px-2 text-xs font-medium transition-all",
              orgDropdownOpen
                ? "bg-brand-light text-brand"
                : "text-text-secondary hover:bg-[#F0F1F3] hover:text-text-primary"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={13} className="shrink-0 text-text-muted" />
              <span className="truncate">{currentOrg?.name || (orgs.length > 0 ? "Select Organization" : "Personal")}</span>
            </div>
            <ChevronDown size={12} className={`shrink-0 transition-transform ${orgDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {orgDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-border-light bg-white py-0.5 shadow-premium-sm">
              {orgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs transition-colors",
                    org.id === user?.activeOrganizationId
                      ? "bg-brand/10 text-brand font-semibold"
                      : "text-text-secondary hover:bg-[#F0F1F3] hover:text-text-primary"
                  )}
                >
                  <Building2 size={12} className="shrink-0" />
                  <span className="truncate">{org.name}</span>
                </button>
              ))}
              {!userOwnsOrg && (
                <>
                  <div className="border-t border-border-light my-1" />
                  <button
                    onClick={handleCreateOrg}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-text-secondary hover:bg-[#F0F1F3] hover:text-text-primary transition-colors"
                  >
                    <PlusCircle size={12} className="shrink-0" />
                    <span>Create Organization</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 mb-3">
        <Button
          className="h-8 w-full justify-start gap-2 rounded-md px-2.5 text-xs font-semibold"
          onClick={handleCompose}
        >
          <Plus size={14} />
          <span>New Campaign</span>
        </Button>
      </div>

      <div className="flex-1 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.links.map((link: { label: string; href?: string; onClick?: () => void; isActive?: boolean; icon?: React.ReactNode; count?: number }) => {
                const isActive = link.isActive !== undefined
                  ? link.isActive
                  : (link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href!));

                const linkClasses = cn(
                  "group relative flex h-8 items-center justify-between rounded-md px-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-brand/[0.07] text-brand"
                    : "text-text-secondary hover:bg-[#F0F1F3] hover:text-text-primary"
                );

                const iconClasses = cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-brand" : "text-text-muted group-hover:text-text-secondary"
                );

                const content = (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
                    )}
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={iconClasses}>{link.icon}</span>
                      <span className="truncate">{link.label}</span>
                    </span>
                    {link.count !== undefined && link.count > 0 && (
                      <span className={cn(
                        "min-w-[18px] rounded px-1 py-0.5 text-center text-[9px] font-bold leading-tight",
                        isActive ? "bg-brand/15 text-brand" : "bg-[#F0F1F3] text-text-muted"
                      )}>
                        {link.count}
                      </span>
                    )}
                  </>
                );

                if (link.onClick) {
                  return (
                    <button key={link.label} onClick={link.onClick} className={linkClasses}>
                      {content}
                    </button>
                  );
                }

                return (
                  <Link key={link.label} href={link.href!} onClick={close} className={linkClasses}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 shrink-0 border-t border-border-light pt-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-error-bg hover:text-error-text disabled:opacity-50"
        >
          <LogOut size={13} />
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden fixed left-0 top-0 z-30 h-dvh w-52 flex-col border-r border-border-light bg-white px-2.5 py-3 lg:flex overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sidebarContent}
      </aside>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-text-primary/10 backdrop-blur-sm animate-in lg:hidden" onClick={close} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(280px,calc(100vw-1rem))] border-r border-border-light bg-white p-3 shadow-premium-lg animate-up lg:hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={close}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-primary"
            >
              <X size={14} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./Topbar";
import { EmailList } from "./EmailList";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getSenders, toggleEmailStar, getDashboardStats, DashboardStats } from "@/lib/apis";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import type { SenderResponse } from "@/types";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import FilterPanel from "@/components/FilterPanel";
import FilterSummaryBar from "@/components/FilterSummaryBar";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Send,
  Clock,
  Star,
  TrendingUp,
  Mail,
  AlertCircle,
  BarChart3,
  CheckCircle,
} from "lucide-react";

const EMAIL_STATUS_OPTIONS = ["PENDING", "SENDING", "SENT", "FAILED", "CANCELLED"];

/**
 * AnalyticsCard - Professional metric display.
 */
function AnalyticsCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = "brand",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border-light p-5 shadow-premium-sm hover:border-brand/20 transition-all hover:shadow-premium-md">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-background group">
          <Icon className={`h-5 w-5 text-${color}`} />
        </div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.1em]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-text-primary tracking-tighter">{value}</div>
      {subValue && (
        <div className="text-xs font-semibold text-text-muted mt-2 border-t border-border-light pt-2">
          {subValue}
        </div>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null);

  const {
    filters, results, total, isLoading, error,
    setQuery, setFilter, setFilters, clearFilter, clearAllFilters, refresh,
    activeFilterCount,
  } = useSearchFilters({ endpoint: "emails" });

  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();

  const isSubscriptionSuccess = searchParams?.get("subscription") === "success";

  useEffect(() => {
    if (isSubscriptionSuccess) {
      refreshUser();
    }
  }, [isSubscriptionSuccess, refreshUser]);

  useEffect(() => {
    getSenders().then(setSenders).catch((err) => {
      console.error("[Dashboard] Failed to load senders:", err);
    });
  }, []);

  // Sync label with filters using useEffect instead of direct render update
  const [currentLabel, setCurrentLabel] = useState("All");

  useEffect(() => {
    const nextLabel = filters.starred === "true" ? "Starred"
      : filters.status === "PENDING" ? "Scheduled"
        : filters.status === "SENT" ? "Sent"
          : !filters.status && !filters.starred ? "All"
            : "Custom";
    setCurrentLabel(nextLabel);
  }, [filters.status, filters.starred]);

  const handleSidebarItemClick = useCallback((itemLabel: string) => {
    if (itemLabel === "Starred") {
      setFilters({ status: "", starred: "true" });
    } else {
      const statusMap: Record<string, string> = {
        All: "",
        Scheduled: "PENDING",
        Sent: "SENT",
      };
      setFilters({ starred: "", status: statusMap[itemLabel] ?? "" });
    }
  }, [setFilters]);

  useEffect(() => {
    const fetchGlobalStats = () => {
      getDashboardStats()
        .then(setGlobalStats)
        .catch(err => console.error("[Dashboard] Stats error:", err));
    };

    fetchGlobalStats();

    // Polling only for stats, not the email list - prevents UI blinking
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchGlobalStats();
      }
    }, 30_000);

    return () => clearInterval(pollInterval);
  }, []); // Only run once on mount

  const emailItems = useMemo(() => (results as any[]).map((r: any) => ({
    email: r,
    campaign: r.campaign,
    searchQuery: filters.q,
  })), [results, filters.q]);

  const handleToggleStar = useCallback(async (emailId: string) => {
    try {
      await toggleEmailStar(emailId);
      refresh();
    } catch { }
  }, [refresh]);

  const stats = useMemo(() => {
    // Note: These are client-side stats based on visible results.
    // In a production app, the backend should return aggregated stats for the user context.
    const sent = results.filter((r: any) => r.status === "SENT").length;
    const failed = results.filter((r: any) => r.status === "FAILED").length;
    const pending = results.filter((r: any) => r.status === "PENDING").length;
    const replied = results.filter((r: any) => r.isReplied).length;

    const totalAttempted = sent + failed;
    const efficiency = totalAttempted > 0 ? Math.round((sent / totalAttempted) * 100) : 100;
    const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : "0";

    return { sent, failed, pending, replied, efficiency, replyRate };
  }, [results]);

  return (
    <AuthGuard>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-background font-sans">
            <Sidebar
              currentLabel={currentLabel}
              setLabel={setCurrentLabel}
              onItemClick={handleSidebarItemClick}
              profile={{
                name: user?.name ?? "Outreach Pro",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
              items={[
                { label: "All", count: total, icon: <Inbox size={18} /> },
                { label: "Starred", icon: <Star size={18} /> },
                { label: "Scheduled", icon: <Clock size={18} /> },
                { label: "Sent", icon: <Send size={18} /> },
              ]}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
              <div className="bg-white rounded-2xl border border-border-light shadow-premium-lg flex flex-col grow overflow-hidden">
                <TopBar
                  initialValue={filters.q}
                  onSearch={setQuery}
                  onRefresh={refresh}
                  isRefreshing={isLoading}
                  filterSlot={
                    <FilterPanel
                      isOpen={isFilterOpen}
                      onToggle={() => setIsFilterOpen(!isFilterOpen)}
                      onClose={() => setIsFilterOpen(false)}
                      filters={filters}
                      onFilterChange={(key, value) => setFilter(key as any, value)}
                      onClearAll={clearAllFilters}
                      activeFilterCount={activeFilterCount}
                      senders={senders}
                      statusOptions={EMAIL_STATUS_OPTIONS}
                      showDateField
                    />
                  }
                />

                <FilterSummaryBar
                  filters={filters}
                  onRemoveFilter={(key) => clearFilter(key)}
                  onClearAll={clearAllFilters}
                  senders={senders}
                />

                <div className="flex-1 flex flex-col min-h-0">
                  {isLoading && results.length === 0 ? (
                    <InlineLoader message="Synchronizing your campaigns..." />
                  ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <div className="p-4 bg-error-bg rounded-full">
                        <AlertCircle className="h-8 w-8 text-error-text" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-text-primary">{error}</p>
                        <button onClick={refresh} className="text-sm text-brand hover:underline mt-1 font-semibold">Try Protocol Refresh</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Integrated Analytics Strip */}
                      <div className="px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-background/30 border-b border-border-light">
                        <AnalyticsCard
                          icon={Mail}
                          label="Global Outreach"
                          value={globalStats?.total ?? stats.sent + stats.pending}
                          subValue={`${globalStats?.pending ?? stats.pending} in queue`}
                        />
                        <AnalyticsCard
                          icon={CheckCircle}
                          label="Delivery Success"
                          value={globalStats?.sent ?? stats.sent}
                          subValue={`${globalStats?.failed ?? stats.failed} blocked`}
                          color="brand"
                        />
                        <AnalyticsCard
                          icon={TrendingUp}
                          label="Efficiency Index"
                          value={`${globalStats?.efficiency ?? stats.efficiency}%`}
                          subValue="Reputation rating"
                        />
                        <AnalyticsCard
                          icon={BarChart3}
                          label="Engagement"
                          value={`${globalStats?.replyRate ?? stats.replyRate}%`}
                          subValue={`${globalStats?.replied ?? stats.replied} detected replies`}
                        />
                      </div>

                      <div className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-border-light">
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold tracking-tight text-text-primary">{currentLabel}</h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-light text-brand uppercase">{total} Objects</span>
                            {globalStats?.worker && (
                              <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-border-light">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  globalStats.worker.status === "up" ? "bg-[#00A63E] animate-pulse" :
                                    globalStats.worker.status === "stale" ? "bg-amber-500" : "bg-red-500"
                                )} />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  Worker {globalStats.worker.status}
                                </span>
                              </div>
                            )}
                          </div>
                          {total > 0 && <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Monitoring</div>}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                          <EmailList
                            emails={emailItems}
                            onToggleStar={handleToggleStar}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
};

export default Dashboard;
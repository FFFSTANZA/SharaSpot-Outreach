"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./Topbar";
import { CampaignList } from "./CampaignList";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getSenders, getDashboardStats, DashboardStats } from "@/lib/apis";
import { useSearchFilters, SearchFilters } from "@/hooks/useSearchFilters";
import type { Campaign, SenderResponse } from "@/types";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import FilterPanel from "@/components/FilterPanel";
import FilterSummaryBar from "@/components/FilterSummaryBar";
import { cn } from "@/lib/utils";
import {
  Megaphone,
  Send,
  Clock,
  TrendingUp,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Pause,
} from "lucide-react";

const CAMPAIGN_STATUS_OPTIONS = ["SCHEDULED", "SENDING", "PAUSED", "CANCELLED", "COMPLETED"];

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
  } = useSearchFilters({ endpoint: "campaigns" });

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

  const setCurrentLabel = useCallback<React.Dispatch<React.SetStateAction<string>>>(() => {
    // currentLabel is derived from filters.status
  }, []);

  const currentLabel = useMemo(() => {
    return filters.status === "SCHEDULED" ? "Scheduled"
      : filters.status === "SENDING" ? "Sending"
        : filters.status === "PAUSED" ? "Paused"
          : filters.status === "COMPLETED" ? "Completed"
            : filters.status === "CANCELLED" ? "Cancelled"
              : !filters.status ? "All Campaigns"
                : "Custom";
  }, [filters.status]);

  const handleSidebarItemClick = useCallback((itemLabel: string) => {
    const statusMap: Record<string, string> = {
      "All Campaigns": "",
      Scheduled: "SCHEDULED",
      Sending: "SENDING",
      Paused: "PAUSED",
      Completed: "COMPLETED",
      Cancelled: "CANCELLED",
    };
    setFilters({ status: statusMap[itemLabel] ?? "" });
  }, [setFilters]);

  useEffect(() => {
    const fetchGlobalStats = () => {
      getDashboardStats()
        .then(setGlobalStats)
        .catch(err => console.error("[Dashboard] Stats error:", err));
    };

    fetchGlobalStats();

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchGlobalStats();
      }
    }, 30_000);

    return () => clearInterval(pollInterval);
  }, []);

  const campaignItems = useMemo(() => results.map((r: Campaign) => ({
    campaign: r,
    searchQuery: filters.q,
  })), [results, filters.q]);

  const stats = useMemo(() => {
    const campaigns = results as Campaign[];
    const sent = campaigns.reduce((sum, c) => sum + (c.emailCounts?.sent ?? 0), 0);
    const failed = campaigns.reduce((sum, c) => sum + (c.emailCounts?.failed ?? 0), 0);
    const pending = campaigns.reduce((sum, c) => sum + (c.emailCounts?.pending ?? 0) + (c.emailCounts?.sending ?? 0), 0);

    const totalAttempted = sent + failed;
    const efficiency = totalAttempted > 0 ? Math.round((sent / totalAttempted) * 100) : 100;
    const replyRate = globalStats?.replyRate ?? "0";

    return { sent, failed, pending, efficiency, replyRate, totalCampaigns: campaigns.length };
  }, [results, globalStats]);

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
                { label: "All Campaigns", count: total, icon: <Megaphone size={18} /> },
                { label: "Scheduled", icon: <Clock size={18} /> },
                { label: "Sending", icon: <Send size={18} /> },
                { label: "Paused", icon: <Pause size={18} /> },
                { label: "Completed", icon: <CheckCircle size={18} /> },
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
                      onFilterChange={(key, value) => setFilter(key as keyof SearchFilters, value)}
                      onClearAll={clearAllFilters}
                      activeFilterCount={activeFilterCount}
                      senders={senders}
                      statusOptions={CAMPAIGN_STATUS_OPTIONS}
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
                      <div className="px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-background/30 border-b border-border-light">
                        <AnalyticsCard
                          icon={Megaphone}
                          label="Total Campaigns"
                          value={stats.totalCampaigns}
                          subValue={`${globalStats?.pending ?? stats.pending} emails in queue`}
                        />
                        <AnalyticsCard
                          icon={Send}
                          label="Emails Sent"
                          value={globalStats?.sent ?? stats.sent}
                          subValue={`${globalStats?.failed ?? stats.failed} failed`}
                          color="brand"
                        />
                        <AnalyticsCard
                          icon={TrendingUp}
                          label="Efficiency Index"
                          value={`${globalStats?.efficiency ?? stats.efficiency}%`}
                          subValue="Delivery reputation"
                        />
                        <AnalyticsCard
                          icon={BarChart3}
                          label="Engagement"
                          value={`${globalStats?.replyRate ?? stats.replyRate}%`}
                          subValue={`${globalStats?.replied ?? 0} detected replies`}
                        />
                      </div>

                      <div className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-border-light">
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold tracking-tight text-text-primary">{currentLabel}</h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-light text-brand uppercase">{total} Campaigns</span>
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
                          {total > 0 && <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Campaigns</div>}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                          <CampaignList
                            campaigns={campaignItems}
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

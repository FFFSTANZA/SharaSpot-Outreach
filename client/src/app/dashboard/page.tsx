"use client";

import { CampaignList } from "./CampaignList";
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getSenders, getDashboardStats, DashboardStats } from "@/lib/apis";
import { useSearchFilters, SearchFilters } from "@/hooks/useSearchFilters";
import type { Campaign, SenderResponse } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import FilterPanel from "@/components/FilterPanel";
import FilterSummaryBar from "@/components/FilterSummaryBar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Send,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Mail,
  ArrowRight,
  Plus,
  Search,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";

const CAMPAIGN_STATUS_OPTIONS = ["SCHEDULED", "SENDING", "PAUSED", "CANCELLED", "COMPLETED"];

function AnalyticsCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
}) {
  return (
    <div className="rounded-lg border border-border-light bg-white p-4 shadow-card transition-all hover:shadow-premium-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
          <Icon className="h-[18px] w-[18px] text-brand" />
        </div>
        <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-text-primary">{value}</div>
      {subValue && (
        <div className="mt-2 border-t border-border-light pt-2 text-xs font-medium text-text-muted">
          {subValue}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const { toggle } = useSidebar();
  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [isSendersLoading, setIsSendersLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

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
    getSenders().then((s) => { setSenders(s); setIsSendersLoading(false); }).catch((err) => {
      console.error("[Dashboard] Failed to load senders:", err);
      setIsSendersLoading(false);
    });
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

  useEffect(() => {
    const fetchGlobalStats = () => {
      setStatsError(null);
      getDashboardStats()
        .then(setGlobalStats)
        .catch(err => { console.error("[Dashboard] Stats error:", err); setStatsError("Failed to load stats"); });
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
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
          <div className="mx-auto w-full max-w-[1600px] flex flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-white">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-border-light px-4 py-3 sm:px-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggle}
                          aria-label="Open sidebar"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
                        >
                          <Menu size={14} />
                        </button>
                        <h1 className="text-base font-semibold text-text-primary">Campaigns</h1>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href="/dashboard/compose"
                          className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90"
                        >
                          <Plus size={12} />
                          New Campaign
                        </Link>
                      </div>
                    </div>

                    {/* Search + filter toggle */}
                    <div className="flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                          type="text"
                          placeholder="Search campaigns..."
                          value={filters.q || ""}
                          onChange={(e) => setQuery(e.target.value)}
                          aria-label="Search campaigns"
                          className="w-full rounded-md border border-border-light bg-white py-1.5 pl-8 pr-2.5 text-sm text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted"
                        />
                      </div>
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
                    </div>
                  </div>
                </div>

                <FilterSummaryBar
                  filters={filters}
                  onRemoveFilter={(key) => clearFilter(key)}
                  onClearAll={clearAllFilters}
                  senders={senders}
                />

                {/* Setup banners */}
                {!isSendersLoading && senders.length === 0 ? (
                  <div className="mx-4 mt-4 flex items-center justify-between gap-4 rounded-lg border border-brand/20 bg-brand-light p-4 sm:mx-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                        <Mail className="h-5 w-5 text-brand" />
                      </div>
                      <p className="text-sm font-semibold leading-relaxed text-brand">
                        No email accounts connected. Set up your first sender to start sending campaigns.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/senders"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand/90"
                    >
                      Add Sender
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : !senders.some((s) => s.isVerified) ? (
                  <div className="mx-4 mt-4 flex items-center justify-between gap-4 rounded-lg border border-border-light bg-[#F8F9FA] p-4 sm:mx-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light">
                        <AlertCircle className="h-5 w-5 text-brand" />
                      </div>
                      <p className="text-sm font-semibold leading-relaxed text-text-secondary">
                        Complete your email setup to start sending campaigns.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/senders"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand/90"
                    >
                      Complete Setup
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : null}

                {/* Content */}
                <div>
                  {isLoading && results.length === 0 ? (
                    <InlineLoader message="Synchronizing your campaigns..." />
                  ) : error ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      <div className="rounded-full bg-error-bg p-4">
                        <AlertCircle className="h-8 w-8 text-error-text" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-text-primary">{error}</p>
                        <button onClick={refresh} className="mt-1 text-sm font-semibold text-brand hover:underline">Refresh</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Analytics */}
                      <div className="border-b border-border-light px-4 py-5 sm:px-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-base font-semibold text-text-primary">Outcomes</h2>
                          {globalStats?.worker && (
                            <div className="flex items-center gap-2 rounded-lg border border-border-light bg-[#F8F9FA] px-3 py-1.5">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                globalStats.worker.status === "up" ? "bg-brand" :
                                  globalStats.worker.status === "stale" ? "bg-brand-muted" : "bg-error-bg"
                              )} />
                              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
                                {globalStats.worker.status}
                              </span>
                            </div>
                          )}
                        </div>

                        {statsError && (
                          <div className="mb-3 flex items-center gap-2 rounded-lg bg-error-bg border border-error-bg px-3 py-2">
                            <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0" />
                            <span className="text-xs text-error-text">{statsError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <AnalyticsCard
                            icon={Send}
                            label="Sent"
                            value={globalStats?.sent ?? stats.sent}
                            subValue={`${globalStats?.failed ?? stats.failed} failed`}
                          />
                          <AnalyticsCard
                            icon={BarChart3}
                            label="Replies"
                            value={`${globalStats?.replyRate ?? stats.replyRate}%`}
                            subValue={`${globalStats?.replied ?? 0} total`}
                          />
                          <AnalyticsCard
                            icon={TrendingUp}
                            label="Efficiency"
                            value={`${globalStats?.efficiency ?? stats.efficiency}%`}
                            subValue="Delivery rate"
                          />
                          <AnalyticsCard
                            icon={Mail}
                            label="In Queue"
                            value={globalStats?.pending ?? stats.pending}
                            subValue={`${stats.totalCampaigns} active campaigns`}
                          />
                        </div>
                      </div>

                      {/* Campaign list */}
                      <div>
                        <div className="flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
                          <div className="flex min-w-0 items-center gap-3">
                            <h2 className="truncate text-sm font-semibold text-text-primary">{currentLabel}</h2>
                            <span className="shrink-0 rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand">{total}</span>
                          </div>
                        </div>

                        <CampaignList campaigns={campaignItems} hasActiveFilters={activeFilterCount > 0} onClearFilters={clearAllFilters} />
                      </div>
                    </>
                  )}
                </div>
              </div>
      </ErrorBoundary>
    </AuthGuard>
  );
};

export default function Dashboard() {
  return (
    <Suspense fallback={<InlineLoader message="Synchronizing dashboard..." />}>
      <DashboardPage />
    </Suspense>
  );
}

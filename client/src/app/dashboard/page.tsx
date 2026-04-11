"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./Topbar";
import { EmailList } from "./EmailList";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSenders, toggleEmailStar } from "@/lib/apis";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import type { SenderResponse } from "@/types";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import FilterPanel from "@/components/FilterPanel";
import FilterSummaryBar from "@/components/FilterSummaryBar";
import {
  Inbox,
  Send,
  Clock,
  Star,
  TrendingDown,
  TrendingUp,
  Mail,
  AlertCircle,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_STATUS_OPTIONS = ["PENDING", "SENDING", "SENT", "FAILED", "CANCELLED"];

/**
 * AnalyticsCard - memorable dashboard stat display.
 */
function AnalyticsCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
}: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E8EAED] p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-[#9AA0A6]" />
      </div>
      <div className="text-2xl font-bold text-[#1A1D21] tracking-tight">{value}</div>
      {subValue && (
        <div className="text-xs text-[#5F6368] mt-1 flex items-center gap-1">
          {subValue}
          {trend && <span className="text-[#9AA0A6]">• {trend}</span>}
        </div>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [label, setLabel] = useState<string>("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    filters, results, total, isLoading, error,
    setQuery, setFilter, setFilters, clearFilter, clearAllFilters, refresh,
    activeFilterCount,
  } = useSearchFilters({ endpoint: "emails" });

  useEffect(() => {
    getSenders().then(setSenders).catch(() => { });
  }, []);

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

  const emailItems = results.map((r: any) => ({
    email: r,
    campaign: r.campaign,
    searchQuery: filters.q,
  }));

  const handleToggleStar = useCallback(async (emailId: string) => {
    try {
      await toggleEmailStar(emailId);
      refresh();
    } catch { }
  }, [refresh]);

  useEffect(() => {
    if (filters.starred === "true") {
      setLabel("Starred");
    } else if (filters.status === "PENDING") {
      setLabel("Scheduled");
    } else if (filters.status === "SENT") {
      setLabel("Sent");
    } else if (!filters.status && !filters.starred) {
      setLabel("All");
    } else {
      setLabel("Custom");
    }
  }, [filters.status, filters.starred]);

  const stats = useMemo(() => {
    const sent = results.filter((r: any) => r.status === "SENT").length;
    const failed = results.filter((r: any) => r.status === "FAILED").length;
    const pending = results.filter((r: any) => r.status === "PENDING").length;
    const replied = results.filter((r: any) => r.isReplied).length;

    const totalAttempted = sent + failed;
    const efficiency = totalAttempted > 0 ? Math.round((sent / totalAttempted) * 100) : 100;
    const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : "0";

    const capacity = senders.reduce((acc, s) => acc + s.dailyLimit, 0);
    const utilization = capacity > 0 ? Math.round((sent / capacity) * 100) : 0;

    return { sent, failed, pending, replied, efficiency, replyRate, capacity, utilization };
  }, [results, senders]);

  return (
    <AuthGuard>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-[#FAFBFC]">
            <Sidebar
              currentLabel={label}
              setLabel={setLabel}
              onItemClick={handleSidebarItemClick}
              profile={{
                name: user?.name ?? "",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
              items={[
                { label: "All", count: total, icon: <Inbox className="h-4 w-4" /> },
                { label: "Starred", icon: <Star className="h-4 w-4" /> },
                { label: "Scheduled", icon: <Clock className="h-4 w-4" /> },
                { label: "Sent", icon: <Send className="h-4 w-4" /> },
              ]}
            />

            <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
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
                onRemoveFilter={(key) => clearFilter(key as any)}
                onClearAll={clearAllFilters}
                senders={senders}
              />

              {isLoading && results.length === 0 ? (
                <InlineLoader message="Loading your emails..." />
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="h-8 w-8 text-[#DADCE0]" />
                  <p className="text-sm text-[#5F6368]">{error}</p>
                  <button onClick={refresh} className="text-sm text-[#00A63E] hover:underline">Retry</button>
                </div>
              ) : (
                <>
                  <div className="px-4 md:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <AnalyticsCard
                      icon={Mail}
                      label="Total"
                      value={total}
                      subValue={`${stats.pending} pending`}
                    />
                    <AnalyticsCard
                      icon={CheckCircle}
                      label="Sent"
                      value={stats.sent}
                      subValue={`${stats.failed} failed`}
                    />
                    <AnalyticsCard
                      icon={TrendingUp}
                      label="Efficiency"
                      value={`${stats.efficiency}%`}
                      subValue="Delivery rate"
                    />
                    <AnalyticsCard
                      icon={BarChart3}
                      label="Replies"
                      value={`${stats.replyRate}%`}
                      subValue={`${stats.replied} replies`}
                    />
                  </div>

                  <div className="px-4 md:px-6 mt-2 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#00A63E] animate-pulse" />
                      <h2 className="text-base font-bold text-[#1A1D21] tracking-tight">Inbox</h2>
                      <span className="text-xs text-[#5F6368]">({total} {total === 1 ? 'email' : 'emails'})</span>
                    </div>
                  </div>

                  <div className="flex-1 mx-4 md:mx-6 mb-4 rounded-lg bg-white border border-[#E8EAED] overflow-hidden flex flex-col min-h-0">
                    <EmailList
                      emails={emailItems}
                      onToggleStar={handleToggleStar}
                    />
                  </div>
                </>
              )}
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
};

export default Dashboard;
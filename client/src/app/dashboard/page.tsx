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
  TrendingUp,
  Mail,
  AlertCircle,
  BarChart3,
  CheckCircle,
} from "lucide-react";

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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
      {subValue && (
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
          {subValue}
          {trend && <span className="text-gray-400 font-normal">• {trend}</span>}
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

  const emailItems = (results as any[]).map((r: any) => ({
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

  const newLabel = filters.starred === "true" ? "Starred"
    : filters.status === "PENDING" ? "Scheduled"
    : filters.status === "SENT" ? "Sent"
    : !filters.status && !filters.starred ? "All"
    : "Custom";
  
  if (newLabel !== label) {
    setLabel(newLabel);
  }

  const stats = useMemo(() => {
    const sent = results.filter((r: Record<string, unknown>) => r.status === "SENT").length;
    const failed = results.filter((r: Record<string, unknown>) => r.status === "FAILED").length;
    const pending = results.filter((r: Record<string, unknown>) => r.status === "PENDING").length;
    const replied = results.filter((r: Record<string, unknown>) => r.isReplied).length;

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
          <div className="flex h-screen bg-gray-50/50">
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
                    onFilterChange={(key, value) => setFilter(key as keyof import("@/hooks/useSearchFilters").SearchFilters, value)}
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
                      <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                      <h2 className="text-base font-bold text-gray-900 tracking-tight">Inbox</h2>
                      <span className="text-xs text-gray-500 font-medium">({total} {total === 1 ? 'email' : 'emails'})</span>
                    </div>
                  </div>

                  <div className="flex-1 mx-4 md:mx-6 mb-4 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-0">
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
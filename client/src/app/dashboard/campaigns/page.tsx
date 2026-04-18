"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getSenders } from "@/lib/apis";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import type { SenderResponse } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";
import { InlineLoader } from "@/components/PageLoader";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { SidebarProvider } from "@/context/SidebarContext";
import StatusBadge from "@/components/StatusBadge";
import CampaignControls from "@/components/CampaignControls";
import FilterPanel from "@/components/FilterPanel";
import FilterSummaryBar from "@/components/FilterSummaryBar";
import MatchHighlighter from "@/components/MatchHighlighter";
import {
  AlertCircle,
  Inbox,
  Send,
  Clock,
  Users,
  Calendar,
  Megaphone,
  Plus,
} from "lucide-react";

const CAMPAIGN_STATUS_OPTIONS = ["SCHEDULED", "SENDING", "PAUSED", "CANCELLED", "COMPLETED"];

export default function CampaignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [label, setLabel] = useState<string>("Campaigns");
  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    filters, results, total, isLoading, error,
    setQuery, setFilter, clearFilter, clearAllFilters, refresh,
    activeFilterCount,
  } = useSearchFilters({ endpoint: "campaigns" });

  useEffect(() => {
    getSenders().then(setSenders).catch(() => {});
  }, []);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }).format(new Date(iso));

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar
            setLabel={setLabel}
            items={[
              { label: "All", icon: <Inbox className="h-4 w-4" /> },
              { label: "Scheduled", icon: <Clock className="h-4 w-4" /> },
              { label: "Sent", icon: <Send className="h-4 w-4" /> },
            ]}
          />

          <main className="flex flex-1 flex-col min-w-0">
            <TopBar
              placeholder="Search campaigns..."
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
                  statusOptions={CAMPAIGN_STATUS_OPTIONS}
                />
              }
            />

            <FilterSummaryBar
              filters={filters}
              onRemoveFilter={(key) => clearFilter(key as any)}
              onClearAll={clearAllFilters}
              senders={senders}
            />

            <div className="px-4 md:px-6 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">Campaigns</h1>
                <p className="text-xs text-text-secondary mt-1">{total} campaign{total !== 1 ? "s" : ""} total</p>
              </div>
              <button 
                onClick={() => router.push("/dashboard/compose")}
                className="flex items-center gap-2 px-6 h-10 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </button>
            </div>

            {isLoading && results.length === 0 ? (
              <InlineLoader message="Loading campaigns..." />
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-text-secondary">{error}</p>
                <button onClick={refresh} className="text-sm text-brand font-semibold hover:underline">Retry</button>
              </div>
            ) : results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="h-20 w-20 rounded-xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                  <Megaphone className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {activeFilterCount > 0 ? "No matching campaigns" : "No campaigns yet"}
                </h3>
                <p className="text-sm text-text-secondary max-w-xs mb-8 font-medium">
                  {activeFilterCount > 0
                    ? "Try adjusting your filters or search query."
                    : "Create your first campaign to start sending outreach emails."}
                </p>
                {activeFilterCount === 0 && (
                  <button 
                    onClick={() => router.push("/dashboard/compose")}
                    className="flex items-center gap-2 px-8 h-12 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 px-4 md:px-6 pb-6 overflow-y-auto">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Campaign</th>
                        <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Status</th>
                        <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Recipients</th>
                        <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Created</th>
                        <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {results.map((campaign: any) => (
                        <tr 
                          key={campaign.id}
                          className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-brand-light transition-colors">
                                <Megaphone className="h-5 w-5 text-gray-400 group-hover:text-brand" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[240px]">
                                  <MatchHighlighter text={campaign.subject} query={filters.q} />
                                </p>
                                <p className="text-xs text-text-muted truncate max-w-[240px]">
                                  {campaign.sender?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={campaign.status} pauseReason={campaign.pauseReason} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              {campaign.totalRecipients}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {formatDate(campaign.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <CampaignControls
                              campaignId={campaign.id}
                              status={campaign.status}
                              pendingCount={0}
                              subject={campaign.subject}
                              onStatusChange={() => refresh()}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

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
        <div className="flex h-screen bg-[#FAFAFA]">
          <Sidebar
            setLabel={setLabel}
            profile={{
              name: user?.name ?? "",
              email: user?.email ?? "",
              avatarUrl: user?.avatarUrl ?? "",
            }}
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

            <div className="px-4 md:px-6 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Campaigns</h1>
                <p className="text-xs text-gray-500">{total} campaign{total !== 1 ? "s" : ""}</p>
              </div>
              <button 
                onClick={() => router.push("/dashboard/compose")}
                className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-md text-sm font-medium hover:bg-teal-800 transition-colors"
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
                <p className="text-sm text-gray-500">{error}</p>
                <button onClick={refresh} className="text-sm text-teal-600 hover:underline">Retry</button>
              </div>
            ) : results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Megaphone className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {activeFilterCount > 0 ? "No matching campaigns" : "No campaigns yet"}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mb-4">
                  {activeFilterCount > 0
                    ? "Try adjusting your filters or search query."
                    : "Create your first campaign to start sending cold outreach emails."}
                </p>
                {activeFilterCount === 0 && (
                  <button 
                    onClick={() => router.push("/dashboard/compose")}
                    className="flex items-center gap-2 px-5 py-2 bg-teal-700 text-white rounded-md text-sm font-medium hover:bg-teal-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Campaign</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Recipients</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Created</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((campaign: any) => (
                        <tr 
                          key={campaign.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                <Megaphone className="h-4 w-4 text-teal-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                  <MatchHighlighter text={campaign.subject} query={filters.q} />
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {campaign.sender?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={campaign.status} pauseReason={campaign.pauseReason} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Users className="h-3 w-3" />
                              {campaign.totalRecipients} recipient{campaign.totalRecipients !== 1 ? "s" : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(campaign.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
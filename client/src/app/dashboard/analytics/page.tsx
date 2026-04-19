"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnalyticsOverview, getAnalyticsLinks } from "@/lib/apis";
import { useAuth } from "@/hooks/useAuth";
import type { AnalyticsOverview, AnalyticsLink, DailySeriesPoint, HourlySeriesPoint } from "@/types";
import {
  Eye, MousePointerClick, Send, MessageSquare, TrendingUp,
  BarChart3, Clock, Link2, RefreshCw, AlertTriangle, Trophy,
  ExternalLink, Inbox, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ─── Mini SVG Chart Components ───

function MultiLineChart({ data, height = 120 }: { data: DailySeriesPoint[]; height?: number }) {
  const max = Math.max(...data.flatMap((d) => [d.opens, d.clicks, d.replies]), 1);
  const w = 600;
  const pad = 10;

  const makePath = (key: keyof Pick<DailySeriesPoint, "opens" | "clicks" | "replies">) =>
    data.map((d, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
      const y = height - pad - (d[key] / max) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <path d={makePath("opens")} fill="none" stroke="#00A63E" strokeWidth="2" strokeLinecap="round" />
      <path d={makePath("clicks")} fill="none" stroke="#009134" strokeWidth="2" strokeLinecap="round" />
      <path d={makePath("replies")} fill="none" stroke="#007A2B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HourlyHeatmap({ data }: { data: HourlySeriesPoint[] }) {
  const max = Math.max(...data.flatMap((d) => [d.opens, d.clicks]), 1);

  return (
    <div className="space-y-1">
      <div className="flex gap-0.5">
        {data.map((d) => (
          <div
            key={d.hour}
            className="flex-1 rounded-sm transition-all hover:opacity-80"
            style={{
              height: 48,
              backgroundColor: d.opens > 0 ? `rgba(0, 166, 62, ${Math.max(d.opens / max, 0.15)})` : "#f3f4f6",
            }}
            title={`${d.hour}:00 - ${d.opens} opens, ${d.clicks} clicks`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-gray-400">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

// ─── Analytics Page ───

type TimeRange = 7 | 14 | 30 | 90;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [links, setLinks] = useState<AnalyticsLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [activeTab, setActiveTab] = useState<"overview" | "links">("overview");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ov, lk] = await Promise.all([
        getAnalyticsOverview(timeRange),
        getAnalyticsLinks(),
      ]);
      setOverview(ov);
      setLinks(lk.links);
    } catch {
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen bg-background font-sans">
          <Sidebar
            currentLabel="Analytics"
            setLabel={() => { }}
            items={[
              { label: "All", icon: <Inbox size={18} /> },
              { label: "Starred", icon: <Star size={18} /> },
              { label: "Scheduled", icon: <Clock size={18} /> },
              { label: "Sent", icon: <Send size={18} /> },
            ]}
            profile={{
              name: user?.name ?? "User",
              email: user?.email ?? "",
              avatarUrl: user?.avatarUrl ?? "",
            }}
          />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-4 px-4 bg-background">
            <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
              <TopBar onRefresh={fetchData} isRefreshing={isLoading} />

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {isLoading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-100 rounded w-1/4" />
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 rounded-xl" />)}
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-300" />
                    <p className="text-sm text-gray-500">{error}</p>
                    <button onClick={fetchData} className="text-sm text-[#00A63E] hover:underline">Retry</button>
                  </div>
                ) : !overview ? null : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Analytics</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Cross-campaign performance monitoring</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                          {([7, 14, 30, 90] as TimeRange[]).map((d) => (
                            <button
                              key={d}
                              onClick={() => setTimeRange(d)}
                              className={cn(
                                "px-3 py-1 text-[11px] font-medium rounded-md transition-all",
                                timeRange === d ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                              )}
                            >
                              {d}d
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex border-b border-gray-100">
                      <button
                        className={cn(
                          "px-4 py-2.5 text-xs font-medium transition-colors border-b-2",
                          activeTab === "overview" ? "text-[#00A63E] border-[#00A63E]" : "text-gray-500 border-transparent hover:text-gray-600"
                        )}
                        onClick={() => setActiveTab("overview")}
                      >
                        <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
                        Overview
                      </button>
                      <button
                        className={cn(
                          "px-4 py-2.5 text-xs font-medium transition-colors border-b-2",
                          activeTab === "links" ? "text-[#00A63E] border-[#00A63E]" : "text-gray-500 border-transparent hover:text-gray-600"
                        )}
                        onClick={() => setActiveTab("links")}
                      >
                        <Link2 className="h-3.5 w-3.5 inline mr-1.5" />
                        Link Clicks ({links.length})
                      </button>
                    </div>

                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <StatCard
                            icon={Send}
                            label="Total Sent"
                            value={formatNumber(overview.totalSent)}
                            sub={`${overview.totalCampaigns} campaigns`}
                          />
                          <StatCard
                            icon={Eye}
                            label="Open Rate"
                            value={`${overview.openRate}%`}
                            sub={`${overview.uniqueOpens} unique opens`}
                          />
                          <StatCard
                            icon={MousePointerClick}
                            label="Click Rate"
                            value={`${overview.clickRate}%`}
                            sub={`${overview.uniqueClicks} unique clicks`}
                          />
                          <StatCard
                            icon={MessageSquare}
                            label="Reply Rate"
                            value={`${overview.replyRate}%`}
                            sub={`${overview.totalReplied} replies`}
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4">Activity Trend</h2>
                            <MultiLineChart data={overview.dailySeries} height={200} />
                          </div>

                          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-900 mb-4">Hourly Activity (UTC)</h2>
                            <HourlyHeatmap data={overview.hourlySeries} />
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Campaigns</h2>
                          <div className="divide-y divide-gray-50">
                            {overview.topCampaigns.map((c, i) => (
                              <div key={c.id} className="flex items-center justify-between py-3">
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{c.subject}</p>
                                  <p className="text-[10px] text-gray-400">{c.sent} sent · {c.replied} replies</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-[#00A63E]">{c.openRate}%</p>
                                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Open Rate</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "links" && (
                      <div className="space-y-2">
                        {links.map((link) => (
                          <div key={link.url} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <ExternalLink className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{link.url}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-indigo-600">{link.count}</p>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Clicks</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[#00A63E]/10">
          <Icon size={18} className="text-[#00A63E]" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

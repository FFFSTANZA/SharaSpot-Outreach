"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, Suspense } from "react";
import {
  getAnalyticsOverview,
  getAnalyticsLinks,
  getActivityLogs,
  getSenderHealth
} from "@/lib/apis";
import { useAuth } from "@/hooks/useAuth";
import type {
  AnalyticsOverview,
  AnalyticsLink,
  SenderHealthRecord,
  ActivityLogsResponse
} from "@/types";
import {
  Eye, MousePointerClick, Send, MessageSquare, TrendingUp,
  BarChart3, Link2, RefreshCw, AlertTriangle,
  Inbox, ShieldCheck, Activity,
  ChevronLeft, ChevronRight, Monitor, Smartphone, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

// ─── Analytics Page ───

type TimeRange = 7 | 14 | 30 | 90;
type TabType = "overview" | "logs" | "health" | "links";

function AnalyticsPageContent() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [links, setLinks] = useState<AnalyticsLink[]>([]);
  const [health, setHealth] = useState<SenderHealthRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLogsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [logPage, setLogPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ov, lk, hl, lg] = await Promise.all([
        getAnalyticsOverview(timeRange),
        getAnalyticsLinks(),
        getSenderHealth(),
        getActivityLogs(logPage, 20)
      ]);
      setOverview(ov);
      setLinks(lk.links);
      setHealth(hl.health);
      setLogs(lg);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, logPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <Suspense fallback={null}>
      <AuthGuard requirePremium={true}>
        <SidebarProvider>
          <div className="flex h-screen bg-background font-sans">
            <Sidebar
              currentLabel="Analytics"
              setLabel={() => { }}
              items={[
                { label: "Dashboard", icon: <Inbox size={18} /> },
                { label: "Analytics", icon: <BarChart3 size={18} /> },
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#00A63E]" />
                        Command Center
                      </h1>
                      <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Real-time Outreach Intelligence</p>
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

                  <div className="flex border-b border-gray-100 no-scrollbar overflow-x-auto gap-4">
                    <TabButton
                      active={activeTab === "overview"}
                      onClick={() => setActiveTab("overview")}
                      icon={BarChart3}
                      label="Overview"
                    />
                    <TabButton
                      active={activeTab === "logs"}
                      onClick={() => setActiveTab("logs")}
                      icon={Activity}
                      label="Activity Logs"
                    />
                    <TabButton
                      active={activeTab === "health"}
                      onClick={() => setActiveTab("health")}
                      icon={ShieldCheck}
                      label="Sender Health"
                    />
                    <TabButton
                      active={activeTab === "links"}
                      onClick={() => setActiveTab("links")}
                      icon={Link2}
                      label="Link Clicks"
                    />
                  </div>

                  {isLoading && !overview ? (
                    <div className="flex flex-col items-center justify-center py-32">
                      <RefreshCw className="h-8 w-8 text-[#00A63E] animate-spin" />
                      <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-bold">Initializing Metrics...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <AlertTriangle className="h-8 w-8 text-red-300" />
                      <p className="text-sm text-gray-500">{error}</p>
                      <button onClick={fetchData} className="text-sm text-[#00A63E] hover:underline">Retry</button>
                    </div>
                  ) : (
                    <>
                      {activeTab === "overview" && overview && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <StatCard icon={Send} label="Outbound" value={formatNumber(overview.totalSent)} color="indigo" />
                            <StatCard icon={Eye} label="Open Rate" value={`${overview.openRate}%`} color="green" />
                            <StatCard icon={MousePointerClick} label="Click Rate" value={`${overview.clickRate}%`} color="blue" />
                            <StatCard icon={MessageSquare} label="Replies" value={`${overview.replyRate}%`} color="amber" />
                            <StatCard icon={AlertTriangle} label="Bounce Rate" value={`${((overview.totalBounced / (overview.totalSent || 1)) * 100).toFixed(1)}%`} color="rose" />
                          </div>

                          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Performance Trends</h3>
                              <div className="flex gap-4">
                                <LegendItem color="#00A63E" label="Opens" />
                                <LegendItem color="#818cf8" label="Clicks" />
                                <LegendItem color="#f59e0b" label="Replies" />
                              </div>
                            </div>
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={overview.dailySeries}>
                                  <defs>
                                    <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#00A63E" stopOpacity={0.1} />
                                      <stop offset="95%" stopColor="#00A63E" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                                    dy={10}
                                  />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                                  <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                  />
                                  <Area type="monotone" dataKey="opens" stroke="#00A63E" fillOpacity={1} fill="url(#colorOpens)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="clicks" stroke="#818cf8" fill="transparent" strokeWidth={2} />
                                  <Area type="monotone" dataKey="replies" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Top Performing Campaigns</h3>
                              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {overview.topCampaigns.map(c => (
                                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-gray-900 truncate">{c.subject}</p>
                                      <p className="text-[10px] text-gray-400 mt-1">{c.sent} emails dispatched</p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="text-sm font-black text-[#00A63E] leading-none">{c.openRate}%</p>
                                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Open Rate</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Hourly Engagement Heatmap</h3>
                              <div className="grid grid-cols-12 gap-1 h-32">
                                {overview.hourlySeries.map(h => (
                                  <div
                                    key={h.hour}
                                    className="rounded-sm flex flex-col justify-end group relative"
                                    title={`${h.hour}:00 - ${h.opens} opens`}
                                  >
                                    <div
                                      className="w-full bg-[#00A63E]/20 group-hover:bg-[#00A63E]/40 transition-all rounded-sm"
                                      style={{ height: `${Math.max((h.opens / (Math.max(...overview.hourlySeries.map(x => x.opens)) || 1)) * 100, 5)}%` }}
                                    />
                                    <span className="text-[8px] text-gray-400 mt-1 text-center hidden md:block">
                                      {h.hour % 6 === 0 ? h.hour : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Platform & Device Breakdown */}
                            {(overview.platformBreakdown?.length || overview.deviceBreakdown?.length) && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Platform Breakdown */}
                                {overview.platformBreakdown?.length ? (
                                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Platforms</h3>
                                    <div className="space-y-3">
                                      {overview.platformBreakdown.map((p) => (
                                        <div key={p.platform} className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            {p.platform === 'iOS' || p.platform === 'macOS' ? (
                                              <Monitor className="h-4 w-4 text-gray-600" />
                                            ) : p.platform === 'Android' ? (
                                              <Smartphone className="h-4 w-4 text-gray-600" />
                                            ) : p.platform === 'bot' ? (
                                              <Bot className="h-4 w-4 text-gray-600" />
                                            ) : (
                                              <Monitor className="h-4 w-4 text-gray-600" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex justify-between text-sm">
                                              <span className="font-medium text-gray-900">{p.platform}</span>
                                              <span className="text-gray-500">{p.count}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-[#00A63E] rounded-full"
                                                style={{ width: `${p.percentage}%` }}
                                              />
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-400 w-12 text-right">{p.percentage}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {/* Device Breakdown */}
                                {overview.deviceBreakdown?.length ? (
                                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Devices</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                      {overview.deviceBreakdown.map((d) => (
                                        <div key={d.device} className="text-center p-4 rounded-xl bg-gray-50">
                                          {d.device === 'desktop' ? (
                                            <Monitor className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                                          ) : d.device === 'mobile' ? (
                                            <Smartphone className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                                          ) : (
                                            <Bot className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                                          )}
                                          <p className="text-2xl font-bold text-gray-900">{d.count}</p>
                                          <p className="text-xs text-gray-500 uppercase">{d.device}</p>
                                          <p className="text-xs text-[#00A63E]">{d.percentage}%</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "logs" && logs && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Activity Feed</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">Page {logs.pagination.page} of {logs.pagination.totalPages}</span>
                              <button
                                disabled={logPage <= 1}
                                onClick={() => setLogPage(p => p - 1)}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                disabled={logPage >= logs.pagination.totalPages}
                                onClick={() => setLogPage(p => p + 1)}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                  <th className="px-6 py-3">Event</th>
                                  <th className="px-6 py-3">Recipient</th>
                                  <th className="px-6 py-3">Campaign</th>
                                  <th className="px-6 py-3">Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {logs.logs.map((log) => (
                                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight",
                                        log.eventType === "OPEN" ? "bg-green-50 text-green-600" :
                                          log.eventType === "CLICK" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600"
                                      )}>
                                        {log.eventType}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-900">{log.emailJob.toEmail}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500 truncate max-w-[200px]">{log.emailJob.campaign.subject}</td>
                                    <td className="px-6 py-4 text-[10px] text-gray-400 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeTab === "health" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {health.map(item => (
                            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    item.bounceCount / (item.successCount || 1) > 0.1 ? "bg-red-500 animate-pulse" : "bg-[#00A63E]"
                                  )} />
                                  <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{item.sender.email}</p>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <HealthStat label="Success" val={item.successCount} color="text-green-600" />
                                <HealthStat label="Failed" val={item.errorCount} color="text-amber-600" />
                                <HealthStat label="Bounce" val={item.bounceCount} color="text-red-600" />
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-50">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Health Score</p>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full transition-all duration-1000",
                                      item.bounceCount / (item.successCount || 1) > 0.1 ? "bg-red-500" : "bg-[#00A63E]"
                                    )}
                                    style={{ width: `${Math.max(100 - (item.bounceCount / (item.successCount || 1)) * 500, 5)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === "links" && (
                        <div className="grid grid-cols-1 gap-3">
                          {links.map((link) => (
                            <div key={link.url} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all bg-white shadow-sm">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Link2 className="h-5 w-5 text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{link.url}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Last clicked {link.lastClicked ? new Date(link.lastClicked).toLocaleString() : "Never"}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-indigo-600 leading-none">{link.count}</p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mt-1">Total Clicks</p>
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
    </Suspense>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageContent />
    </Suspense>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
        active ? "text-[#00A63E] border-[#00A63E] scale-105" : "text-gray-400 border-transparent hover:text-gray-600"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: "green" | "indigo" | "blue" | "amber" | "rose" }) {
  const colors = {
    green: "bg-green-50 text-green-600",
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-xl transition-colors group-hover:scale-110", colors[color])}>
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function HealthStat({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-sm font-black", color)}>{val}</p>
      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
    </div>
  );
}

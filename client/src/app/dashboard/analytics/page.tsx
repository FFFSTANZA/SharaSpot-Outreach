"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnalyticsOverview, getAnalyticsLinks } from "@/lib/apis";
import type { AnalyticsOverview, AnalyticsLink, DailySeriesPoint, HourlySeriesPoint } from "@/types";
import {
  Eye, MousePointerClick, Send, MessageSquare, TrendingUp,
  BarChart3, Clock, Link2, RefreshCw, AlertTriangle, Trophy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mini SVG Chart Components (no external chart lib needed) ───

function AreaChart({ data, height = 120, colors }: { data: { value: number }[]; height?: number; colors: [string, string] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 400;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = height - (d.value / max) * (height - 10);
    return `${x},${y}`;
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
  const areaD = `${pathD} L ${w},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${colors[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${colors[0]})`} />
      <path d={pathD} fill="none" stroke={colors[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
      <path d={makePath("opens")} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <path d={makePath("clicks")} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
      <path d={makePath("replies")} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
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
              backgroundColor: d.opens > 0 ? `rgba(5, 150, 105, ${Math.max(d.opens / max, 0.15)})` : "#f3f4f6",
            }}
            title={`${d.hour}:00 — ${d.opens} opens, ${d.clicks} clicks`}
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

// ─── Page ───

type TimeRange = 7 | 14 | 30 | 90;

export default function AnalyticsPage() {
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertTriangle className="h-8 w-8 text-red-300" />
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={fetchData} className="text-sm text-teal-600 hover:underline">Retry</button>
      </div>
    );
  }

  if (!overview) return null;

  const hasData = overview.totalSent > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Cross-campaign email performance</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
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
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-100">
        <button
          className={cn(
            "px-4 py-2.5 text-xs font-medium transition-colors border-b-2",
            activeTab === "overview" ? "text-teal-600 border-teal-600" : "text-gray-500 border-transparent hover:text-gray-600"
          )}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
          Overview
        </button>
        <button
          className={cn(
            "px-4 py-2.5 text-xs font-medium transition-colors border-b-2",
            activeTab === "links" ? "text-teal-600 border-teal-600" : "text-gray-500 border-transparent hover:text-gray-600"
          )}
          onClick={() => setActiveTab("links")}
        >
          <Link2 className="h-3.5 w-3.5 inline mr-1.5" />
          Link Clicks ({links.length})
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">No analytics data yet</h3>
              <p className="text-xs text-gray-500 max-w-xs text-center">
                Send some campaigns with tracking enabled to see analytics here.
              </p>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Send}
                  label="Total Sent"
                  value={formatNumber(overview.totalSent)}
                  sub={`${overview.totalCampaigns} campaigns`}
                  color="from-gray-600 to-gray-700"
                />
                <StatCard
                  icon={Eye}
                  label="Open Rate"
                  value={`${overview.openRate}%`}
                  sub={`${overview.uniqueOpens} unique opens`}
                  color="from-emerald-500 to-teal-600"
                  trend={overview.totalOpens > 0 ? `${overview.totalOpens} total opens` : undefined}
                />
                <StatCard
                  icon={MousePointerClick}
                  label="Click Rate"
                  value={`${overview.clickRate}%`}
                  sub={`${overview.uniqueClicks} unique clicks`}
                  color="from-teal-500 to-cyan-600"
                  trend={overview.totalClicks > 0 ? `${overview.totalClicks} total clicks` : undefined}
                />
                <StatCard
                  icon={MessageSquare}
                  label="Reply Rate"
                  value={`${overview.replyRate}%`}
                  sub={`${overview.totalReplied} replies`}
                  color="from-blue-500 to-indigo-600"
                />
              </div>

              {/* Trend chart */}
              <div className="rounded-2xl bg-white border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Activity Trend</h2>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Opens</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Clicks</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Replies</span>
                  </div>
                </div>
                <MultiLineChart data={overview.dailySeries} height={160} />
              </div>

              {/* Two-column: Hourly heatmap + Top campaigns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Hourly activity */}
                <div className="rounded-2xl bg-white border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-900">Hourly Activity (UTC)</h2>
                  </div>
                  <HourlyHeatmap data={overview.hourlySeries} />
                  <p className="text-[10px] text-gray-400 mt-2">Shows when recipients open and click your emails</p>
                </div>

                {/* Top campaigns */}
                <div className="rounded-2xl bg-white border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-gray-900">Top Campaigns by Open Rate</h2>
                  </div>
                  <div className="space-y-2">
                    {overview.topCampaigns.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No campaign data yet</p>
                    ) : (
                      overview.topCampaigns.map((c, i) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                            i === 0 ? "bg-amber-100 text-amber-700" :
                            i === 1 ? "bg-gray-200 text-gray-600" :
                            i === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-500"
                          )}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{c.subject}</p>
                            <p className="text-[10px] text-gray-500">{c.sent} sent · {c.replied} replied</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-emerald-600">{c.openRate}%</p>
                            <p className="text-[10px] text-gray-400">open rate</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Engagement breakdown */}
              <div className="rounded-2xl bg-white border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Engagement Breakdown</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <EngagementBar label="Opened" count={overview.uniqueOpens} total={overview.totalSent} color="bg-emerald-500" />
                  <EngagementBar label="Clicked" count={overview.uniqueClicks} total={overview.totalSent} color="bg-teal-500" />
                  <EngagementBar label="Replied" count={overview.totalReplied} total={overview.totalSent} color="bg-blue-500" />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "links" && (
        <div className="space-y-2">
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Link2 className="h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-500">No link clicks recorded across any campaigns</p>
            </div>
          ) : (
            links.map((link, i) => (
              <div
                key={link.url}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-900 truncate">{link.url}</p>
                  {link.lastClicked && (
                    <p className="text-[10px] text-gray-400">Last clicked: {formatTime(link.lastClicked)}</p>
                  )}
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                  <MousePointerClick className="h-3 w-3" />
                  {link.count}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function StatCard({
  icon: Icon, label, value, sub, color, trend,
}: {
  icon: any; label: string; value: string; sub: string; color: string; trend?: string;
}) {
  return (
    <div className="group rounded-2xl bg-white border border-gray-100 p-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
      {trend && (
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> {trend}
        </p>
      )}
    </div>
  );
}

function EngagementBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900 tabular-nums">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(iso));
}

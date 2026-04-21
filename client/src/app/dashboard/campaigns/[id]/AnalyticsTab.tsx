"use client";

import { useEffect, useState, useCallback } from "react";
import { getTrackingMetrics, getTrackingEmails, getTrackingLinks } from "@/lib/apis";
import type { TrackingMetrics, TrackingEmailDetail, TrackingLinkDetail } from "@/types";
import {
  Eye, MousePointerClick, Send, AlertTriangle, ExternalLink,
  ArrowUpDown, EyeOff, Link2, Mail, RefreshCw,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingTabProps {
  campaignId: string;
}

function StatCard({ label, val, icon: Icon, color, bg }: { label: string; val: string | number; icon: any; color: string; bg: string }) {
  return (
    <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-brand/10">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{val}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">{label}</p>
      </div>
    </div>
  );
}

type SortField = "openCount" | "clickCount" | "lastOpenAt" | "lastClickAt";
type SortDir = "asc" | "desc";

export default function AnalyticsTab({ campaignId }: TrackingTabProps) {
  const [metrics, setMetrics] = useState<TrackingMetrics | null>(null);
  const [emails, setEmails] = useState<TrackingEmailDetail[]>([]);
  const [links, setLinks] = useState<TrackingLinkDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("openCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeSection, setActiveSection] = useState<"emails" | "links">("emails");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, e, l] = await Promise.all([
        getTrackingMetrics(campaignId),
        getTrackingEmails(campaignId),
        getTrackingLinks(campaignId),
      ]);
      setMetrics(m);
      setEmails(e.emails);
      setLinks(l.links);
    } catch {
      setError("Failed to load tracking data");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedEmails = [...emails].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    const cmp = typeof aVal === "number"
      ? (aVal as number) - (bVal as number)
      : new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
    return sortDir === "desc" ? -cmp : cmp;
  });

  const formatTime = (iso: string | null) => {
    if (!iso) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-center gap-8">
          {[1, 2].map((i) => <div key={i} className="h-28 w-28 rounded-full bg-gray-100 border border-gray-200" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-lg border border-gray-200" />)}
        </div>
        <div className="h-48 bg-gray-50 rounded-lg border border-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="h-8 w-8 text-red-300" />
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={fetchData} className="text-sm text-[#00A63E] hover:underline">Retry</button>
      </div>
    );
  }

  if (!metrics) return null;

  // Tracking disabled state
  if (!metrics.trackOpens && !metrics.trackClicks) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
          <EyeOff className="h-6 w-6 text-gray-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Tracking not enabled</h3>
        <p className="text-xs text-gray-500 max-w-xs text-center">
          Open and click tracking were disabled when this campaign was created.
        </p>
      </div>
    );
  }

  // No sent emails yet
  if (metrics.totalSent === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
          <Mail className="h-6 w-6 text-gray-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">No tracking data yet</h3>
        <p className="text-xs text-gray-500 max-w-xs text-center">
          Tracking data will appear here once emails are sent.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Sent"
          val={metrics.totalSent}
          icon={Send}
          color="text-gray-600"
          bg="bg-gray-50"
        />
        {metrics.trackOpens && (
          <StatCard
            label="Open Rate"
            val={`${metrics.openRate}%`}
            icon={Eye}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        )}
        {metrics.trackClicks && (
          <StatCard
            label="Click Rate"
            val={`${metrics.clickRate}%`}
            icon={MousePointerClick}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
        )}
        <StatCard
          label="Reply Rate"
          val={`${metrics.replyRate ?? 0}%`}
          icon={MessageSquare}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* Engagement summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.trackOpens && (
          <div className="rounded-xl border border-gray-100 p-4 transition-all hover:bg-gray-50/30">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em] mb-1">Unique Opens</p>
            <p className="text-xl font-bold text-emerald-700">{metrics.uniqueOpens}</p>
          </div>
        )}
        {metrics.trackClicks && (
          <div className="rounded-xl border border-gray-100 p-4 transition-all hover:bg-gray-50/30">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em] mb-1">Unique Clicks</p>
            <p className="text-xl font-bold text-indigo-700">{metrics.uniqueClicks}</p>
          </div>
        )}
        <div className="rounded-xl border border-gray-100 p-4 transition-all hover:bg-gray-50/30">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em] mb-1">Total Replies</p>
          <p className="text-xl font-bold text-blue-700">{metrics.repliedCount ?? 0}</p>
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-100 mt-4">
        <button
          className={cn(
            "px-6 py-3 text-xs font-bold transition-all border-b-2",
            activeSection === "emails"
              ? "text-brand border-brand"
              : "text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200"
          )}
          onClick={() => setActiveSection("emails")}
        >
          Recipient Breakdown ({emails.length})
        </button>
        {metrics.trackClicks && (
          <button
            className={cn(
              "px-6 py-3 text-xs font-bold transition-all border-b-2",
              activeSection === "links"
                ? "text-brand border-brand"
                : "text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200"
            )}
            onClick={() => setActiveSection("links")}
          >
            Link Performance ({links.length})
          </button>
        )}
      </div>

      {/* Per-email table */}
      {activeSection === "emails" && (
        <div className="overflow-x-auto">
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-2">
            {sortedEmails.map((email, i) => (
              <div
                key={email.emailJobId}
                className="rounded-xl border border-gray-100 p-3 space-y-2
                  opacity-0 animate-[fadeIn_0.15s_ease-out_forwards]"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <p className="text-xs font-medium text-gray-900 truncate">{email.toEmail}</p>
                <div className="flex items-center gap-3 text-[11px]">
                  {metrics.trackOpens && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Eye className="h-3 w-3" /> {email.openCount} opens
                    </span>
                  )}
                  {metrics.trackClicks && (
                    <span className="flex items-center gap-1 text-indigo-600">
                      <MousePointerClick className="h-3 w-3" /> {email.clickCount} clicks
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  {email.lastOpenAt && <span>Last open: {formatTime(email.lastOpenAt)}</span>}
                  {email.lastClickAt && <span>Last click: {formatTime(email.lastClickAt)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="text-left py-4 px-4 font-bold">Recipient</th>
                {metrics.trackOpens && (
                  <th className="text-center py-4 px-4 font-bold cursor-pointer hover:text-gray-600" onClick={() => toggleSort("openCount")}>
                    <span className="inline-flex items-center gap-1">Opens <ArrowUpDown className="h-2.5 w-2.5" /></span>
                  </th>
                )}
                {metrics.trackClicks && (
                  <th className="text-center py-4 px-4 font-bold cursor-pointer hover:text-gray-600" onClick={() => toggleSort("clickCount")}>
                    <span className="inline-flex items-center gap-1">Clicks <ArrowUpDown className="h-2.5 w-2.5" /></span>
                  </th>
                )}
                <th className="text-right py-4 px-4 font-bold cursor-pointer hover:text-gray-600" onClick={() => toggleSort("lastOpenAt")}>
                  <span className="inline-flex items-center gap-1">Activity <ArrowUpDown className="h-2.5 w-2.5" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedEmails.map((email, i) => (
                <tr
                  key={email.emailJobId}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="py-4 px-4 text-xs font-semibold text-gray-900 truncate max-w-[200px]">{email.toEmail}</td>
                  {metrics.trackOpens && (
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all",
                        email.openCount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                      )}>
                        {email.openCount}
                      </span>
                    </td>
                  )}
                  {metrics.trackClicks && (
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all",
                        email.clickCount > 0 ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-400"
                      )}>
                        {email.clickCount}
                      </span>
                    </td>
                  )}
                  <td className="py-4 px-4 text-right text-[10px] text-gray-400 font-medium">
                    {email.lastOpenAt ? (
                      <span className="text-emerald-600">Open: {formatTime(email.lastOpenAt)}</span>
                    ) : email.lastClickAt ? (
                      <span className="text-indigo-600">Click: {formatTime(email.lastClickAt)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-link table */}
      {activeSection === "links" && (
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-gray-50/50 border border-dashed border-gray-200">
              <Link2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium tracking-tight">No link clicks recorded yet</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 bg-white">
              {links.map((link) => (
                <div
                  key={link.url}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{link.url}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Link tracked in campaign</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 leading-tight">{link.clickCount}</p>
                    <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">Total Clicks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-500 text-center leading-relaxed">
        Open tracking relies on image loading - some email clients block images by default, so open rates may undercount.
        Apple Mail Privacy Protection may inflate open rates by pre-fetching images.
      </p>
    </div>
  );
}

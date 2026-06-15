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

function StatCard({ label, val, icon: Icon, color, bg }: { label: string; val: string | number; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="flex flex-col gap-2 p-5 rounded-lg bg-white border border-border-light shadow-card transition-all hover:border-brand/10">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">{val}</p>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">{label}</p>
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
          {[1, 2].map((i) => <div key={i} className="h-28 w-28 rounded-full bg-[#F8F9FA] border border-border-light" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#F8F9FA] rounded-lg border border-border-light" />)}
        </div>
        <div className="h-48 bg-[#F8F9FA] rounded-lg border border-border-light" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="h-8 w-8 text-error-text" />
        <p className="text-sm text-text-muted">{error}</p>
        <button onClick={fetchData} className="text-sm text-brand hover:underline">Retry</button>
      </div>
    );
  }

  if (!metrics) return null;

  // Tracking disabled state
  if (!metrics.trackOpens && !metrics.trackClicks) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-14 w-14 rounded-lg bg-[#F8F9FA] flex items-center justify-center">
          <EyeOff className="h-6 w-6 text-text-muted" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Tracking not enabled</h3>
        <p className="text-xs text-text-muted max-w-xs text-center">
          Open and click tracking were disabled when this campaign was created.
        </p>
      </div>
    );
  }

  // No sent emails yet
  if (metrics.totalSent === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-14 w-14 rounded-lg bg-[#F8F9FA] flex items-center justify-center">
          <Mail className="h-6 w-6 text-text-muted" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">No tracking data yet</h3>
        <p className="text-xs text-text-muted max-w-xs text-center">
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
          color="text-text-secondary"
          bg="bg-[#F8F9FA]"
        />
        {metrics.trackOpens && (
          <StatCard
            label="Open Rate"
            val={`${metrics.openRate}%`}
            icon={Eye}
            color="text-brand"
            bg="bg-brand-light"
          />
        )}
        {metrics.trackClicks && (
          <StatCard
            label="Click Rate"
            val={`${metrics.clickRate}%`}
            icon={MousePointerClick}
            color="text-brand"
            bg="bg-brand-light"
          />
        )}
        <StatCard
          label="Reply Rate"
          val={`${metrics.replyRate ?? 0}%`}
          icon={MessageSquare}
          color="text-brand"
          bg="bg-brand-light"
        />
      </div>

      {/* Engagement summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.trackOpens && (
          <div className="rounded-lg bg-white border border-border-light shadow-card p-4 transition-all hover:border-brand/10">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.05em] mb-1">Unique Opens</p>
            <p className="text-xl font-bold text-brand">{metrics.uniqueOpens}</p>
          </div>
        )}
        {metrics.trackClicks && (
          <div className="rounded-lg bg-white border border-border-light shadow-card p-4 transition-all hover:border-brand/10">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.05em] mb-1">Unique Clicks</p>
            <p className="text-xl font-bold text-brand">{metrics.uniqueClicks}</p>
          </div>
        )}
        <div className="rounded-lg bg-white border border-border-light shadow-card p-4 transition-all hover:border-brand/10">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.05em] mb-1">Total Replies</p>
          <p className="text-xl font-bold text-brand">{metrics.repliedCount ?? 0}</p>
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border-light mt-4">
        <button
          className={cn(
            "px-6 py-3 text-xs font-bold transition-all border-b-2",
            activeSection === "emails"
              ? "text-brand border-brand"
              : "text-text-muted border-transparent hover:text-text-secondary hover:border-border-light"
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
                : "text-text-muted border-transparent hover:text-text-secondary hover:border-border-light"
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
                className="rounded-lg border border-border-light p-3 space-y-2
                  opacity-0 animate-[fade-in_0.15s_ease-out_forwards]"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <p className="text-xs font-medium text-text-primary truncate">{email.toEmail}</p>
                <div className="flex items-center gap-3 text-[11px]">
                  {metrics.trackOpens && (
                    <span className="flex items-center gap-1 text-brand">
                      <Eye className="h-3 w-3" /> {email.openCount} opens
                    </span>
                  )}
                  {metrics.trackClicks && (
                    <span className="flex items-center gap-1 text-brand">
                      <MousePointerClick className="h-3 w-3" /> {email.clickCount} clicks
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  {email.lastOpenAt && <span>Last open: {formatTime(email.lastOpenAt)}</span>}
                  {email.lastClickAt && <span>Last click: {formatTime(email.lastClickAt)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="text-[10px] text-text-muted uppercase tracking-widest border-b border-border-light">
                <th className="text-left py-4 px-4 font-bold">Recipient</th>
                {metrics.trackOpens && (
                  <th className="text-center py-4 px-4 font-bold cursor-pointer hover:text-text-secondary" onClick={() => toggleSort("openCount")}>
                    <span className="inline-flex items-center gap-1">Opens <ArrowUpDown className="h-2.5 w-2.5" /></span>
                  </th>
                )}
                {metrics.trackClicks && (
                  <th className="text-center py-4 px-4 font-bold cursor-pointer hover:text-text-secondary" onClick={() => toggleSort("clickCount")}>
                    <span className="inline-flex items-center gap-1">Clicks <ArrowUpDown className="h-2.5 w-2.5" /></span>
                  </th>
                )}
                <th className="text-right py-4 px-4 font-bold cursor-pointer hover:text-text-secondary" onClick={() => toggleSort("lastOpenAt")}>
                  <span className="inline-flex items-center gap-1">Activity <ArrowUpDown className="h-2.5 w-2.5" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F1F3]">
              {sortedEmails.map((email) => (
                <tr
                  key={email.emailJobId}
                  className="hover:bg-[#F0F1F3] transition-colors group"
                >
                  <td className="py-4 px-4 text-xs font-semibold text-text-primary truncate max-w-[200px]">{email.toEmail}</td>
                  {metrics.trackOpens && (
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all",
                        email.openCount > 0 ? "bg-brand-light text-brand" : "bg-[#F8F9FA] text-text-muted"
                      )}>
                        {email.openCount}
                      </span>
                    </td>
                  )}
                  {metrics.trackClicks && (
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all",
                        email.clickCount > 0 ? "bg-brand-light text-brand" : "bg-[#F8F9FA] text-text-muted"
                      )}>
                        {email.clickCount}
                      </span>
                    </td>
                  )}
                  <td className="py-4 px-4 text-right text-[10px] text-text-muted font-medium">
                    {email.lastOpenAt ? (
                      <span className="text-brand">Open: {formatTime(email.lastOpenAt)}</span>
                    ) : email.lastClickAt ? (
                      <span className="text-brand">Click: {formatTime(email.lastClickAt)}</span>
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
            <div className="text-center py-12 rounded-lg bg-[#F8F9FA] border border-dashed border-border-light">
              <Link2 className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-muted font-medium tracking-tight">No link clicks recorded yet</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border-light overflow-hidden divide-y divide-[#F0F1F3] bg-white shadow-card">
              {links.map((link) => (
                <div
                  key={link.url}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#F0F1F3] transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-brand-light border border-brand/10 flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary truncate">{link.url}</p>
                    <p className="text-[10px] text-text-muted font-medium">Link tracked in campaign</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-text-primary leading-tight">{link.clickCount}</p>
                    <p className="text-[10px] font-bold text-brand/70 uppercase tracking-widest">Total Clicks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-text-muted text-center leading-relaxed">
        Open tracking relies on image loading - some email clients block images by default, so open rates may undercount.
        Apple Mail Privacy Protection may inflate open rates by pre-fetching images.
      </p>
    </div>
  );
}

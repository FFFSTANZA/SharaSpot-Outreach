"use client";

import { useEffect, useState, useCallback } from "react";
import { getTrackingMetrics, getTrackingEmails, getLinkAnalytics } from "@/lib/apis";
import type { TrackingMetrics, TrackingEmailDetail, LinkAnalyticsDetail } from "@/types";
import {
  Eye, MousePointerClick, Send, AlertTriangle, ExternalLink,
  Mail, RefreshCw, MessageSquare, EyeOff, Link2, Users,
  CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsTabProps {
  campaignId: string;
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  colorClass,
  bgClass,
  iconColorClass 
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  colorClass: string;
  bgClass: string;
  iconColorClass: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4 flex items-start gap-3", bgClass)}>
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bgClass.split(" ")[0])}>
        <Icon className={cn("h-5 w-5", iconColorClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-xl font-bold", colorClass)}>{value}</p>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        {subtext && <p className="text-[10px] text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

type SortField = "openCount" | "clickCount" | "lastOpenAt" | "lastClickAt";
type SortDir = "asc" | "desc";

export default function AnalyticsTab({ campaignId }: AnalyticsTabProps) {
  const [metrics, setMetrics] = useState<TrackingMetrics | null>(null);
  const [emails, setEmails] = useState<TrackingEmailDetail[]>([]);
  const [linkAnalytics, setLinkAnalytics] = useState<LinkAnalyticsDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("openCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeSection, setActiveSection] = useState<"overview" | "emails" | "links">("overview");
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, e, l] = await Promise.all([
        getTrackingMetrics(campaignId),
        getTrackingEmails(campaignId),
        getLinkAnalytics(campaignId),
      ]);
      setMetrics(m);
      setEmails(e.emails);
      setLinkAnalytics(l.links);
    } catch {
      setError("Failed to load analytics data");
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
    if (!iso) return "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  };

  const formatDateTime = (iso: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  };

  const truncateUrl = (url: string, maxLen = 50) => {
    if (url.length <= maxLen) return url;
    return url.substring(0, maxLen) + "...";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="h-8 w-8 text-red-300" />
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={fetchData} className="text-sm text-brand hover:underline">Retry</button>
      </div>
    );
  }

  if (!metrics) return null;

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

  if (metrics.totalSent === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
          <Mail className="h-6 w-6 text-gray-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">No analytics data yet</h3>
        <p className="text-xs text-gray-500 max-w-xs text-center">
          Analytics will appear here once emails are sent.
        </p>
      </div>
    );
  }

  const openPercent = metrics.totalSent > 0 ? Math.round((metrics.uniqueOpens / metrics.totalSent) * 100) : 0;
  const notOpenPercent = metrics.totalSent > 0 ? 100 - openPercent : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Section tabs */}
      <div className="flex border-b border-gray-100">
        <button
          className={cn(
            "flex-1 px-4 py-2.5 text-xs font-bold transition-all relative flex items-center justify-center gap-2 tracking-widest uppercase",
            activeSection === "overview"
              ? "text-brand"
              : "text-gray-400 hover:text-gray-600"
          )}
          onClick={() => setActiveSection("overview")}
        >
          Overview
          {activeSection === "overview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
        </button>
        <button
          className={cn(
            "flex-1 px-4 py-2.5 text-xs font-bold transition-all relative flex items-center justify-center gap-2 tracking-widest uppercase",
            activeSection === "emails"
              ? "text-brand"
              : "text-gray-400 hover:text-gray-600"
          )}
          onClick={() => setActiveSection("emails")}
        >
          <Mail className="h-3.5 w-3.5" />
          Per Email
          {activeSection === "emails" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
        </button>
        {metrics.trackClicks && (
          <button
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-bold transition-all relative flex items-center justify-center gap-2 tracking-widest uppercase",
              activeSection === "links"
                ? "text-brand"
                : "text-gray-400 hover:text-gray-600"
            )}
            onClick={() => setActiveSection("links")}
          >
            <Link2 className="h-3.5 w-3.5" />
            Links
            {activeSection === "links" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
        )}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Reached & Opened Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> Delivery & Opens
            </h3>
            
            {/* Reached card */}
            <MetricCard
              icon={Send}
              label="Reached"
              value={metrics.totalSent}
              subtext="Total emails delivered"
              colorClass="text-gray-900"
              bgClass="bg-gray-50 border-gray-100"
              iconColorClass="text-gray-600"
            />

            {/* Opened vs Not Opened */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={Eye}
                label="Opened"
                value={metrics.uniqueOpens}
                subtext={`${openPercent}% open rate`}
                colorClass="text-brand"
                bgClass="bg-brand-light border-brand-muted"
                iconColorClass="text-brand"
              />
              <MetricCard
                icon={EyeOff}
                label="Not Opened"
                value={metrics.notOpened}
                subtext={`${notOpenPercent}% not opened`}
                colorClass="text-gray-600"
                bgClass="bg-gray-50 border-gray-100"
                iconColorClass="text-gray-400"
              />
            </div>
          </div>

          {/* Engagement Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" /> Engagement
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={MousePointerClick}
                label="Link Clicks"
                value={metrics.uniqueClicks}
                subtext={`${metrics.clickRate}% click rate`}
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50 border-emerald-100"
                iconColorClass="text-emerald-500"
              />
              <MetricCard
                icon={MessageSquare}
                label="Replies"
                value={metrics.repliedCount ?? 0}
                subtext={`${metrics.replyRate}% reply rate`}
                colorClass="text-blue-600"
                bgClass="bg-blue-50 border-blue-100"
                iconColorClass="text-blue-500"
              />
            </div>
          </div>

          {/* Quick stats summary */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Reached</span>
                <span className="font-semibold text-gray-900">{metrics.totalSent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Opened</span>
                <span className="font-bold text-brand">{metrics.uniqueOpens} ({openPercent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Not Opened</span>
                <span className="font-medium text-gray-500">{metrics.notOpened} ({notOpenPercent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clicked Links</span>
                <span className="font-bold text-emerald-600">{metrics.uniqueClicks} ({metrics.clickRate}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Replied</span>
                <span className="font-bold text-blue-600">{metrics.repliedCount ?? 0} ({metrics.replyRate}%)</span>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex justify-end">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Per-Email Section */}
      {activeSection === "emails" && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-light text-brand border border-brand-muted">
              <CheckCircle2 className="h-3 w-3" />
              {emails.filter(e => e.openCount > 0).length} opened
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-100">
              <XCircle className="h-3 w-3" />
              {emails.filter(e => e.openCount === 0).length} not opened
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MousePointerClick className="h-3 w-3" />
              {emails.filter(e => e.clickCount > 0).length} clicked
            </span>
          </div>

          {/* Email table */}
          <div className="overflow-x-auto">
            <div className="md:hidden space-y-2">
              {sortedEmails.map((email) => (
                <div
                  key={email.emailJobId}
                  className="rounded-xl border border-gray-100 p-3 space-y-2"
                >
                  <p className="text-xs font-medium text-gray-900 truncate">{email.toEmail}</p>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    {metrics.trackOpens && (
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full",
                        email.openCount > 0 ? "bg-brand-light text-brand" : "bg-gray-50 text-gray-400"
                      )}>
                        <Eye className="h-3 w-3" /> {email.openCount} opens
                      </span>
                    )}
                    {metrics.trackClicks && (
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full",
                        email.clickCount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                      )}>
                        <MousePointerClick className="h-3 w-3" /> {email.clickCount} clicks
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
                  <th className="text-left py-3 px-3">Recipient</th>
                  {metrics.trackOpens && (
                    <th className="text-center py-3 px-3 cursor-pointer hover:text-brand" onClick={() => toggleSort("openCount")}>
                      <span className="inline-flex items-center gap-1">Opens <RefreshCw className={cn("h-3 w-3", sortField === "openCount" && "text-brand")} /></span>
                    </th>
                  )}
                  {metrics.trackClicks && (
                    <th className="text-center py-3 px-3 cursor-pointer hover:text-brand" onClick={() => toggleSort("clickCount")}>
                      <span className="inline-flex items-center gap-1">Clicks <RefreshCw className={cn("h-3 w-3", sortField === "clickCount" && "text-brand")} /></span>
                    </th>
                  )}
                  <th className="text-right py-3 px-3 cursor-pointer hover:text-brand" onClick={() => toggleSort("lastOpenAt")}>
                    <span className="inline-flex items-center gap-1">Last Open <RefreshCw className={cn("h-3 w-3", sortField === "lastOpenAt" && "text-brand")} /></span>
                  </th>
                  <th className="text-right py-3 px-3 cursor-pointer hover:text-brand" onClick={() => toggleSort("lastClickAt")}>
                    <span className="inline-flex items-center gap-1">Last Click <RefreshCw className={cn("h-3 w-3", sortField === "lastClickAt" && "text-brand")} /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEmails.map((email) => (
                  <tr key={email.emailJobId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3 text-xs text-gray-900 font-medium truncate max-w-[200px]">{email.toEmail}</td>
                    {metrics.trackOpens && (
                      <td className="py-3 px-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                          email.openCount > 0 ? "bg-brand-light text-brand" : "bg-gray-50 text-gray-400"
                        )}>
                          {email.openCount}
                        </span>
                      </td>
                    )}
                    {metrics.trackClicks && (
                      <td className="py-3 px-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                          email.clickCount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                        )}>
                          {email.clickCount}
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right text-[11px] text-gray-500">{formatTime(email.lastOpenAt)}</td>
                    <td className="py-2.5 px-3 text-right text-[11px] text-gray-500">{formatTime(email.lastClickAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Links Section */}
      {activeSection === "links" && (
        <div className="space-y-3">
          {linkAnalytics.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No link clicks recorded yet</p>
              <p className="text-xs text-gray-400 mt-1">Links will appear here when recipients click on them</p>
            </div>
          ) : (
            linkAnalytics.map((link) => (
              <div key={link.url} className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Link header */}
                <button
                  onClick={() => setExpandedLink(expandedLink === link.url ? null : link.url)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900 truncate pr-2">{truncateUrl(link.url, 60)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {link.uniqueEmails} unique · {link.totalClicks} total clicks
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-[11px] font-semibold text-brand">
                    <MousePointerClick className="h-3 w-3" />
                    {link.totalClicks}
                  </span>
                </button>

                {/* Expanded email details */}
                {expandedLink === link.url && (
                  <div className="border-t border-gray-50 bg-gray-50/30 p-4 space-y-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Who clicked this link</p>
                    {link.emails.map((email) => (
                      <div key={email.emailJobId} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-700 truncate max-w-[200px]">{email.toEmail}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatDateTime(email.clickedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        Open tracking relies on image loading — some email clients block images by default, so open rates may undercount.
        Apple Mail Privacy Protection may inflate open rates by pre-fetching images.
      </p>
    </div>
  );
}

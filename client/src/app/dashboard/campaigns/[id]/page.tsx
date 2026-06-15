"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCampaignById, toggleReplied } from "@/lib/apis";
import type { CampaignDetail } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";
import { TopBar } from "../../Topbar";
import StatusBadge from "@/components/StatusBadge";
import CampaignControls from "@/components/CampaignControls";
import SequenceView from "./SequenceView";
import SenderStats from "./SenderStats";
import ThrottlePanel from "./ThrottlePanel";
import AnalyticsTab from "./AnalyticsTab";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Mail,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Filter,
  Ban,
  Layout,
  BarChart3,
  TrendingUp,
} from "lucide-react";

type CampaignStatus = "SCHEDULED" | "SENDING" | "PAUSED" | "CANCELLED" | "COMPLETED";

const POLL_INTERVAL_MS = 10_000;
const ACTIVE_STATUSES: CampaignStatus[] = ["SENDING", "SCHEDULED"];

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"emails" | "sequence" | "analytics">("emails");
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCampaign = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCampaignById(id);
      setCampaign(data);
    } catch {
      setError("Failed to load campaign.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  // Polling for live updates when campaign is active
  useEffect(() => {
    const terminalStatuses: CampaignStatus[] = ["COMPLETED", "CANCELLED"];
    if (campaign && terminalStatuses.includes(campaign.status as CampaignStatus)) return;

    pollRef.current = setInterval(async () => {
      try {
        const data = await getCampaignById(id);
        setCampaign(data);
        if (terminalStatuses.includes(data.status as CampaignStatus)) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        // Silent fail on poll
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [id, campaign?.status]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));

  const handleStatusChange = (newStatus: CampaignStatus) => {
    if (campaign) {
      setCampaign({ ...campaign, status: newStatus });
    }
  };

  const handleToggleReplied = async (emailId: string) => {
    try {
      const updated = await toggleReplied(emailId);
      if (campaign) {
        setCampaign({
          ...campaign,
          emails: campaign.emails.map((e) =>
            e.id === emailId ? { ...e, isReplied: updated.isReplied } : e
          ),
        });
      }
    } catch { }
  };

  const repliedCount = campaign ? campaign.emails.filter((e) => e.isReplied).length : 0;
  const sentCount = campaign ? campaign._count.sent : 0;
  const replyRate = sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : "0.0";

  const showSenderFilter = campaign
    ? (campaign.senderPool?.length ?? 0) > 1
    : false;

  const showSenderStats = campaign
    ? (campaign.senderStats?.length ?? 0) > 0
    : false;

  const filteredEmails = campaign
    ? senderFilter === "all"
      ? campaign.emails
      : campaign.emails.filter((e) => e.senderId === senderFilter || e.sender?.id === senderFilter)
    : [];

  const statCards = campaign ? [
    { label: "Sent", count: campaign._count.sent, icon: CheckCircle2, color: "text-brand", bg: "bg-brand-light" },
    { label: "Replied", count: repliedCount, icon: MessageSquare, color: "text-brand", bg: "bg-brand-light" },
    { label: "Reply Rate", count: `${replyRate}%`, icon: TrendingUp, color: "text-brand", bg: "bg-brand-light" },
    { label: "Failed", count: campaign._count.failed, icon: XCircle, color: "text-error-text", bg: "bg-error-bg" },
    { label: "Pending", count: campaign._count.pending, icon: Clock, color: "text-text-muted", bg: "bg-[#F8F9FA]" },
    { label: "Cancelled", count: campaign._count.cancelled, icon: Ban, color: "text-text-muted", bg: "bg-[#F8F9FA]" },
  ] : [];

  return (
    <AuthGuard requirePremium={true}>
        <div className="flex-1 flex flex-col min-w-0">
            <TopBar placeholder="Search..." />

            {isLoading ? (
              <div className="flex-1 px-4 md:px-6 py-6 space-y-6">
                <div className="h-10 w-48 bg-[#F8F9FA] rounded-lg animate-pulse" />
                <div className="rounded-lg bg-white border border-border-light p-8 animate-pulse space-y-6">
                  <div className="h-8 w-1/2 bg-[#F8F9FA] rounded-lg" />
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-24 bg-[#F8F9FA] rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-text-muted" />
                <p className="text-sm text-text-secondary">{error}</p>
                <button onClick={fetchCampaign} className="text-sm text-brand font-semibold hover:underline">Retry</button>
              </div>
            ) : campaign ? (
              <div className="px-4 md:px-6 py-6 md:py-8 space-y-8">
                {/* Back button */}
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </button>

                {/* Campaign header card */}
                <div className="rounded-lg bg-white border border-border-light shadow-card p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                          {campaign.subject}
                        </h1>
                        <StatusBadge status={campaign.status} size="md" pauseReason={campaign.pauseReason} />
                      </div>
                      <p className="text-sm text-text-secondary">
                        Sender: <span className="text-text-primary font-semibold">{campaign.sender?.email || "No sender assigned"}</span>
                      </p>
                    </div>
                    <div className="shrink-0">
                      <CampaignControls
                        campaignId={campaign.id}
                        status={campaign.status}
                        pendingCount={campaign._count.pending}
                        subject={campaign.subject}
                        onStatusChange={handleStatusChange}
                        size="md"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-muted">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F9FA] rounded-lg border border-border-light">
                      <Users className="h-3.5 w-3.5" />
                      {campaign.totalRecipients} <span className="font-normal">recipients</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F9FA] rounded-lg border border-border-light">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-normal">Created</span> {formatDate(campaign.startTime)}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F9FA] rounded-lg border border-border-light">
                      <Clock className="h-3.5 w-3.5" />
                      {campaign.delaySeconds}s <span className="font-normal">interval</span>
                    </div>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {statCards.map((card) => (
                    <div
                      key={card.label}
                      className="group rounded-lg bg-white border border-border-light shadow-card p-5 flex flex-col gap-4 transition-all hover:border-brand/20"
                    >
                      <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-text-primary tracking-tight">{card.count}</p>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sender Stats */}
                {showSenderStats && (
                  <SenderStats senderStats={campaign.senderStats} />
                )}

                {/* Throttle Panel */}
                <ThrottlePanel
                  campaignId={campaign.id}
                  isActive={ACTIVE_STATUSES.includes(campaign.status as CampaignStatus)}
                />

                {/* Tabs */}
                <div className="rounded-lg bg-white border border-border-light shadow-card overflow-hidden">
                  <div className="flex border-b border-border-light bg-[#F8F9FA] p-1 gap-1">
                    {[
                      { id: "emails", icon: Mail, label: `Emails (${campaign.emails.length})` },
                      { id: "sequence", icon: Layout, label: "Sequence" },
                      { id: "analytics", icon: BarChart3, label: "Analytics" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className={cn(
                          "flex-1 px-4 py-2.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2",
                          activeTab === tab.id
                            ? "bg-white text-brand shadow-premium-sm"
                            : "text-text-muted hover:text-text-secondary"
                        )}
                        onClick={() => setActiveTab(tab.id as "emails" | "sequence" | "analytics")}
                      >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-brand" : "text-text-muted")} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[400px]">
                    {activeTab === "emails" ? (
                      <div>
                        {showSenderFilter && (
                          <div className="px-6 py-4 border-b border-border-light flex items-center gap-3 bg-white">
                             <Filter className="h-4 w-4 text-text-muted" />
                             <select
                               value={senderFilter}
                               onChange={(e) => setSenderFilter(e.target.value)}
                               className="text-xs font-bold text-text-secondary bg-[#F8F9FA] border border-border-light rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                             >
                              <option value="all">All senders</option>
                              {campaign.senderPool.map((s) => (
                                <option key={s.senderId} value={s.senderId}>
                                  {s.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="divide-y divide-[#F0F1F3]">
                          {filteredEmails.map((email) => (
                            <div
                              key={email.id}
                              className="px-6 py-5 flex items-center justify-between gap-6 hover:bg-[#F0F1F3] transition-all group/row"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-1.5">
                                  <p className="text-sm font-semibold text-text-primary truncate">{email.toEmail}</p>
                                  {email.sender && (
                                    <span className="text-[10px] font-semibold text-text-muted bg-[#F8F9FA] border border-border-light rounded-md px-2 py-0.5">
                                      via {email.sender.email.split('@')[0]}
                                    </span>
                                  )}
                                  {email.isReplied && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-bold">
                                      <MessageSquare className="h-3 w-3" /> Replied
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-text-muted font-medium flex items-center gap-2">
                                  {email.status === "SENT" ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                                      {formatDate(email.sentAt!)}
                                    </>
                                  ) : email.status === "FAILED" ? (
                                    <>
                                      <XCircle className="h-3.5 w-3.5 text-error-text" />
                                      Failed · {email.sentAt ? formatDate(email.sentAt) : formatDate(email.scheduledAt)}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3.5 w-3.5 text-text-muted" />
                                      {email.status} · {formatDate(email.scheduledAt)}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                {email.status === "SENT" && (
                                  <button
                                    onClick={() => handleToggleReplied(email.id)}
                                    className={cn(
                                      "px-4 py-2 rounded-lg text-[10px] font-bold transition-all border shadow-premium-sm",
                                      email.isReplied
                                        ? "bg-brand text-white border-brand"
                                        : "bg-white text-text-muted border-border-light hover:border-border-light"
                                    )}
                                  >
                                    {email.isReplied ? "Replied" : "Mark Replied"}
                                  </button>
                                )}
                                <div className="flex items-center gap-2 min-w-[80px] justify-end">
                                  <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    email.status === "SENT" ? "bg-brand" :
                                      email.status === "FAILED" ? "bg-red-500" :
                                        email.status === "SENDING" ? "bg-brand animate-pulse" :
                                          email.status === "PENDING" ? "bg-amber-500" : "bg-[#F0F1F3]"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    email.status === "SENT" ? "text-brand" :
                                      email.status === "FAILED" ? "text-error-text" :
                                        email.status === "SENDING" ? "text-brand" :
                                          email.status === "PENDING" ? "text-text-muted" : "text-text-muted"
                                  )}>
                                    {email.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : activeTab === "sequence" ? (
                      <div className="p-8">
                        <SequenceView campaignId={campaign.id} />
                      </div>
                    ) : (
                      <div className="p-8">
                        <AnalyticsTab campaignId={campaign.id} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
        </div>
    </AuthGuard>
  );
}

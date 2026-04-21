"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getCampaignById, toggleReplied } from "@/lib/apis";
import type { CampaignDetail } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "../../Sidebar";
import { TopBar } from "../../Topbar";
import { SidebarProvider } from "@/context/SidebarContext";
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
  Inbox,
  Clock,
  Send,
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
  Star,
} from "lucide-react";

type CampaignStatus = "SCHEDULED" | "SENDING" | "PAUSED" | "CANCELLED" | "COMPLETED";

const POLL_INTERVAL_MS = 10_000;
const ACTIVE_STATUSES: CampaignStatus[] = ["SENDING", "SCHEDULED"];

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("Campaign");
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
    if (!campaign) return;

    const isActive = ACTIVE_STATUSES.includes(campaign.status as CampaignStatus);

    if (isActive) {
      pollRef.current = setInterval(async () => {
        try {
          const data = await getCampaignById(id);
          setCampaign(data);
        } catch {
          // Silent fail on poll
        }
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [campaign?.status, id]);

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
    { label: "Failed", count: campaign._count.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Pending", count: campaign._count.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Cancelled", count: campaign._count.cancelled, icon: Ban, color: "text-gray-500", bg: "bg-gray-100" },
  ] : [];

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar
            setLabel={setLabel}
            items={[
              { label: "All", icon: <Inbox size={18} /> },
              { label: "Starred", icon: <Star size={18} /> },
              { label: "Scheduled", icon: <Clock size={18} /> },
              { label: "Sent", icon: <Send size={18} /> },
            ]}
            profile={{
              name: "User",
              email: "user@example.com",
              avatarUrl: ""
            }}
          />

          <main className="flex flex-1 flex-col min-w-0 overflow-y-auto">
            <TopBar placeholder="Search..." />

            {isLoading ? (
              <div className="flex-1 px-4 md:px-6 py-6 space-y-6">
                <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse" />
                <div className="rounded-xl bg-white border border-gray-100 p-8 animate-pulse space-y-6">
                  <div className="h-8 w-1/2 bg-gray-100 rounded-lg" />
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-50 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-text-secondary">{error}</p>
                <button onClick={fetchCampaign} className="text-sm text-brand font-semibold hover:underline">Retry</button>
              </div>
            ) : campaign ? (
              <div className="px-4 md:px-6 py-6 md:py-8 space-y-8">
                {/* Back button */}
                <button
                  onClick={() => router.push("/dashboard/campaigns")}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-gray-900 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to campaigns
                </button>

                {/* Campaign header card */}
                <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                          {campaign.subject}
                        </h1>
                        <StatusBadge status={campaign.status} size="md" pauseReason={campaign.pauseReason} />
                      </div>
                      <p className="text-sm text-text-secondary">
                        Sender: <span className="text-gray-900 font-semibold">{campaign.sender.email}</span>
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
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Users className="h-3.5 w-3.5" />
                      {campaign.totalRecipients} <span className="font-normal">recipients</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-normal">Created</span> {formatDate(campaign.startTime)}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
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
                      className="group rounded-xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col gap-4 transition-all hover:border-brand/20"
                    >
                      <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 tracking-tight">{card.count}</p>
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
                <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-100 bg-gray-50/50 p-1 gap-1">
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
                            ? "bg-white text-brand shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                        onClick={() => setActiveTab(tab.id as any)}
                      >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-brand" : "text-gray-400")} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[400px]">
                    {activeTab === "emails" ? (
                      <div>
                        {showSenderFilter && (
                          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-white">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                              value={senderFilter}
                              onChange={(e) => setSenderFilter(e.target.value)}
                              className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all"
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

                        <div className="divide-y divide-gray-50">
                          {filteredEmails.map((email) => (
                            <div
                              key={email.id}
                              className="px-6 py-5 flex items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group/row"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-1.5">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{email.toEmail}</p>
                                  {email.sender && (
                                    <span className="text-[10px] font-semibold text-text-muted bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
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
                                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                                      Failed · {email.sentAt ? formatDate(email.sentAt) : formatDate(email.scheduledAt)}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3.5 w-3.5 text-amber-500" />
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
                                      "px-4 py-2 rounded-lg text-[10px] font-bold transition-all border shadow-sm",
                                      email.isReplied
                                        ? "bg-brand text-white border-brand"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
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
                                          email.status === "PENDING" ? "bg-amber-500" : "bg-gray-400"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    email.status === "SENT" ? "text-brand" :
                                      email.status === "FAILED" ? "text-red-500" :
                                        email.status === "SENDING" ? "text-brand" :
                                          email.status === "PENDING" ? "text-amber-600" : "text-gray-500"
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
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

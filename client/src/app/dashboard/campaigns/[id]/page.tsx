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
  Loader2,
  TrendingUp,
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
          // Silent fail on poll — stale data shown until next poll
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
    } catch {
      // Silently fail — could add toast
    }
  };

  const repliedCount = campaign ? campaign.emails.filter((e) => e.isReplied).length : 0;
  const sentCount = campaign ? campaign._count.sent : 0;
  const replyRate = sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : "0.0";

  // Determine if sender filter should be shown (multi-sender campaigns only)
  const showSenderFilter = campaign
    ? (campaign.senderPool?.length ?? 0) > 1
    : false;

  // Determine if sender stats should be shown
  const showSenderStats = campaign
    ? (campaign.senderStats?.length ?? 0) > 0
    : false;

  // Filter emails by selected sender
  const filteredEmails = campaign
    ? senderFilter === "all"
      ? campaign.emails
      : campaign.emails.filter((e) => e.senderId === senderFilter || e.sender?.id === senderFilter)
    : [];

  const statCards = campaign ? [
    { label: "Sent", count: campaign._count.sent, icon: CheckCircle2, color: "text-brand", bg: "bg-brand-light" },
    { label: "Replied", count: repliedCount, icon: MessageSquare, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Reply Rate", count: `${replyRate}%`, icon: TrendingUp, color: "text-brand", bg: "bg-brand-light" },
    { label: "Failed", count: campaign._count.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Pending", count: campaign._count.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Cancelled", count: campaign._count.cancelled, icon: Ban, color: "text-gray-500", bg: "bg-gray-100" },
  ] : [];

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50/50">
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

          <main className="flex flex-1 flex-col min-w-0 overflow-y-auto">
            <TopBar placeholder="Search..." />

            {isLoading ? (
              <div className="flex-1 px-3 md:px-6 py-6 space-y-4">
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="rounded-2xl bg-white border border-gray-100 p-6 animate-pulse">
                  <div className="h-5 w-2/3 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-1/3 bg-gray-50 rounded mb-6" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-50 rounded-2xl" />
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">{error}</p>
                <button onClick={fetchCampaign} className="text-sm text-brand hover:underline font-black uppercase tracking-widest">Retry</button>
              </div>
            ) : campaign ? (
              <div className="px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* Back button */}
                <button
                  onClick={() => router.push("/dashboard/campaigns")}
                  className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to campaigns
                </button>

                {/* Campaign header card */}
                <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                          {campaign.subject}
                        </h1>
                        <StatusBadge status={campaign.status} size="md" pauseReason={campaign.pauseReason} />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        Sender: <span className="text-gray-900 font-bold">{campaign.sender.email}</span>
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

                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {campaign.totalRecipients} <span className="font-medium text-gray-400">recipients</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-400">Created </span> {formatDate(campaign.startTime)}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {campaign.delaySeconds}s <span className="font-medium text-gray-400">interval</span>
                    </div>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {statCards.map((card) => (
                    <div
                      key={card.label}
                      className="group rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] p-4 flex flex-col gap-3 transition-all hover:border-brand/20"
                    >
                      <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{card.count}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
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
                <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="flex border-b border-gray-50 bg-gray-50/30 p-2 gap-2">
                    {[
                      { id: "emails", icon: Mail, label: `Emails (${campaign.emails.length})` },
                      { id: "sequence", icon: Layout, label: "Sequence" },
                      { id: "analytics", icon: BarChart3, label: "Analytics" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className={cn(
                          "flex-1 px-4 py-3 text-[10px] font-black transition-all rounded-xl flex items-center justify-center gap-2 tracking-widest uppercase",
                          activeTab === tab.id
                            ? "bg-brand text-white shadow-lg shadow-brand/20"
                            : "text-gray-400 hover:text-gray-600 hover:bg-white"
                        )}
                        onClick={() => setActiveTab(tab.id as any)}
                      >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-white" : "text-gray-400")} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {activeTab === "emails" ? (
                    <div>
                      {showSenderFilter && (
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                          <Filter className="h-4 w-4 text-gray-400" />
                          <select
                            value={senderFilter}
                            onChange={(e) => setSenderFilter(e.target.value)}
                            className="text-[11px] font-black uppercase tracking-widest text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20"
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
                        {filteredEmails.map((email, index) => (
                          <div
                            key={email.id}
                            className="px-6 py-5 flex items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group/row
                              opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
                            style={{ animationDelay: `${index * 40}ms` }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-1.5">
                                <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{email.toEmail}</p>
                                {email.sender && (
                                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5">
                                    via {email.sender.email.split('@')[0]}
                                  </span>
                                )}
                                {email.isReplied && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-brand text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">
                                    <MessageSquare className="h-2.5 w-2.5" /> Replied
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold flex items-center gap-2 uppercase tracking-wider">
                                {email.status === "SENT" ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-brand" />
                                    {formatDate(email.sentAt!)}
                                  </>
                                ) : email.status === "FAILED" ? (
                                  <>
                                    <XCircle className="h-3 w-3 text-red-500" />
                                    Failed · {email.sentAt ? formatDate(email.sentAt) : formatDate(email.scheduledAt)}
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 text-amber-500" />
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
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                                    email.isReplied
                                      ? "bg-brand text-white border-transparent shadow-brand/20"
                                      : "bg-white text-gray-500 border-gray-200 hover:border-brand/30 hover:text-brand"
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
                                  "text-[10px] font-black uppercase tracking-widest",
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
                    <div className="p-6">
                      <SequenceView campaignId={campaign.id} />
                    </div>
                  ) : (
                    <AnalyticsTab campaignId={campaign.id} />
                  )}
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

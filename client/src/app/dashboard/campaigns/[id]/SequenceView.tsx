"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSequence, pauseRecipientSequence, resumeRecipientSequence,
  stopRecipientSequence, pauseAllSequence, resumeAllSequence, stopAllSequence
} from "@/lib/apis";
import type { SequenceResponse, StepStatusType, StepAnalyticsType } from "@/types";
import Button from "@/components/Button";
import {
  Pause, Play, Square, ChevronDown, CheckCircle2, Clock,
  XCircle, AlertCircle, SkipForward, MessageSquare, Mail,
  TrendingUp, Target, Eye, MousePointer2, Clock4, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SequenceViewProps {
  campaignId: string;
}

const STEP_STATUS_STYLES: Record<string, string> = {
  PENDING: "text-gray-500 bg-gray-100",
  SCHEDULED: "text-brand bg-brand-light",
  SENT: "text-emerald-600 bg-emerald-50",
  FAILED: "text-red-600 bg-red-50",
  SKIPPED: "text-gray-400 bg-gray-50",
};

const STEP_STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  SCHEDULED: Clock,
  SENT: CheckCircle2,
  FAILED: XCircle,
  SKIPPED: SkipForward,
};

function formatDate(iso: string | null) {
  return iso
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso))
    : "-";
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SequenceView({ campaignId }: SequenceViewProps) {
  const [data, setData] = useState<SequenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<"overview" | "steps" | "recipients">("overview");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSequence(campaignId);
      setData(res);
    } catch {
      setError("Failed to load sequence data.");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecipientAction = async (recipientId: string, action: "pause" | "resume" | "stop") => {
    setActionLoading(`${recipientId}-${action}`);
    try {
      if (action === "pause") await pauseRecipientSequence(campaignId, recipientId);
      else if (action === "resume") await resumeRecipientSequence(campaignId, recipientId);
      else await stopRecipientSequence(campaignId, recipientId);
      await fetchData();
    } catch {} finally { setActionLoading(null); }
  };

  const handleBulkAction = async (action: "pause" | "resume" | "stop") => {
    setActionLoading(`bulk-${action}`);
    try {
      if (action === "pause") await pauseAllSequence(campaignId);
      else if (action === "resume") await resumeAllSequence(campaignId);
      else await stopAllSequence(campaignId);
      await fetchData();
    } catch {} finally { setActionLoading(null); }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg bg-white border border-gray-100 p-4">
            <div className="h-4 w-1/3 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-1/4 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-8 w-8 text-red-300" />
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={fetchData} className="text-sm text-brand font-semibold hover:underline">Retry</button>
      </div>
    );
  }

  if (!data || !data.hasSequence) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
          <Mail className="h-7 w-7 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">No follow-up sequence configured</p>
        <p className="text-xs text-gray-400 mt-1">This campaign sends a single email per recipient.</p>
      </div>
    );
  }

  const totalSteps = data.steps.length;
  const stepAnalytics = data.stepAnalytics || [];
  const totalSent = stepAnalytics.reduce((s, a) => s + a.sentCount, 0);
  const totalReplied = stepAnalytics.reduce((s, a) => s + a.repliedCount, 0);
  const overallReplyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  const activeRecipients = data.recipients.filter(r => !r.completed);
  const pausedRecipients = data.recipients.filter(r => r.paused);
  const repliedRecipients = data.recipients.filter(r => r.replied);
  const completedRecipients = data.recipients.filter(r => r.completed);

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
          <p className="text-[10px] text-gray-500 mt-1">across {totalSteps} step{(totalSteps) > 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Replies</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalReplied}</p>
          <div className="flex items-center gap-1 mt-1">
            <ProgressBar value={overallReplyRate} max={100} color="bg-brand" />
            <span className="text-[10px] font-bold text-brand">{overallReplyRate}%</span>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeRecipients.length}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {pausedRecipients.length > 0 && `${pausedRecipients.length} paused`}
            {pausedRecipients.length > 0 && repliedRecipients.length > 0 && ' · '}
            {repliedRecipients.length > 0 && `${repliedRecipients.length} replied`}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedRecipients.length}</p>
          <p className="text-[10px] text-gray-500 mt-1">of {data.recipients.length} total</p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {(["overview", "steps", "recipients"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setAnalyticsTab(tab)}
            className={cn(
              "px-3 h-7 rounded-md text-[10px] font-bold capitalize transition-all",
              analyticsTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab === "overview" && <Eye className="h-3 w-3 inline mr-1" />}
            {tab === "steps" && <TrendingUp className="h-3 w-3 inline mr-1" />}
            {tab === "recipients" && <Target className="h-3 w-3 inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Step Performance */}
      {analyticsTab === "steps" && stepAnalytics.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Follow-Up Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {stepAnalytics.map((step) => {
              const isInitial = step.stepNumber === 0;
              return (
                <div key={step.stepNumber} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-bold text-white",
                      isInitial ? "bg-gray-900" : "bg-brand"
                    )}>
                      {step.stepNumber + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-700 truncate">
                      {isInitial ? "Initial Email" : `Follow-up ${step.stepNumber}`}
                    </span>
                  </div>
                  {step.subject && (
                    <p className="text-[10px] text-gray-400 truncate mb-2">{step.subject}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Sent</span>
                      <span className="text-gray-900 font-bold">{step.sentCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Replies</span>
                      <span className="text-brand font-bold">{step.repliedCount}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[11px]">
                      <span className="text-gray-500 font-medium">Reply Rate</span>
                      <span className="text-gray-900 font-bold">{step.replyRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipients Overview */}
      {analyticsTab === "overview" && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Pipeline Overview</h3>
          <div className="space-y-3">
            {stepAnalytics.map((step, i) => {
              const prevSent = i > 0 ? stepAnalytics[i - 1].sentCount : data.recipients.length;
              const dropOff = prevSent - step.sentCount;
              const dropRate = prevSent > 0 ? Math.round((dropOff / prevSent) * 100) : 0;
              return (
                <div key={step.stepNumber} className="flex items-center gap-3">
                  <span className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                    step.stepNumber === 0 ? "bg-gray-900" : "bg-brand"
                  )}>
                    {step.stepNumber + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        {step.stepNumber === 0 ? "Initial" : `Follow-up ${step.stepNumber}`}
                      </span>
                      <span className="text-[10px] font-bold text-gray-900">{step.sentCount} sent</span>
                    </div>
                    {step.stepNumber > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <ProgressBar value={step.sentCount} max={stepAnalytics[0].sentCount} color="bg-brand" />
                        <span className="text-[9px] text-gray-400 shrink-0">
                          {dropOff > 0 ? `-${dropOff} (${dropRate}%)` : '0 drop-off'}
                        </span>
                      </div>
                    )}
                    {step.stepNumber === 0 && (
                      <ProgressBar value={step.sentCount} max={data.recipients.length} color="bg-gray-900" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="secondary" className="w-auto px-3 py-1.5 rounded-lg text-[11px] font-bold gap-1"
          onClick={() => handleBulkAction("pause")} disabled={!!actionLoading}>
          <Pause className="h-3 w-3" /> Pause All
        </Button>
        <Button variant="secondary" className="w-auto px-3 py-1.5 rounded-lg text-[11px] font-bold gap-1"
          onClick={() => handleBulkAction("resume")} disabled={!!actionLoading}>
          <Play className="h-3 w-3" /> Resume All
        </Button>
        <Button variant="secondary" className="w-auto px-3 py-1.5 rounded-lg text-[11px] font-bold gap-1"
          onClick={() => handleBulkAction("stop")} disabled={!!actionLoading}>
          <Square className="h-3 w-3" /> Stop All
        </Button>
      </div>

      {/* Recipient list */}
      {(analyticsTab === "recipients" || analyticsTab === "overview") && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {data.recipients.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">No recipients yet</p>
              </div>
            ) : (
              data.recipients.map((recipient) => {
                const stepStatuses = (recipient.stepStatuses || []) as StepStatusType[];
                return (
                  <div key={recipient.id}>
                    <div
                      className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedRecipient(expandedRecipient === recipient.id ? null : recipient.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{recipient.recipientEmail}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Step {recipient.currentStep + 1} / {totalSteps}
                          </span>
                          {recipient.paused && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                              <Pause className="h-2 w-2" /> Paused
                            </span>
                          )}
                          {recipient.replied && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-1.5 py-0.5 text-[9px] font-bold text-brand uppercase tracking-widest">
                              <MessageSquare className="h-2 w-2" /> Replied
                            </span>
                          )}
                          {recipient.completed && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                              <CheckCircle2 className="h-2 w-2" /> Done
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {!recipient.completed && (
                          <>
                            {recipient.paused ? (
                              <button className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-light transition-colors"
                                onClick={() => handleRecipientAction(recipient.id, "resume")}
                                disabled={!!actionLoading}>
                                <Play className="h-3 w-3" />
                              </button>
                            ) : (
                              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                onClick={() => handleRecipientAction(recipient.id, "pause")}
                                disabled={!!actionLoading}>
                                <Pause className="h-3 w-3" />
                              </button>
                            )}
                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              onClick={() => handleRecipientAction(recipient.id, "stop")}
                              disabled={!!actionLoading}>
                              <Square className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>

                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 text-gray-300 transition-transform duration-200",
                        expandedRecipient === recipient.id && "rotate-180"
                      )} />
                    </div>

                    <div className={cn(
                      "overflow-hidden transition-all duration-200 ease-out",
                      expandedRecipient === recipient.id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="px-5 pb-3 space-y-1.5">
                        {stepStatuses.map((step: StepStatusType) => {
                          const Icon = STEP_STATUS_ICONS[step.status] ?? Clock;
                          return (
                            <div key={step.stepNumber} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50/50">
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                                STEP_STATUS_STYLES[step.status]
                              )}>
                                <Icon className="h-2.5 w-2.5" />
                                {step.status}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium flex-1">
                                Step {step.stepNumber + 1}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {step.sentAt ? formatDate(step.sentAt) : "-"}
                              </span>
                              {step.error && (
                                <span className="text-[10px] text-red-400 truncate max-w-[150px]" title={step.error}>
                                  {step.error}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

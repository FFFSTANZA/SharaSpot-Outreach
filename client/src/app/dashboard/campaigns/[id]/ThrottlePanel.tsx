"use client";

import { useEffect, useState, useCallback } from "react";
import { getCampaignThrottleStatus } from "@/lib/apis";
import {
  Gauge, Activity, Shield, Snowflake, Flame,
  RefreshCw, ChevronDown, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThrottleSender {
  senderId: string;
  email: string;
  name: string | null;
  currentHourlyCount: number;
  currentDailyCount: number;
  effectiveLimits: { perMinute: number; perHour: number; perDay: number };
  warmupStatus: string;
  cooldownState: { status: string; expiresAt: string | null };
}

interface ThrottlePanelProps {
  campaignId: string;
  isActive: boolean;
}

const WARMUP_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-amber-50", text: "text-amber-700", label: "Warming Up" },
  "opted-out": { bg: "bg-gray-100", text: "text-gray-500", label: "Skipped" },
  inactive: { bg: "bg-brand-light", text: "text-brand", label: "Optimized" },
};

export default function ThrottlePanel({ campaignId, isActive }: ThrottlePanelProps) {
  const [senders, setSenders] = useState<ThrottleSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThrottle = useCallback(async () => {
    try {
      setError(null);
      const data = await getCampaignThrottleStatus(campaignId);
      setSenders(data.senders);
    } catch {
      setError("Failed to load throttle data");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (isOpen) fetchThrottle();
  }, [isOpen, fetchThrottle]);

  // Auto-refresh every 30s when open and campaign is active
  useEffect(() => {
    if (!isOpen || !isActive) return;
    const interval = setInterval(fetchThrottle, 30_000);
    return () => clearInterval(interval);
  }, [isOpen, isActive, fetchThrottle]);

  const getUsagePercent = (current: number, limit: number) =>
    limit > 0 ? Math.min(Math.round((current / limit) * 100), 100) : 0;

  const getBarColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-brand";
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(!isOpen); } }}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Throttle Status</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live rate limits per sender</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOpen && !isLoading && (
            <button
              onClick={(e) => { e.stopPropagation(); fetchThrottle(); }}
              className="p-2 rounded-xl text-gray-400 hover:text-brand hover:bg-brand-light transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-300 transition-transform duration-300",
            isOpen && "rotate-180 text-brand"
          )} />
        </div>
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
            </div>
          ) : senders.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-widest text-gray-300 text-center py-8">No sender data available</p>
          ) : (
            senders.map((sender) => {
              const hourlyPercent = getUsagePercent(sender.currentHourlyCount, sender.effectiveLimits.perHour);
              const dailyPercent = getUsagePercent(sender.currentDailyCount, sender.effectiveLimits.perDay);
              const warmup = WARMUP_COLORS[sender.warmupStatus] ?? WARMUP_COLORS.inactive;
              const isCooldown = sender.cooldownState.status === "active";

              return (
                <div
                  key={sender.senderId}
                  className={cn(
                    "rounded-2xl border p-5 space-y-4 transition-all duration-300",
                    isCooldown ? "border-blue-200 bg-blue-50/20" : "border-gray-100 bg-gray-50/30 hover:border-brand/20"
                  )}
                >
                  {/* Sender header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Gauge className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 truncate tracking-tight">{sender.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Warmup badge */}
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-tight",
                        warmup.bg, warmup.text
                      )}>
                        {sender.warmupStatus === "active" && <Flame className="h-2.5 w-2.5" />}
                        {warmup.label}
                      </span>
                      {/* Cooldown badge */}
                      {isCooldown && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-2 py-1 text-[9px] font-bold uppercase tracking-tight text-blue-700">
                          <Snowflake className="h-2.5 w-2.5" />
                          Cooldown
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hourly usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-400">Hourly Speed</span>
                      <span className="text-gray-900">
                        {sender.currentHourlyCount} / {sender.effectiveLimits.perHour}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", getBarColor(hourlyPercent))}
                        style={{ width: `${hourlyPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-400">Daily Volume</span>
                      <span className="text-gray-900">
                        {sender.currentDailyCount} / {sender.effectiveLimits.perDay}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", getBarColor(dailyPercent))}
                        style={{ width: `${dailyPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Per-minute limit info */}
                  <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-300 pt-2 border-t border-gray-100/50">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3" />
                      {sender.effectiveLimits.perMinute} / min limit
                    </span>
                    {isCooldown && sender.cooldownState.expiresAt && (
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Snowflake className="h-3 w-3" />
                        Ends {new Date(sender.cooldownState.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

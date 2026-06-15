"use client";

import { useState } from "react";
import type { SenderStat } from "@/types";
import { Mail, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SenderStatsProps {
  senderStats: SenderStat[];
}

export default function SenderStats({ senderStats }: SenderStatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (senderStats.length === 0) {
    return (
      <div className="rounded-lg bg-white border border-border-light shadow-card p-4 md:p-6">
        <h2 className="text-sm font-semibold text-text-primary">Sender Distribution</h2>
        <p className="text-sm text-text-muted mt-2">No sender data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-border-light shadow-card overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(!isOpen); } }}
        className="w-full flex items-center justify-between px-5 md:px-6 py-4 hover:bg-[#F0F1F3] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white shrink-0">
            <Mail className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Sender Distribution</p>
            <p className="text-[11px] text-text-muted">
              Usage breakdown for {senderStats.length} {senderStats.length === 1 ? "sender" : "senders"}
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-text-muted transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4 border-t border-border-light pt-4">
          {senderStats.map((stat) => {
            const rawPercent = stat.dailyLimit > 0 ? (stat.sent / stat.dailyLimit) * 100 : 0;
            const usagePercent = Math.min(rawPercent, 100);
            const displayPercent = usagePercent > 0 && usagePercent < 1 
              ? usagePercent.toFixed(1) 
              : Math.round(usagePercent);

            return (
              <div key={stat.senderId} className="p-4 rounded-lg border border-border-light bg-[#F8F9FA] space-y-3 transition-colors hover:border-brand/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-white border border-border-light flex items-center justify-center shrink-0 shadow-premium-sm">
                      <Mail className="h-4 w-4 text-text-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{stat.email}</p>
                      {stat.name && (
                        <p className="text-[11px] text-text-muted truncate">{stat.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-semibold text-text-primary">{stat.sent} / {stat.dailyLimit}</p>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider">Daily Limit</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-brand bg-white border border-brand/10 shadow-premium-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    {stat.sent} sent
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-error-text bg-white border border-error-bg shadow-premium-sm">
                    <XCircle className="h-3 w-3" />
                    {stat.failed} failed
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-text-muted bg-white border border-border-light shadow-premium-sm">
                    <Clock className="h-3 w-3" />
                    {stat.pending} pending
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-text-muted font-medium">Daily Limit Usage</span>
                    <span className={cn(
                      "font-bold",
                      usagePercent > 90 ? "text-error-text" : usagePercent > 70 ? "text-text-muted" : "text-brand"
                    )}>
                      {displayPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#F0F1F3]/50 rounded-full overflow-hidden p-0.5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.05)]",
                        usagePercent > 90 ? "bg-error-text" : usagePercent > 70 ? "bg-brand/50" : "bg-brand"
                      )}
                      style={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

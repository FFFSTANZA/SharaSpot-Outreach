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
      <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Sender Distribution</h2>
        <p className="text-xs text-gray-400 mt-2 font-medium">No sender data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(!isOpen); } }}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand/20">
            <Mail className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Sender Distribution</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Usage breakdown for {senderStats.length} {senderStats.length === 1 ? "sender" : "senders"}
            </p>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-gray-300 transition-transform duration-300",
          isOpen && "rotate-180 text-brand"
        )} />
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-6">
          {senderStats.map((stat) => {
            const rawPercent = stat.dailyLimit > 0 ? (stat.sent / stat.dailyLimit) * 100 : 0;
            const usagePercent = Math.min(rawPercent, 100);
            const displayPercent = usagePercent > 0 && usagePercent < 1 
              ? usagePercent.toFixed(1) 
              : Math.round(usagePercent);

            return (
              <div key={stat.senderId} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/30 space-y-4 transition-all hover:border-brand/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{stat.email}</p>
                      {stat.name && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-900 tracking-tight">{stat.sent} / {stat.dailyLimit}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Daily Limit</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: "sent", count: stat.sent, icon: CheckCircle2, color: "text-brand", bg: "bg-brand-light" },
                    { label: "failed", count: stat.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
                    { label: "pending", count: stat.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                  ].map((s) => (
                    <span key={s.label} className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tight shadow-sm border border-transparent", s.color, s.bg)}>
                      <s.icon className="h-3 w-3" />
                      {s.count} {s.label}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Daily Limit Usage</span>
                    <span className={cn(
                      usagePercent > 90 ? "text-red-500" : usagePercent > 70 ? "text-amber-500" : "text-brand"
                    )}>
                      {displayPercent}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 shadow-sm",
                        usagePercent > 90 ? "bg-red-500 shadow-red-500/20" : usagePercent > 70 ? "bg-amber-500 shadow-amber-500/20" : "bg-brand shadow-brand/20"
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

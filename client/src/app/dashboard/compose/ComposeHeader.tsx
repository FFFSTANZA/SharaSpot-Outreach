"use client";

import { CalendarClock, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComposeHeaderProps {
  scheduledAt: Date | null;
  onClearSchedule: () => void;
  onOpenSchedule: () => void;
  isSubmitting?: boolean;
  onSend: () => void;
}

export function ComposeHeader({
  scheduledAt,
  onClearSchedule,
  onOpenSchedule,
  isSubmitting,
  onSend,
}: ComposeHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {scheduledAt && (
        <div className="flex items-center gap-2 rounded-md border border-brand/10 bg-brand-light px-2.5 py-1">
          <CalendarClock size={14} className="text-brand" />
          <span className="text-[11px] font-semibold text-brand">
            {new Intl.DateTimeFormat("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            }).format(scheduledAt)}
          </span>
          <button
            onClick={onClearSchedule}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-brand/60 hover:text-brand"
            title="Clear schedule"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <button
        onClick={onOpenSchedule}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          scheduledAt
            ? "bg-brand-light text-brand"
            : "text-text-muted hover:bg-[#F0F1F3]"
        )}
        title="Schedule sending"
      >
        <CalendarClock size={14} />
      </button>
      <button
        onClick={onSend}
        disabled={isSubmitting}
        className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Send size={12} />
        )}
        {scheduledAt ? "Schedule" : "Send"}
      </button>
    </div>
  );
}

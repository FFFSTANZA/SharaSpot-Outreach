"use client";

import { ArrowLeft, CalendarClock, X, Send, Loader2 } from "lucide-react";
import Button from "@/components/Button";
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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-all pr-2"
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="h-6 w-px bg-border-light mx-1" />
        <div>
          <h1 className="text-lg font-bold text-text-primary leading-tight">Compose</h1>
        </div>
        {scheduledAt && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 animate-in fade-in slide-in-from-left-2 transition-all">
            <CalendarClock className="h-3.5 w-3.5 text-green-600" />
            <span className="text-[11px] font-bold text-green-700">
              {new Intl.DateTimeFormat("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              }).format(scheduledAt)}
            </span>
            <button
              onClick={onClearSchedule}
              className="ml-1 p-0.5 hover:bg-green-100 rounded-full transition-colors text-green-400 hover:text-green-600"
              title="Clear schedule"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSchedule}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-xl border transition-all",
            scheduledAt
              ? "border-green-200 bg-green-50 text-green-700 shadow-sm"
              : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          )}
          title="Schedule sending"
        >
          <CalendarClock className="h-5 w-5" />
        </button>
        <Button
          variant="primary"
          className="px-6 gap-2 h-10 font-bold"
          onClick={onSend}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {scheduledAt ? "Schedule" : "Send"}
        </Button>
      </div>
    </div>
  );
}

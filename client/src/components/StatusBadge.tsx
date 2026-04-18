"use client";

import { cn } from "@/lib/utils";
import { Clock, Send, Pause, XCircle, CheckCircle2, Ban, Loader2 } from "lucide-react";

type CampaignStatus = "SCHEDULED" | "SENDING" | "PAUSED" | "CANCELLED" | "COMPLETED";

interface StatusBadgeProps {
  status: CampaignStatus;
  size?: "sm" | "md";
  pauseReason?: string | null;
}

/**
 * StatusBadge - memorable status indicators.
 * 
 * Distinctive features:
 * - Icon + label combo for instant recognition
 * - Distinctive colors (not just generic colors)
 * - Animate for SENDING state
 */
const STATUS_CONFIG: Record<CampaignStatus, {
  label: string;
  bg: string;
  text: string;
  icon: React.ElementType;
  animate?: boolean;
}> = {
  SCHEDULED: { 
    label: "Scheduled", 
    bg: "bg-amber-50", 
    text: "text-amber-700", 
    icon: Clock,
  },
  SENDING: { 
    label: "Sending", 
    bg: "bg-blue-50", 
    text: "text-blue-700", 
    icon: Loader2,
    animate: true,
  },
  PAUSED: { 
    label: "Paused", 
    bg: "bg-gray-100", 
    text: "text-gray-600", 
    icon: Pause,
  },
  CANCELLED: { 
    label: "Cancelled", 
    bg: "bg-red-50", 
    text: "text-red-700", 
    icon: XCircle,
  },
  COMPLETED: { 
    label: "Completed", 
    bg: "bg-brand-light", 
    text: "text-brand", 
    icon: CheckCircle2,
  },
};

const PAUSE_REASON_LABELS: Record<string, string> = {
  ALL_SENDERS_EXHAUSTED: "Limit Reached",
};

export default function StatusBadge({ status, size = "sm", pauseReason }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const reasonLabel = status === "PAUSED" && pauseReason
    ? PAUSE_REASON_LABELS[pauseReason] ?? pauseReason
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-tight border border-transparent",
        config.bg,
        config.text,
        size === "sm" && "px-2 py-0.5 text-[9px]",
        size === "md" && "px-2.5 py-1 text-[10px]"
      )}
      title={reasonLabel ?? undefined}
    >
      {config.animate ? (
        <Icon className={cn("h-3 w-3 animate-spin", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      ) : (
        <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      )}
      {config.label}
      {reasonLabel && (
        <span className="font-normal opacity-75">· {reasonLabel}</span>
      )}
    </span>
  );
}
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
  borderLeft?: string;
}> = {
  SCHEDULED: { 
    label: "Scheduled", 
    bg: "bg-[#FEF7E0]", 
    text: "text-[#B06000]", 
    icon: Clock,
    borderLeft: "border-l-[#F9AB00]",
  },
  SENDING: { 
    label: "Sending", 
    bg: "bg-[#E8F0FE]", 
    text: "text-[#1967D2]", 
    icon: Loader2,
    animate: true,
    borderLeft: "border-l-[#4285F4]",
  },
  PAUSED: { 
    label: "Paused", 
    bg: "bg-[#F1F3F4]", 
    text: "text-[#5F6368]", 
    icon: Pause,
    borderLeft: "border-l-[#9AA0A6]",
  },
  CANCELLED: { 
    label: "Cancelled", 
    bg: "bg-[#FCE8E7]", 
    text: "text-[#C5221F]", 
    icon: XCircle,
    borderLeft: "border-l-[#EA4335]",
  },
  COMPLETED: { 
    label: "Completed", 
    bg: "bg-[#E8F8ED]", 
    text: "text-[#048C4A]", 
    icon: CheckCircle2,
    borderLeft: "border-l-[#34A853]",
  },
};

const PAUSE_REASON_LABELS: Record<string, string> = {
  ALL_SENDERS_EXHAUSTED: "All senders at limit",
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
        "inline-flex items-center gap-1.5 rounded font-medium border-l-2",
        config.bg,
        config.text,
        config.borderLeft,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs"
      )}
      title={reasonLabel ?? undefined}
    >
      {config.animate ? (
        <Icon className={cn("h-3 w-3 animate-spin", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      ) : (
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {config.label}
      {reasonLabel && (
        <span className="font-normal opacity-75">· {reasonLabel}</span>
      )}
    </span>
  );
}
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
    bg: "bg-gray-100", 
    text: "text-gray-600", 
    icon: Clock,
    borderLeft: "border-l-gray-400",
  },
  SENDING: { 
    label: "Sending", 
    bg: "bg-blue-50", 
    text: "text-blue-600", 
    icon: Loader2,
    animate: true,
    borderLeft: "border-l-blue-400",
  },
  PAUSED: { 
    label: "Paused", 
    bg: "bg-gray-50", 
    text: "text-gray-500", 
    icon: Pause,
    borderLeft: "border-l-gray-300",
  },
  CANCELLED: { 
    label: "Cancelled", 
    bg: "bg-red-50", 
    text: "text-red-700", 
    icon: XCircle,
    borderLeft: "border-l-red-400",
  },
  COMPLETED: { 
    label: "Completed", 
    bg: "bg-blue-100", 
    text: "text-blue-800", 
    icon: CheckCircle2,
    borderLeft: "border-l-blue-600",
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
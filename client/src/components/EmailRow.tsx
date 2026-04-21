"use client";

import { cn, formatTime, stripHtml, resolveVariables } from "@/lib/utils";
import { EmailRowProps } from "@/types";
import { Check, XCircle, Clock, Star, Ban, Loader2 } from "lucide-react";
import MatchHighlighter from "./MatchHighlighter";
import { useRouter } from "next/navigation";

type EmailStatus = "PENDING" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";

/**
 * Email status configuration.
 */
const statusConfig: Record<EmailStatus, {
  bg: string;
  text: string;
  icon: typeof Clock;
  label: string;
  animate?: boolean;
}> = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: Clock,
    label: "Scheduled"
  },
  SENDING: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Loader2,
    label: "Sending",
    animate: true,
  },
  SENT: {
    bg: "bg-brand-light",
    text: "text-brand",
    icon: Check,
    label: "Sent"
  },
  FAILED: {
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
    label: "Failed"
  },
  CANCELLED: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: Ban,
    label: "Cancelled"
  },
};

function EmailStatusBadge({ status, time }: { status?: string; time?: string }) {
  const normalizedStatus = (status?.toUpperCase() ?? "PENDING") as EmailStatus;
  const config = statusConfig[normalizedStatus] ?? statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-transparent whitespace-nowrap",
      config.bg,
      config.text,
    )}>
      {config.animate ? (
        <Icon className="h-2.5 w-2.5 animate-spin" />
      ) : (
        <Icon className="h-2.5 w-2.5" />
      )}
      <span>{time ? formatTime(time) : config.label}</span>
    </div>
  );
}

export function EmailRow({ email, campaign, onToggleStar, searchQuery = "" }: EmailRowProps) {
  const router = useRouter();
  const colData = (email as any)?.columnData ?? {};
  const recipientEmail = email?.toEmail ?? "";

  const resolvedSubject = resolveVariables(campaign?.subject ?? "", colData, { email: recipientEmail });
  const resolvedBody = resolveVariables(campaign?.body ?? "", colData, { email: recipientEmail });

  const plainPreview = resolvedBody ? stripHtml(resolvedBody).slice(0, 100) : "";
  const timeValue = email?.status === "SENT" ? email?.sentAt : email?.scheduledAt;
  const isRead = (email as any)?.isRead ?? true;

  return (
    <div
      onClick={() => {
        if (campaign?.id) {
          router.push(`/dashboard/campaigns/${campaign.id}`);
        }
      }}
      className={cn(
        "group flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 border-b border-gray-50",
        !isRead ? "bg-brand-light/20" : "hover:bg-gray-50/50"
      )}
    >
      {/* Star Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (email?.id && onToggleStar) onToggleStar(email.id);
        }}
        className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={email?.isStarred ? "Unstar email" : "Star email"}
      >
        <Star
          className={cn(
            "h-4 w-4 transition-all duration-200",
            email?.isStarred
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 group-hover:text-gray-400",
          )}
        />
      </button>

      {/* Sender/Recipient */}
      <div className="w-48 shrink-0 min-w-0">
        <p className={cn(
          "text-sm truncate font-semibold",
          !isRead ? "text-gray-900" : "text-gray-600"
        )}>
          <MatchHighlighter text={email?.toEmail ?? ""} query={searchQuery} />
        </p>
      </div>

      {/* Subject & Preview */}
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className={cn(
          "text-sm truncate",
          !isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"
        )}>
          <MatchHighlighter text={resolvedSubject} query={searchQuery} />
        </span>
        <span className="text-xs text-gray-400 truncate font-normal">- {plainPreview}</span>
      </div>

      {/* Status Badge */}
      <div className="w-32 shrink-0">
        <EmailStatusBadge status={email?.status} time={timeValue ?? undefined} />
      </div>

      {/* Date */}
      <div className="shrink-0 text-[11px] text-gray-400 font-medium whitespace-nowrap w-20 text-right">
        {timeValue ? formatTime(timeValue) : "-"}
      </div>
    </div>
  );
}

"use client";

import { cn, formatTime, stripHtml, resolveVariables } from "@/lib/utils";
import { EmailRowProps } from "@/types";
import { Check, XCircle, Clock, Star, Ban, Loader2 } from "lucide-react";
import MatchHighlighter from "./MatchHighlighter";

type EmailStatus = "PENDING" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";

/**
 * Email status configuration - distinctive, memorable colors.
 */
const statusConfig: Record<EmailStatus, { 
  bg: string; 
  text: string; 
  borderLeft: string;
  icon: typeof Clock; 
  label: string;
  animate?: boolean;
}> = {
  PENDING: { 
    bg: "bg-[#FEF7E0]", 
    text: "text-[#B06000]", 
    borderLeft: "border-l-[#F9AB00]",
    icon: Clock, 
    label: "Scheduled" 
  },
  SENDING: { 
    bg: "bg-[#E8F0FE]", 
    text: "text-[#1967D2]", 
    borderLeft: "border-l-[#4285F4]",
    icon: Loader2, 
    label: "Sending",
    animate: true,
  },
  SENT: { 
    bg: "bg-[#E8F8ED]", 
    text: "text-[#048C4A]", 
    borderLeft: "border-l-[#34A853]",
    icon: Check, 
    label: "Sent" 
  },
  FAILED: { 
    bg: "bg-[#FCE8E7]", 
    text: "text-[#C5221F]", 
    borderLeft: "border-l-[#EA4335]",
    icon: XCircle, 
    label: "Failed" 
  },
  CANCELLED: { 
    bg: "bg-[#F1F3F4]", 
    text: "text-[#5F6368]", 
    borderLeft: "border-l-[#9AA0A6]",
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
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border-l-2",
      config.bg, 
      config.text,
      config.borderLeft
    )}>
      {config.animate ? (
        <Icon className="h-3 w-3 animate-spin" />
      ) : (
        <>
          {(normalizedStatus === "SENDING" || normalizedStatus === "PENDING") && (
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", config.borderLeft.replace('border-l-', 'bg-'))} />
          )}
          <Icon className="h-3 w-3" />
        </>
      )}
      <span>{time ? formatTime(time) : config.label}</span>
    </div>
  );
}

export function EmailRow({ email, campaign, onToggleStar, searchQuery = "" }: EmailRowProps) {
  const colData = (email as any)?.columnData ?? {};
  const recipientEmail = email?.toEmail ?? "";
  
  const resolvedSubject = resolveVariables(campaign?.subject ?? "", colData, { email: recipientEmail });
  const resolvedBody = resolveVariables(campaign?.body ?? "", colData, { email: recipientEmail });
  
  const plainPreview = resolvedBody ? stripHtml(resolvedBody).slice(0, 100) : "";
  const timeValue = email?.status === "SENT" ? email?.sentAt : email?.scheduledAt;
  const isRead = (email as any)?.isRead ?? true;

  return (
    <div className={cn(
      "group flex items-center gap-4 px-4 py-3 border-b border-[#F1F3F4] cursor-pointer transition-colors duration-150",
      !isRead ? "bg-[#E8F0FE]/50" : "hover:bg-[#F7F8F8]"
    )}>
      {/* Star Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (email?.id && onToggleStar) onToggleStar(email.id);
        }}
        className="shrink-0 p-1 rounded hover:bg-[#F1F3F4] transition-colors"
        aria-label={email?.isStarred ? "Unstar email" : "Star email"}
      >
        <Star
          className={cn(
            "h-4 w-4 transition-colors duration-150",
            email?.isStarred
              ? "fill-[#FBBC04] text-[#FBBC04]"
              : "text-[#DADCE0] group-hover:text-[#9AA0A6]",
          )}
        />
      </button>

      {/* Sender/Recipient */}
      <div className="w-48 shrink-0 min-w-0">
        <p className={cn(
          "text-sm truncate",
          !isRead ? "font-semibold text-[#1A1D21]" : "font-medium text-[#5F6368]"
        )}>
          <MatchHighlighter text={email?.toEmail ?? ""} query={searchQuery} />
        </p>
      </div>

      {/* Subject & Preview */}
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className={cn(
          "text-sm truncate",
          !isRead ? "font-semibold text-[#1A1D21]" : "font-normal text-[#5F6368]"
        )}>
          <MatchHighlighter text={resolvedSubject} query={searchQuery} />
        </span>
        <span className="text-xs text-[#9AA0A6] truncate">— {plainPreview}</span>
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <EmailStatusBadge status={email?.status} time={timeValue ?? undefined} />
      </div>

      {/* Date */}
      <div className="shrink-0 text-xs text-[#9AA0A6] whitespace-nowrap w-16 text-right">
        {timeValue ? formatTime(timeValue) : "—"}
      </div>
    </div>
  );
}
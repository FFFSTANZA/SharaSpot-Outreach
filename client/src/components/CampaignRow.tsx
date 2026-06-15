"use client";

import { formatTime, stripHtml } from "@/lib/utils";
import { CampaignRowProps } from "@/types";
import { Users, Send, XCircle, Clock, Megaphone } from "lucide-react";
import MatchHighlighter from "./MatchHighlighter";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";

export function CampaignRow({ campaign, searchQuery = "" }: CampaignRowProps) {
  const router = useRouter();
  const counts = campaign?.emailCounts;
  const totalSent = counts?.sent ?? 0;
  const totalFailed = counts?.failed ?? 0;
  const totalPending = (counts?.pending ?? 0) + (counts?.sending ?? 0);
  const bodyPreview = campaign?.body ? stripHtml(campaign.body).slice(0, 100) : "";

  return (
    <button
      type="button"
      onClick={() => {
        if (campaign?.id) {
          router.push(`/dashboard/campaigns/${campaign.id}`);
        }
      }}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border-light px-4 py-4 text-left transition-colors hover:bg-[#F8FAFC] sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,auto)_112px_96px]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light">
          <Megaphone className="h-5 w-5 text-brand" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-primary">
            <MatchHighlighter text={campaign?.subject ?? "(No Subject)"} query={searchQuery} />
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-text-muted">{bodyPreview || "No preview available"}</p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center justify-end gap-3 text-xs font-semibold text-text-secondary lg:flex">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{campaign?.totalRecipients ?? 0}</span>
          </span>
          <span className="flex items-center gap-1 text-brand">
            <Send className="h-3.5 w-3.5" />
            <span>{totalSent}</span>
          </span>
          <span className="flex items-center gap-1 text-error-text">
            <XCircle className="h-3.5 w-3.5" />
            <span>{totalFailed}</span>
          </span>
          {totalPending > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalPending}</span>
            </span>
          )}
      </div>

      <div className="hidden shrink-0 justify-self-start lg:block">
        <StatusBadge status={campaign?.status ?? "SCHEDULED"} size="sm" pauseReason={campaign?.pauseReason} />
      </div>

      <div className="hidden shrink-0 justify-self-end whitespace-nowrap text-right text-[11px] font-medium text-text-muted lg:block">
        {campaign?.createdAt ? formatTime(campaign.createdAt) : "-"}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 lg:hidden">
        <StatusBadge status={campaign?.status ?? "SCHEDULED"} size="sm" pauseReason={campaign?.pauseReason} />
        <span className="text-[11px] font-semibold text-text-muted">{totalSent} sent</span>
      </div>
    </button>
  );
}

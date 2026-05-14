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
    <div
      onClick={() => {
        if (campaign?.id) {
          router.push(`/dashboard/campaigns/${campaign.id}`);
        }
      }}
      className="group flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 border-b border-gray-50 hover:bg-gray-50/50"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
        <Megaphone className="h-5 w-5 text-brand" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">
          <MatchHighlighter text={campaign?.subject ?? "(No Subject)"} query={searchQuery} />
        </p>
        <p className="text-xs text-gray-400 truncate font-medium mt-0.5">{bodyPreview}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{campaign?.totalRecipients ?? 0}</span>
          </span>
          <span className="flex items-center gap-1 text-brand">
            <Send className="h-3.5 w-3.5" />
            <span>{totalSent}</span>
          </span>
          <span className="flex items-center gap-1 text-red-500">
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
      </div>

      <div className="w-28 shrink-0">
        <StatusBadge status={campaign?.status ?? "SCHEDULED"} size="sm" pauseReason={campaign?.pauseReason} />
      </div>

      <div className="shrink-0 text-[11px] text-gray-400 font-medium whitespace-nowrap w-20 text-right">
        {campaign?.createdAt ? formatTime(campaign.createdAt) : "-"}
      </div>
    </div>
  );
}

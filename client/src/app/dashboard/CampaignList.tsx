"use client";

import { CampaignRow } from "@/components/CampaignRow";
import { CampaignListProps } from "@/types";
import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";

export function CampaignList({ campaigns }: CampaignListProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="h-20 w-20 rounded-3xl bg-brand-light flex items-center justify-center mb-6">
          <Megaphone className="h-8 w-8 text-brand" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">No campaigns found</h3>
        <p className="text-sm text-text-secondary max-w-xs mb-8 leading-relaxed">
          Your outreach pipeline is currently empty. Start a campaign to begin reaching your targets.
        </p>
        <Link href="/dashboard/compose">
          <Button size="lg" className="px-8 font-bold">
            <Plus size={18} className="mr-2" />
            Initialize Campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border-light bg-background/50 shrink-0">
        <div className="w-10 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-text-muted uppercase">Campaign</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs font-bold text-text-muted uppercase w-32 text-center">Activity</span>
          <span className="text-xs font-bold text-text-muted uppercase w-28">Status</span>
          <span className="text-xs font-bold text-text-muted uppercase w-20 text-right">Created</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {campaigns.map((item, idx) => (
          <CampaignRow key={idx} {...item} />
        ))}
      </div>
    </div>
  );
}

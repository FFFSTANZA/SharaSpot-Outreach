"use client";

import { CampaignRow } from "@/components/CampaignRow";
import { CampaignListProps } from "@/types";
import { Megaphone, Plus, Filter } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";

export function CampaignList({ campaigns, hasActiveFilters, onClearFilters }: CampaignListProps & { hasActiveFilters?: boolean; onClearFilters?: () => void }) {
  if (!campaigns || campaigns.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light">
            <Filter className="h-8 w-8 text-brand" />
          </div>
          <h3 className="mb-2 text-xl font-bold tracking-tight text-text-primary">No matching campaigns</h3>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-text-secondary">
            Try adjusting your filters to see more results.
          </p>
          <button
            onClick={onClearFilters}
            className="flex h-9 items-center gap-2 rounded-md border border-border-light px-4 text-xs font-bold text-text-secondary hover:bg-[#F0F1F3] transition-all"
          >
            <Filter size={12} />
            Clear Filters
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light">
          <Megaphone className="h-8 w-8 text-brand" />
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-text-primary">No campaigns found</h3>
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-text-secondary">
          Create a focused campaign, connect a verified sender, and keep tracking off until replies start coming in.
        </p>
        <Link href="/dashboard/compose">
          <Button size="lg" className="px-8 font-bold">
            <Plus size={18} className="mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <div className="hidden shrink-0 grid-cols-[minmax(0,1fr)_minmax(220px,auto)_112px_96px] items-center gap-4 border-b border-border-light bg-[#F8FAFC] px-6 py-3 lg:grid">
        <div className="min-w-0 pl-[52px]">
          <span className="text-xs font-bold uppercase text-text-muted">Campaign</span>
        </div>
        <span className="justify-self-end text-xs font-bold uppercase text-text-muted">Activity</span>
        <span className="text-xs font-bold uppercase text-text-muted">Status</span>
        <span className="justify-self-end text-xs font-bold uppercase text-text-muted">Created</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {campaigns.map((item, index) => (
          <CampaignRow key={item.campaign?.id ?? `${item.campaign?.subject}-${index}`} {...item} />
        ))}
      </div>
    </div>
  );
}

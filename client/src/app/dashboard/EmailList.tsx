"use client";

import { EmailRow } from "@/components/EmailRow";
import { EmailListProps } from "@/types";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";

/**
 * EmailList - Campaign list with proper scrolling
 */
export function EmailList({ emails, onToggleStar }: EmailListProps) {
  if (!emails || emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="h-20 w-20 rounded-3xl bg-brand-light flex items-center justify-center mb-6">
          <Inbox className="h-8 w-8 text-brand" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">No active campaigns</h3>
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
      {/* Header - fixed height */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border-light bg-background/50 shrink-0">
        <div className="w-8 shrink-0" />
        <div className="w-48 shrink-0 min-w-0">
          <span className="text-xs font-bold text-text-muted uppercase">Recipient</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-text-muted uppercase">Campaign</span>
        </div>
        <div className="w-24 shrink-0">
          <span className="text-xs font-bold text-text-muted uppercase">Status</span>
        </div>
        <div className="w-20 shrink-0 text-right">
          <span className="text-xs font-bold text-text-muted uppercase">Time</span>
        </div>
      </div>

      {/* Scrollable list - takes remaining space */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email, idx) => (
          <EmailRow key={idx} {...email} onToggleStar={onToggleStar} />
        ))}
      </div>
    </div>
  );
}
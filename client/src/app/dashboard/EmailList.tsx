import { EmailRow } from "@/components/EmailRow";
import { EmailListProps } from "@/types";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";

export function EmailList({ emails, onToggleStar }: EmailListProps) {
  if (!emails || emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="h-14 w-14 rounded-full bg-[#E8F8ED] flex items-center justify-center mb-3">
          <Inbox className="h-6 w-6 text-[#00A63E]" />
        </div>
        <h3 className="text-sm font-semibold text-[#1A1D21] mb-1">No emails yet</h3>
        <p className="text-xs text-[#5F6368] max-w-xs mb-4">
          Start a campaign to see your outreach emails appear here.
        </p>
        <Link 
          href="/dashboard/compose"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6D01] text-white text-xs font-medium rounded-md hover:bg-[#E56200] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Create campaign
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto scroll-touch bg-white"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Header Row */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#E8EAED] bg-[#FAFBFC] sticky top-0">
        <div className="w-8 shrink-0" />
        <div className="w-48 shrink-0 min-w-0">
          <span className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">Recipient</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">Subject</span>
        </div>
        <div className="w-24 shrink-0">
          <span className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">Status</span>
        </div>
        <div className="w-16 shrink-0 text-right">
          <span className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">Date</span>
        </div>
      </div>

      {/* Email Rows */}
      {emails.map((email, idx) => (
        <EmailRow key={idx} {...email} onToggleStar={onToggleStar} />
      ))}
    </div>
  );
}
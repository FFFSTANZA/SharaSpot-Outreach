import { EmailRow } from "@/components/EmailRow";
import { EmailListProps } from "@/types";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";

export function EmailList({ emails, onToggleStar }: EmailListProps) {
  if (!emails || emails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-white">
        <div className="h-20 w-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
          <Inbox className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">No emails yet</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-8 font-medium">
          Start a campaign to see your outreach emails appear here.
        </p>
        <Link 
          href="/dashboard/compose"
          className="flex items-center gap-2 px-8 h-12 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover transition-all active:scale-95 shadow-sm"
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
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
        <div className="w-8 shrink-0" />
        <div className="w-48 shrink-0 min-w-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipient</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject & Preview</span>
        </div>
        <div className="w-32 shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
        </div>
        <div className="w-20 shrink-0 text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent Time</span>
        </div>
      </div>

      {/* Email Rows */}
      <div className="divide-y divide-gray-50">
        {emails.map((email, idx) => (
          <EmailRow key={idx} {...email} onToggleStar={onToggleStar} />
        ))}
      </div>
    </div>
  );
}

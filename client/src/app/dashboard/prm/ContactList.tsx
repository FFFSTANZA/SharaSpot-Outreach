"use client";

import { Contact } from "@/types";
import { cn } from "@/lib/utils";
import {
  Mail,
  Edit2,
  Trash2,
  MousePointer2,
  MessageSquare,
  Eye,
  Send,
  Clock
} from "lucide-react";
import Link from "next/link";

type ContactWithExtras = Contact & {
  _count?: {
    emailsSent?: number;
    emailsOpened?: number;
    emailsClicked?: number;
    emailsReplied?: number;
  };
};

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ContactList({
  contacts,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  selectedIds,
  setSelectedIds,
}: ContactListProps) {
  if (!contacts) return null;
  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">No contacts found</h3>
        <p className="text-text-muted max-w-xs mx-auto">
          Start building your personal relationship management by adding your first contact.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-light bg-background/50 sticky top-0 z-10">
            <th className="px-6 py-4 text-left w-12">
              <input
                type="checkbox"
                className="rounded border-border-light text-brand focus:ring-brand"
                checked={selectedIds.size === contacts.length && contacts.length > 0}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-left">Contact</th>
            <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-left">Company</th>
            <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-center">Engagement</th>
            <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-center">Stats</th>
            <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-center">Last Contacted</th>
            <th className="px-6 py-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {contacts.map((contact) => {
            const counts = (contact as ContactWithExtras)._count;

            return (
            <tr
              key={contact.id}
              onClick={() => onSelect(contact.id)}
              className={cn(
                "hover:bg-interactive-hover cursor-pointer transition-colors group",
                selectedId === contact.id ? "bg-brand/5" : ""
              )}
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  className="rounded-md border-border-light text-brand focus:ring-brand w-4 h-4"
                  checked={selectedIds.has(contact.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const newSelected = new Set(selectedIds);
                    if (e.target.checked) newSelected.add(contact.id);
                    else newSelected.delete(contact.id);
                    setSelectedIds(newSelected);
                  }}
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-semibold shrink-0 border border-brand/5">
                    {(contact.firstName?.[0] || contact.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {(contact.firstName || contact.lastName) ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() : contact.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-text-muted font-medium truncate flex items-center gap-1">
                      {contact.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    {contact.company || "—"}
                  </div>
                  {contact.jobTitle && (
                    <div className="text-xs text-text-muted font-medium flex items-center gap-1.5 mt-0.5">
                      {contact.jobTitle}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                      <div
                        className={cn(
                          "h-full transition-all duration-700 ease-out",
                          (contact.engagementScore || 0) > 80 ? "bg-green-500" :
                            (contact.engagementScore || 0) > 40 ? "bg-orange-500" :
                              "bg-brand"
                        )}
                        style={{ width: `${Math.min(100, (contact.engagementScore || 0))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-text-primary tabular-nums">{(contact.engagementScore || 0)}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                    contact.stage === "COLD" ? "bg-gray-100 text-gray-500" :
                      contact.stage === "WARM" ? "bg-blue-100 text-blue-600" :
                        contact.stage === "HOT" ? "bg-orange-100 text-orange-600" :
                          contact.stage === "REPLIED" ? "bg-green-100 text-green-600" :
                            "bg-brand/10 text-brand"
                  )}>
                    {contact.stage}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center" title="Sent">
                    <span className="text-[10px] font-bold text-text-primary">{counts?.emailsSent || 0}</span>
                    <Mail size={12} className="text-text-muted" />
                  </div>
                  <div className="flex flex-col items-center" title="Opened">
                    <span className="text-[10px] font-bold text-text-primary">{counts?.emailsOpened || 0}</span>
                    <Eye size={12} className="text-text-muted" />
                  </div>
                  <div className="flex flex-col items-center" title="Clicked">
                    <span className="text-[10px] font-bold text-text-primary">{counts?.emailsClicked || 0}</span>
                    <MousePointer2 size={12} className="text-text-muted" />
                  </div>
                  <div className="flex flex-col items-center" title="Replied">
                    <span className="text-[10px] font-bold text-text-primary">{counts?.emailsReplied || 0}</span>
                    <MessageSquare size={12} className="text-text-muted" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center gap-0.5" title={contact.lastContactedAt || undefined}>
                  <Clock size={12} className={cn(
                    contact.lastContactedAt ? "text-text-secondary" : "text-text-muted"
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    contact.lastContactedAt ? "text-text-primary" : "text-text-muted"
                  )}>
                    {timeAgo(contact.lastContactedAt)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/dashboard/compose?emails=${encodeURIComponent(contact.email)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-md transition-all"
                    title="Compose Email"
                  >
                    <Send size={16} />
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
                    className="p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-md transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                    className="p-1.5 text-text-muted hover:text-error-text hover:bg-error-bg rounded-md transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

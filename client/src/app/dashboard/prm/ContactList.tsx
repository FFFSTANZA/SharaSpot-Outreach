"use client";

import { Contact } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Mail, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Building2, 
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  MousePointer2,
  MessageSquare,
  Eye
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
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
  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-black text-text-primary mb-2">No contacts found</h3>
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
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-left">Contact</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-left">Company</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-left">Stage</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Stats</th>
            <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {contacts.map((contact) => (
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
                  className="rounded border-border-light text-brand focus:ring-brand"
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
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold shrink-0">
                    {contact.firstName?.[0] || contact.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">
                      {contact.firstName ? `${contact.firstName} ${contact.lastName || ''}` : contact.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-text-muted truncate flex items-center gap-1">
                      <Mail size={12} />
                      {contact.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <Building2 size={14} className="text-text-muted" />
                    {contact.company || "—"}
                  </div>
                  {contact.jobTitle && (
                    <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                      <Briefcase size={12} />
                      {contact.jobTitle}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                  contact.stage === "COLD" ? "bg-gray-100 text-gray-700" :
                  contact.stage === "WARM" ? "bg-blue-100 text-blue-700" :
                  contact.stage === "HOT" ? "bg-orange-100 text-orange-700" :
                  contact.stage === "REPLIED" ? "bg-green-100 text-green-700" :
                  "bg-brand/10 text-brand"
                )}>
                  {contact.stage}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center" title="Sent">
                    <span className="text-xs font-bold text-text-primary">{contact._count?.emailsSent || 0}</span>
                    <Mail size={12} className="text-text-muted" />
                  </div>
                  <div className="flex flex-col items-center" title="Opened">
                    <span className="text-xs font-bold text-text-primary">{contact._count?.emailsOpened || 0}</span>
                    <Eye size={12} className="text-text-muted" />
                  </div>
                  <div className="flex flex-col items-center" title="Clicked">
                    <span className="text-xs font-bold text-text-primary">{contact._count?.emailsClicked || 0}</span>
                    <MousePointer2 size={12} className="text-text-muted" />
                  </div>
                  <div className="flex flex-col items-center" title="Replied">
                    <span className="text-xs font-bold text-text-primary">{contact._count?.emailsReplied || 0}</span>
                    <MessageSquare size={12} className="text-text-muted" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

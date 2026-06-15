"use client";

import { Contact } from "@/types";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronLeft,
  Mail,
  Edit2,
  Send,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getStageLabel } from "./prmFields";

type CompanyRow = {
  name: string;
  count: number;
  profileId?: string;
};

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (contact: Contact) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  groupByCompany?: boolean;
  companyMode?: boolean;
  companies?: CompanyRow[];
  selectedCompany?: string | null;
  onSelectCompany?: (company: string) => void;
  onBackToCompanies?: () => void;
  onOpenCompanyProfile?: (company: CompanyRow) => void;
}

const getCompanyName = (company?: string | null) => company?.trim() || "No company";

const getDisplayName = (contact: Contact) =>
  (contact.firstName || contact.lastName)
    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
    : contact.email.split("@")[0];

export function ContactList({
  contacts,
  selectedId,
  onSelect,
  onEdit,
  selectedIds,
  setSelectedIds,
  groupByCompany = false,
  companyMode = false,
  companies = [],
  selectedCompany = null,
  onSelectCompany,
  onBackToCompanies,
  onOpenCompanyProfile,
}: ContactListProps) {
  if (!contacts) return null;

  if (companyMode && !selectedCompany) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-light bg-white px-4 py-2.5 sm:px-6">
          <div>
            <p className="text-xs font-medium text-text-primary">Companies</p>
            <p className="text-[11px] text-text-muted">Open one company to see its people.</p>
          </div>
          <span className="text-xs text-text-muted">{companies.length} compan{companies.length === 1 ? "y" : "ies"}</span>
        </div>

        <div className="divide-y divide-border-light">
          {companies.map((company) => (
            <div key={company.name} className="flex items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-[#F8F9FA] sm:px-6">
              <button
                type="button"
                onClick={() => onSelectCompany?.(company.name)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand">
                  <Building2 size={14} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{company.name}</p>
                  <p className="text-xs text-text-muted">Open people or create a profile.</p>
                </div>
              </button>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <span className="rounded bg-[#F8F9FA] px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {company.count} contact{company.count === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCompanyProfile?.(company)}
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3] hover:text-brand"
                >
                  <ExternalLink size={12} />
                  {company.profileId ? "Open" : "Profile"}
                </button>
                <ChevronRight size={14} className="text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  const rows = groupByCompany
    ? contacts.flatMap((contact, index) => {
        const currentCompany = getCompanyName(contact.company);
        const previousCompany = getCompanyName(contacts[index - 1]?.company);
        return [
          ...(index === 0 || currentCompany !== previousCompany ? [{ type: "group" as const, company: currentCompany }] : []),
          { type: "contact" as const, contact },
        ];
      })
    : contacts.map((contact) => ({ type: "contact" as const, contact }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-light bg-white px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          {companyMode && selectedCompany ? (
            <button
              type="button"
              onClick={onBackToCompanies}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]"
            >
              <ChevronLeft size={12} />
              All companies
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-border-light text-brand focus:ring-brand"
              checked={selectedIds.size === contacts.length && contacts.length > 0}
              onChange={toggleSelectAll}
            />
            <span>Select visible</span>
          </label>
        </div>
        <span className="text-xs text-text-muted">{contacts.length} result{contacts.length === 1 ? "" : "s"}</span>
      </div>

      <div className="divide-y divide-border-light">
        {rows.map((row) => {
          if (row.type === "group") {
            return (
              <div
                key={`group-${row.company}`}
                className="sticky top-[49px] z-[5] border-b border-border-light bg-white px-4 py-1.5 sm:px-6"
              >
                <span className="text-[11px] font-semibold text-text-muted">{row.company}</span>
              </div>
            );
          }

          const contact = row.contact;
          const isSelected = selectedId === contact.id;
          return (
            <div
              key={contact.id}
              onClick={() => onSelect(contact.id)}
              className={cn(
                "group flex items-center gap-2 border-l-2 bg-white px-4 py-2.5 transition-all sm:px-6",
                isSelected
                  ? "border-l-brand bg-brand-light/40"
                  : "border-l-transparent hover:bg-[#F8F9FA]"
              )}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 rounded border-border-light text-brand focus:ring-brand"
                checked={selectedIds.has(contact.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const nextSelected = new Set(selectedIds);
                  if (e.target.checked) nextSelected.add(contact.id);
                  else nextSelected.delete(contact.id);
                  setSelectedIds(nextSelected);
                }}
              />

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-muted/40 text-[11px] font-semibold text-brand">
                {(contact.firstName?.[0] || contact.email?.[0] || "?").toUpperCase()}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="min-w-0 flex-[3]">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {getDisplayName(contact)}
                    </span>
                            <span className="shrink-0 rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                      {getStageLabel(contact.stage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                    <span className="truncate">{contact.company || "No company"}</span>
                    <span className="shrink-0">·</span>
                    <span className="truncate">{contact.email}</span>
                    {contact.assignedTo && (
                      <>
                        <span className="hidden shrink-0 sm:inline">·</span>
                        <span className="truncate text-text-secondary">{contact.assignedTo.name || contact.assignedTo.email}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/dashboard/compose?emails=${encodeURIComponent(contact.email)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] hover:text-brand"
                    title="Compose Email"
                  >
                    <Send size={11} />
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] hover:text-text-primary"
                    title="Edit contact"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>

                <ChevronRight size={14} className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

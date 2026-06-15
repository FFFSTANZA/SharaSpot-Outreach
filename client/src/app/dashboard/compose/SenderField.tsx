"use client";

import { RefObject } from "react";
import { CheckCircle2, AlertTriangle, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SenderResponse } from "@/types";

interface SenderFieldProps {
  senders: SenderResponse[];
  selectedSenderIds: string[];
  isSenderLoading: boolean;
  isSenderDropdownOpen: boolean;
  onToggleSender: (id: string) => void;
  onToggleDropdown: () => void;
  onOpenModal: () => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
}

export function SenderField({
  senders,
  selectedSenderIds,
  isSenderLoading,
  isSenderDropdownOpen,
  onToggleSender,
  onToggleDropdown,
  onOpenModal,
  dropdownRef,
}: SenderFieldProps) {
  const selectedSender = senders.find(s => selectedSenderIds.includes(s.id)) || null;

  return (
    <div className="px-4 py-3.5 border-b border-border-light flex items-center gap-3">
      <span className="text-xs font-medium text-text-muted w-16 shrink-0">From</span>
      <div className="relative flex-1 min-w-0" ref={dropdownRef}>
        <button
          type="button"
          className="w-full text-left flex items-center justify-between py-1 text-sm text-text-primary"
          onClick={() => !isSenderLoading && onToggleDropdown()}
          disabled={isSenderLoading}
        >
          <span className="truncate pr-2">
            {isSenderLoading
              ? "Loading..."
              : selectedSenderIds.length === 0
                ? "Select sender"
                : selectedSenderIds.length === 1
                  ? selectedSender?.email || ""
                  : `${selectedSenderIds.length} senders`}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-text-muted shrink-0 transition-transform", isSenderDropdownOpen && "rotate-180")} />
        </button>

        {isSenderDropdownOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-lg shadow-sm overflow-hidden">
            <div className="py-1 max-h-64 overflow-y-auto">
              {senders.map(s => (
                <label key={s.id} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F0F1F3]",
                  selectedSenderIds.includes(s.id) && "bg-brand/[0.06]"
                )}>
                  <input
                    type="checkbox"
                    checked={selectedSenderIds.includes(s.id)}
                    onChange={() => onToggleSender(s.id)}
                    className="h-4 w-4 rounded border-border-light"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{s.email}</p>
                    {s.name && <p className="text-xs text-text-muted truncate">{s.name}</p>}
                  </div>
                  {s.isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onOpenModal}
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-light text-text-muted hover:text-text-secondary hover:border-border-light transition-colors shrink-0"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

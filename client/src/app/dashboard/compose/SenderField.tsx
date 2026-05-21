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
    <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500 w-16 shrink-0">From</span>
      <div className="relative flex-1 min-w-0" ref={dropdownRef}>
        <button
          type="button"
          className="w-full text-left flex items-center justify-between py-1 text-sm text-gray-900"
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
          <ChevronDown className={cn("h-4 w-4 text-gray-400 shrink-0 transition-transform", isSenderDropdownOpen && "rotate-180")} />
        </button>

        {isSenderDropdownOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg border border-gray-200 overflow-hidden">
            <div className="py-1 max-h-64 overflow-y-auto">
              {senders.map(s => (
                <label key={s.id} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50",
                  selectedSenderIds.includes(s.id) && "bg-green-50/50"
                )}>
                  <input
                    type="checkbox"
                    checked={selectedSenderIds.includes(s.id)}
                    onChange={() => onToggleSender(s.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{s.email}</p>
                    {s.name && <p className="text-xs text-gray-400 truncate">{s.name}</p>}
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
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

"use client";

import { RefObject } from "react";
import { MoreHorizontal, ChevronDown, CheckSquare, Square, Copy, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsDropdownProps {
  selectedCount: number;
  totalCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCopyAll: () => void;
  onExportSelected: () => void;
  onRemoveSelected: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

export function BulkActionsDropdown({
  selectedCount,
  totalCount,
  isOpen,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onCopyAll,
  onExportSelected,
  onRemoveSelected,
  menuRef,
}: BulkActionsDropdownProps) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className={cn(
          "h-10 px-4 rounded-lg border text-sm font-semibold flex items-center gap-2 transition-all",
          selectedCount > 0
            ? "border-brand/20 bg-brand/10 text-brand"
            : "border-border-light text-text-secondary hover:bg-[#F0F1F3]"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
        {selectedCount > 0 ? `${selectedCount} selected` : "Bulk Actions"}
        <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-border-light rounded-lg shadow-sm py-2 min-w-[200px] z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
          <div className="px-3 py-1.5 border-b border-border-light/50 mb-1">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Selection</p>
          </div>
          <button
            onClick={onSelectAll}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-[#F0F1F3] flex items-center gap-3"
          >
            <CheckSquare className="h-4 w-4 text-text-muted" /> Select all ({totalCount})
          </button>
          <button
            onClick={onDeselectAll}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-[#F0F1F3] flex items-center gap-3"
          >
            <Square className="h-4 w-4 text-text-muted" /> Deselect all
          </button>

          <div className="px-3 py-1.5 border-b border-border-light/50 my-1 mt-2">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Actions</p>
          </div>
          <button
            onClick={onCopyAll}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-[#F0F1F3] flex items-center gap-3"
          >
            <Copy className="h-4 w-4 text-text-muted" /> Copy all emails
          </button>
          <button
            onClick={onExportSelected}
            disabled={selectedCount === 0}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-[#F0F1F3] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 text-text-muted" /> Export selected
          </button>
          <div className="border-t border-border-light my-1" />
          <button
            onClick={onRemoveSelected}
            disabled={selectedCount === 0}
            className="w-full px-3 py-2 text-left text-sm text-error-text hover:bg-error-bg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Trash2 className="h-4 w-4 text-error-text" /> Remove selected
          </button>
        </div>
      )}
    </div>
  );
}

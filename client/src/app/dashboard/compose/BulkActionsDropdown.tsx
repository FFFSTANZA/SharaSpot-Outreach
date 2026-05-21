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
          "h-10 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all",
          selectedCount > 0
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
        {selectedCount > 0 ? `${selectedCount} selected` : "Bulk Actions"}
        <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-sm py-2 min-w-[200px] z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
          <div className="px-3 py-1.5 border-b border-gray-50 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selection</p>
          </div>
          <button
            onClick={onSelectAll}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <CheckSquare className="h-4 w-4 text-gray-400" /> Select all ({totalCount})
          </button>
          <button
            onClick={onDeselectAll}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <Square className="h-4 w-4 text-gray-400" /> Deselect all
          </button>

          <div className="px-3 py-1.5 border-b border-gray-50 my-1 mt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</p>
          </div>
          <button
            onClick={onCopyAll}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <Copy className="h-4 w-4 text-gray-400" /> Copy all emails
          </button>
          <button
            onClick={onExportSelected}
            disabled={selectedCount === 0}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 text-gray-400" /> Export selected
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={onRemoveSelected}
            disabled={selectedCount === 0}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Trash2 className="h-4 w-4 text-red-500" /> Remove selected
          </button>
        </div>
      )}
    </div>
  );
}

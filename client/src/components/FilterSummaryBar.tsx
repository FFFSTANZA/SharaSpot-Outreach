"use client";

import { X } from "lucide-react";
import type { SenderResponse } from "@/types";

interface FilterSummaryBarProps {
  filters: Record<string, string>;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  senders?: SenderResponse[];
}

const FILTER_LABELS: Record<string, string> = {
  q: "Query",
  status: "Status",
  senderId: "Account",
  starred: "Starred",
  dateFrom: "Start",
  dateTo: "End",
  dateField: "Map",
};

export default function FilterSummaryBar({
  filters, onRemoveFilter, onClearAll, senders = [],
}: FilterSummaryBarProps) {
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => value && key !== "dateField"
  );

  if (activeFilters.length === 0) return null;

  const resolveValue = (key: string, value: string) => {
    if (key === "senderId") {
      const sender = senders.find((s) => s.id === value);
      return sender ? sender.email : value;
    }
    if (key === "starred") return "Active";
    return value;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 md:px-6 py-3 bg-gray-50/30 border-b border-gray-100">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mr-1">Active Filters:</span>
      {activeFilters.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-gray-700 shadow-sm transition-all hover:border-brand/20"
        >
          <span className="text-brand opacity-60">{FILTER_LABELS[key] || key}</span>
          <span className="max-w-[150px] truncate text-gray-900">{resolveValue(key, value)}</span>
          <button
            onClick={() => onRemoveFilter(key)}
            className="ml-1 text-gray-300 hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-all px-3 py-1.5 hover:bg-red-50 rounded-lg ml-1"
      >
        Clear All
      </button>
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SenderResponse } from "@/types";
import Dropdown from "./Dropdown";
import Button from "./Button";

interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  senders: SenderResponse[];
  statusOptions: string[];
  showDateField?: boolean;
}

const DATE_FIELD_OPTIONS = [
  { label: "Created", value: "createdAt" },
  { label: "Scheduled", value: "scheduledAt" },
  { label: "Sent", value: "sentAt" },
];

export default function FilterPanel({
  isOpen, onToggle, onClose, filters, onFilterChange, onClearAll,
  activeFilterCount, senders, statusOptions, showDateField,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const statusOpts = statusOptions.map((s) => ({ label: s, value: s }));
  const senderOpts = senders.map((s) => ({ label: s.name ? `${s.name} (${s.email})` : s.email, value: s.id }));

  return (
    <div ref={panelRef} className="relative">
      {/* Filter toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          "relative flex items-center gap-2 px-4 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-card",
          isOpen ? "bg-brand text-white" : "bg-white text-text-muted border border-border-light hover:bg-[#F0F1F3]"
        )}
      >
        <Filter className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Filters</span>
        {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-card">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          "absolute right-0 top-12 z-50 w-[340px] md:w-[380px] rounded-lg bg-white border border-border-light shadow-xl p-6 overflow-hidden",
          "origin-top-right transition-all duration-300 ease-out",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "pointer-events-none scale-95 opacity-0 -translate-y-2"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Filters</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F0F1F3] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Status</label>
            <Dropdown
              options={statusOpts}
              value={filters.status || ""}
              onChange={(v) => onFilterChange("status", v)}
              placeholder="All Statuses"
            />
          </div>

          {/* Sender */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Sender Account</label>
            <Dropdown
              options={senderOpts}
              value={filters.senderId || ""}
              onChange={(v) => onFilterChange("senderId", v)}
              placeholder="All Senders"
            />
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Date Range</label>
            <div className="flex gap-3">
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                className="flex-1 h-11 rounded-lg bg-[#F8F9FA] border border-border-light px-3 text-xs text-text-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand font-bold transition-all"
              />
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => onFilterChange("dateTo", e.target.value)}
                className="flex-1 h-11 rounded-lg bg-[#F8F9FA] border border-border-light px-3 text-xs text-text-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand font-bold transition-all"
              />
            </div>
          </div>

          {/* Date field selector */}
          {showDateField && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Filter By</label>
              <Dropdown
                options={DATE_FIELD_OPTIONS}
                value={filters.dateField || "createdAt"}
                onChange={(v) => onFilterChange("dateField", v)}
                placeholder="Created At"
              />
            </div>
          )}

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              className="w-full h-11 flex items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-widest text-error-text hover:bg-error-bg transition-all border border-transparent hover:border-error-bg"
              onClick={onClearAll}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

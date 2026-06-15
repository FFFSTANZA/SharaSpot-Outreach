"use client";

import { CalendarClock, Calendar, CheckCircle2 } from "lucide-react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledAt: Date | null;
  tempDate: string;
  tempTime: string;
  onTempDateChange: (date: string) => void;
  onTempTimeChange: (time: string) => void;
  onConfirm: () => void;
  onQuickPick: (days: number, hour: number) => void;
  onClear: () => void;
  isMobile: boolean;
}

export function ScheduleModal({
  isOpen,
  onClose,
  scheduledAt,
  tempDate,
  tempTime,
  onTempDateChange,
  onTempTimeChange,
  onConfirm,
  onQuickPick,
  onClear,
  isMobile,
}: ScheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm" onClick={onClose}>
      <div className={isMobile ? "fixed bottom-0 left-0 right-0 w-full rounded-t-lg bg-white shadow-premium-lg" : "w-full max-w-sm mx-4 rounded-lg bg-white shadow-premium-lg"} onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light border border-brand/10">
              <CalendarClock className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Schedule Email</h2>
              <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Choose when to start this campaign</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Start Date</label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => onTempDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-11 rounded-md border border-border-light bg-[#F8F9FA] px-3 text-sm text-text-secondary outline-none focus:border-brand/30 focus:ring-2 focus:ring-brand/10 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Start Time</label>
              <input
                type="time"
                value={tempTime}
                onChange={(e) => onTempTimeChange(e.target.value)}
                className="w-full h-11 rounded-md border border-border-light bg-[#F8F9FA] px-3 text-sm text-text-secondary outline-none focus:border-brand/30 focus:ring-2 focus:ring-brand/10 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Quick Suggestions</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Tomorrow\n10 AM", days: 1, hour: 10 },
                { label: "Tomorrow\n2 PM", days: 1, hour: 14 },
                { label: "Next Week\n9 AM", days: 7, hour: 9 },
              ].map(({ label, days, hour }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onQuickPick(days, hour)}
                  className="rounded-md border border-border-light bg-[#F8F9FA] p-3 text-center hover:border-brand/30 hover:bg-brand/5 transition-all group"
                >
                  <Calendar className="h-4 w-4 text-text-muted group-hover:text-brand mx-auto mb-1.5 transition-colors" />
                  <p className="text-[10px] font-bold text-text-secondary group-hover:text-brand whitespace-pre-line leading-tight transition-colors">
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-light">
            {scheduledAt ? (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-bold text-error-text hover:text-error-text/80 transition-colors px-2"
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex h-10 items-center justify-center rounded-md border border-border-light bg-white px-5 text-xs font-bold text-text-secondary transition-colors hover:bg-[#F0F1F3]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!tempDate || !tempTime}
                className="flex h-10 items-center gap-2 rounded-md bg-brand px-6 text-xs font-bold text-white transition-all hover:bg-brand/90 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

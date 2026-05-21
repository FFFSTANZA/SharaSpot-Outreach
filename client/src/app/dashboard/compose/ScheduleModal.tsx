"use client";

import { CalendarClock, Calendar, CheckCircle2 } from "lucide-react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} variant={isMobile ? "bottom-sheet" : "center"}>
      <div className="space-y-6 min-w-[340px] p-2 text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
            <CalendarClock className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Schedule Email</h2>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Choose when to start this campaign</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Start Date</label>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => onTempDateChange(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700
                outline-none focus:border-[#00A63E]/40 focus:ring-2 focus:ring-[#00A63E]/10 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Start Time</label>
            <input
              type="time"
              value={tempTime}
              onChange={(e) => onTempTimeChange(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700
                outline-none focus:border-[#00A63E]/40 focus:ring-2 focus:ring-[#00A63E]/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-1">Quick Suggestions</p>
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
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center
                  hover:border-[#00A63E]/30 hover:bg-[#00A63E]/5 transition-all group"
              >
                <Calendar className="h-4 w-4 text-gray-300 group-hover:text-[#00A63E] mx-auto mb-1.5 transition-colors" />
                <p className="text-[10px] font-bold text-gray-600 group-hover:text-[#00A63E] whitespace-pre-line leading-tight transition-colors">
                  {label}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {scheduledAt ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2"
            >
              Clear
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-10 px-5 text-xs font-bold"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="h-10 px-6 text-xs font-bold gap-2"
              onClick={onConfirm}
              disabled={!tempDate || !tempTime}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Schedule
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

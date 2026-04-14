"use client";

import { SendTimeConfig } from "@/types";
import { Clock, Calendar } from "lucide-react";

interface AdvancedTimingEditorProps {
  config: SendTimeConfig;
  onChange: (config: SendTimeConfig) => void;
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function AdvancedTimingEditor({ config, onChange }: AdvancedTimingEditorProps) {
  const updateConfig = (field: keyof SendTimeConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <label className="text-[11px] font-medium text-gray-500">Advanced Timing & Timezone</label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Hours */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-600">Business Hours</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!config.businessHoursOnly}
                onChange={(e) => updateConfig("businessHoursOnly", e.target.checked)}
              />
              <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {config.businessHoursOnly && (
            <div className="flex items-center gap-2 px-1">
              <select
                value={config.businessStartHour ?? 9}
                onChange={(e) => updateConfig("businessStartHour", parseInt(e.target.value))}
                className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400">to</span>
              <select
                value={config.businessEndHour ?? 17}
                onChange={(e) => updateConfig("businessEndHour", parseInt(e.target.value))}
                className="h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Days & Timezone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-600">Skip Weekends</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!config.skipWeekends}
                onChange={(e) => updateConfig("skipWeekends", e.target.checked)}
              />
              <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-medium">Timezone</label>
            <select
              value={config.timezone || "UTC"}
              onChange={(e) => updateConfig("timezone", e.target.value)}
              className="w-full h-7 rounded border border-gray-200 bg-white px-1.5 text-[10px] outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

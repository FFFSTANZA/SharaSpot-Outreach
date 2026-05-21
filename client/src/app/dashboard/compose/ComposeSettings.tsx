"use client";

import { ChevronDown, Settings2, Zap, Eye, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface ComposeSettingsProps {
  isOpen: boolean;
  onToggle: () => void;
  delayBetweenEmails: number;
  onDelayChange: (value: number) => void;
  hourlyLimit: number;
  onHourlyLimitChange: (value: number) => void;
  trackOpens: boolean;
  onTrackOpensChange: (value: boolean) => void;
  trackClicks: boolean;
  onTrackClicksChange: (value: boolean) => void;
  priorityEnabled: boolean;
  onPriorityChange: (value: boolean) => void;
  signatures: Signature[];
  selectedSignatureId: string;
  onSignatureChange: (id: string) => void;
  onManageSignatures: () => void;
}

export function ComposeSettings({
  isOpen,
  onToggle,
  delayBetweenEmails,
  onDelayChange,
  hourlyLimit,
  onHourlyLimitChange,
  trackOpens,
  onTrackOpensChange,
  trackClicks,
  onTrackClicksChange,
  priorityEnabled,
  onPriorityChange,
  signatures,
  selectedSignatureId,
  onSignatureChange,
  onManageSignatures,
}: ComposeSettingsProps) {
  const selectedSignature = signatures.find(s => s.id === selectedSignatureId) || null;

  return (
    <>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gray-400" />
          Settings
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Sending Rate */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-green-600" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sending Strategy</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Minimum Delay</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={delayBetweenEmails}
                    onChange={(e) => onDelayChange(Number(e.target.value))}
                    className="w-full bg-white px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                    min={5}
                    max={300}
                  />
                  <span className="text-xs text-gray-400 font-bold whitespace-nowrap">sec / email</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Hourly Limit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => onHourlyLimitChange(Number(e.target.value))}
                    className="w-full bg-white px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                    min={1}
                    max={500}
                  />
                  <span className="text-xs text-gray-400 font-bold whitespace-nowrap">emails / hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-green-600" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Engagement Tracking</p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Track Opens</p>
                    <p className="text-[10px] text-gray-400">Know when recipients open</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={trackOpens}
                  onChange={(e) => onTrackOpensChange(e.target.checked)}
                  className="h-5 w-5 rounded-md border-gray-300 text-green-600 focus:ring-green-500/20 transition-all"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <MousePointer2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Track Clicks</p>
                    <p className="text-[10px] text-gray-400">Monitor link interactions</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={trackClicks}
                  onChange={(e) => onTrackClicksChange(e.target.checked)}
                  className="h-5 w-5 rounded-md border-gray-300 text-green-600 focus:ring-green-500/20 transition-all"
                />
              </label>
            </div>
          </div>

          {/* Sending Options */}
          <div className="px-4 py-3.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Priority</p>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-green-50">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Priority Sending</p>
                    <p className="text-[10px] text-gray-400">Skip the queue</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={priorityEnabled}
                  onChange={(e) => onPriorityChange(e.target.checked)}
                  className="h-5 w-5 rounded-md border-gray-300 text-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                />
              </label>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Priority Rules</p>
                <ul className="space-y-1.5">
                  {[
                    "Limit: 50 priority emails / day",
                    "Gap: 30s minimum between sends",
                    "Gmail rate: 100/hr, Others: 300/hr",
                    "Requires 20+ normal emails warmup"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                      <div className="h-1 w-1 rounded-full bg-green-600" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signature</p>
              <button
                onClick={onManageSignatures}
                className="text-xs text-green-600 hover:underline"
              >
                Manage
              </button>
            </div>
            <select
              value={selectedSignatureId}
              onChange={(e) => onSignatureChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="">No signature</option>
              {signatures.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {selectedSignature?.content && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
                <div dangerouslySetInnerHTML={{ __html: selectedSignature.content.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '') }} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

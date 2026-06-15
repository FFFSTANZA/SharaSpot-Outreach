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

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1",
        checked ? "bg-brand" : "bg-border-light"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
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
        className="flex w-full items-center justify-between rounded-lg border border-border-light bg-white p-3 text-sm font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]"
      >
        <span className="flex items-center gap-2">
          <Settings2 size={16} className="text-text-muted" />
          Settings
        </span>
        <ChevronDown size={14} className={cn("text-text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="overflow-hidden rounded-lg border border-border-light bg-white">
          <div className="border-b border-border-light p-4">
            <div className="mb-4 flex items-center gap-2">
              <Zap size={16} className="text-brand" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Inbox-First Sending</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border border-border-light bg-[#F8F9FA] p-3">
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Minimum Delay</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={delayBetweenEmails}
                    onChange={(e) => onDelayChange(Number(e.target.value))}
                    className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm font-medium text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    min={30}
                    max={300}
                  />
                  <span className="whitespace-nowrap text-xs font-semibold text-text-muted">sec / email</span>
                </div>
              </div>
              <div className="rounded-lg border border-border-light bg-[#F8F9FA] p-3">
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Sender Hourly Limit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => onHourlyLimitChange(Number(e.target.value))}
                    className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm font-medium text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    min={1}
                    max={40}
                  />
                  <span className="whitespace-nowrap text-xs font-semibold text-text-muted">emails / hr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-border-light p-4">
            <div className="mb-4 flex items-center gap-2">
              <Eye size={16} className="text-brand" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Optional Tracking</p>
            </div>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between rounded-md border border-transparent p-2.5 transition-all hover:border-border-light hover:bg-[#F8F9FA]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light">
                    <Eye size={16} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Track Opens</p>
                    <p className="text-[10px] text-text-muted">Adds a pixel; keep off for maximum placement</p>
                  </div>
                </div>
                <Toggle checked={trackOpens} onChange={onTrackOpensChange} id="track-opens" />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-md border border-transparent p-2.5 transition-all hover:border-border-light hover:bg-[#F8F9FA]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light">
                    <MousePointer2 size={16} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Track Clicks</p>
                    <p className="text-[10px] text-text-muted">Rewrites links; best for warm audiences</p>
                  </div>
                </div>
                <Toggle checked={trackClicks} onChange={onTrackClicksChange} id="track-clicks" />
              </label>
            </div>
          </div>

          <div className="border-b border-border-light px-4 py-3.5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Priority</p>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between rounded-md border border-transparent p-2.5 transition-all hover:border-border-light hover:bg-[#F8F9FA]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light">
                    <Zap size={16} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Priority Sending</p>
                    <p className="text-[10px] text-text-muted">Skip the queue</p>
                  </div>
                </div>
                <Toggle checked={priorityEnabled} onChange={onPriorityChange} id="priority" />
              </label>

              <div className="rounded-lg border border-dashed border-border-light bg-[#F8F9FA] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Priority Rules</p>
                <ul className="space-y-1">
                  {[
                    "Limit: 50 priority emails / day",
                    "Gap: 30s minimum between sends",
                    "Gmail rate: 100/hr, Others: 300/hr",
                    "Requires 20+ normal emails warmup"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2 text-[10px] font-medium text-text-secondary">
                      <span className="h-1 w-1 rounded-full bg-brand" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Signature</p>
              <button
                onClick={onManageSignatures}
                className="text-xs font-medium text-brand hover:underline"
              >
                Manage
              </button>
            </div>
            <select
              value={selectedSignatureId}
              onChange={(e) => onSignatureChange(e.target.value)}
              className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
            >
              <option value="">No signature</option>
              {signatures.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {selectedSignature?.content && (
              <div className="mt-2 rounded-md border border-border-light bg-[#F8F9FA] p-2 text-xs text-text-secondary">
                <div dangerouslySetInnerHTML={{ __html: selectedSignature.content
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
                  .replace(/<object[\s\S]*?<\/object>/gi, '')
                  .replace(/<embed[\s\S]*?<\/embed>/gi, '')
                  .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
                  .replace(/javascript\s*:/gi, '')
                }} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

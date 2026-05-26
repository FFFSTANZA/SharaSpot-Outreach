"use client";

import { useState, useCallback, useEffect } from "react";
import { Editor } from "./Editor";
import {
  Plus, Trash2, GripVertical, Eye, MousePointer2, MessageCircle,
  Clock, GitBranch, ChevronDown, Copy,
  CalendarDays, Ban, ListOrdered,
  Hourglass, Beaker, LayoutGrid,
  ArrowUpDown, Clock4, ArrowRight,
  Route, BarChart3, Search, History, FileText, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SequenceStepInput, SequenceConditionType,
  SequencePreset, FrequencyCap, SequenceScheduleConfig, FollowUpTemplate, FollowUpTemplatePayload
} from "@/types";
import { useToast } from "@/context/ToastContext";
import { followUpTemplateToPreset, listFollowUpTemplates, upsertFollowUpTemplate, getLastUsedTemplates } from "@/lib/followUpTemplates";

interface SequenceBuilderProps {
  steps: SequenceStepInput[];
  onChange: (steps: SequenceStepInput[]) => void;
  subject?: string;
  body?: string;
  scheduleConfig?: SequenceScheduleConfig;
  onScheduleConfigChange?: (config: SequenceScheduleConfig) => void;
  frequencyCaps?: FrequencyCap;
  onFrequencyCapsChange?: (caps: FrequencyCap) => void;
  editingTemplate?: FollowUpTemplate | null;
}

const MAX_FOLLOW_UPS = 10;

const CONDITION_OPTIONS: { value: string; label: string; icon: typeof Eye }[] = [
  { value: "none", label: "After delay", icon: Clock },
  { value: "opened", label: "If opened", icon: Eye },
  { value: "clicked", label: "If clicked", icon: MousePointer2 },
  { value: "replied", label: "If replied", icon: MessageCircle },
];

const SEND_HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i < 12 ? 'AM' : 'PM'}` }));

const DEFAULT_SCHEDULE_CONFIG: SequenceScheduleConfig = { sendHour: -1, skipWeekends: true, allowedDaysOfWeek: [1, 2, 3, 4, 5] };
const DEFAULT_FREQUENCY_CAPS: FrequencyCap = { maxPerRecipient: 0, maxPerDay: 0, maxPerWeek: 0 };

function buildAutoFollowupCopy(baseSubject: string, baseBody: string, index: number): { subject: string; body: string } {
  const cleanSubject = baseSubject.trim() || "Quick follow-up";
  const followUpSubject = index === 0 ? `Re: ${cleanSubject}` : `Follow-up ${index + 1}: ${cleanSubject}`;
  const bodyPrefix = ["<p>Quick nudge in case this got buried.</p>", "<p>Following up with one more angle that may help.</p>", "<p>Last follow-up from my side.</p>"][Math.min(index, 2)];
  return { subject: followUpSubject, body: `${bodyPrefix}<p>If useful, happy to share details or book 15 minutes.</p>${baseBody ? `<hr/>${baseBody}` : ""}` };
}

function evaluateHealth(steps: SequenceStepInput[]) {
  const issues: string[] = [];
  const totalWait = steps.reduce((sum, s) => sum + (s.waitDays || 0), 0);
  const avgWords = steps.length ? steps.reduce((sum, s) => sum + (s.body?.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length || 0), 0) / steps.length : 0;
  if (steps.length > 6) issues.push("High step count. Consider 6 or fewer for better completion.");
  if (steps.some((s) => s.waitDays < 2)) issues.push("Some timing gaps are tight (less than 2 days).");
  if (avgWords > 140) issues.push("Follow-up copy is long. Shorter messages perform better.");
  if (!steps.some((s) => /book|meeting|call|reply|schedule|demo/i.test(s.body || ""))) issues.push("CTA is unclear. Add a direct next action.");
  return { score: Math.max(0, 100 - issues.length * 18 - Math.max(0, steps.length - 4) * 4 - Math.max(0, totalWait - 21)), issues };
}

function DragHandle(p: { dragHandleProps?: any }) {
  return <div {...p.dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"><GripVertical className="h-4 w-4 text-gray-300" /></div>;
}

function StepCard({
  step, index, isExpanded, onToggle, onRemove, onUpdate, onDuplicate,
  isDragging, dragHandleProps, mode, steps,
}: {
  step: SequenceStepInput; index: number; isExpanded: boolean;
  onToggle: () => void; onRemove: () => void;
  onUpdate: (field: keyof SequenceStepInput | "condition", value: any) => void;
  onDuplicate?: () => void; isDragging?: boolean; dragHandleProps?: any; mode?: "simple" | "advanced";
  steps?: SequenceStepInput[];
}) {
  const condType = step.condition?.type || "none";
  const isInitial = index === -1;
  const stepNumber = isInitial ? 1 : index + 2;
  const hasCondition = condType !== "none";
  const hasAB = !!(step.altSubjects?.length);
  const hasCustomTime = typeof step.sendHour === "number" && step.sendHour >= 0;
  const isEmpty = !step.subject?.trim() && !(step.body || "").replace(/<[^>]+>/g, "").trim();
  const condOpt = CONDITION_OPTIONS.find(o => o.value === condType);
  const showDrag = !isInitial && mode === "advanced";
  const currentNodeId = !isInitial ? `n${index + 1}` : null;
  const matchNodeId = step.condition?.onMatchNodeId ?? null;
  const noMatchNodeId = step.condition?.onNoMatchNodeId ?? null;
  const parseStepFromNodeId = (nodeId: string | null | undefined) => {
    if (!nodeId) return null;
    const parsed = parseInt(nodeId.replace("n", ""), 10);
    return Number.isNaN(parsed) ? null : parsed;
  };
  const currentStepNumber = !isInitial ? index + 1 : null;
  const matchStepNumber = parseStepFromNodeId(matchNodeId);
  const noMatchStepNumber = parseStepFromNodeId(noMatchNodeId);
  const hasSelfRoute = !!currentNodeId && (matchNodeId === currentNodeId || noMatchNodeId === currentNodeId);
  const hasBackwardRoute = !!currentStepNumber && (
    (matchStepNumber !== null && matchStepNumber <= currentStepNumber) ||
    (noMatchStepNumber !== null && noMatchStepNumber <= currentStepNumber)
  );

  return (
    <div className={cn("group", isDragging && "opacity-50")}>
      <div className={cn(
        "border rounded-lg bg-white transition-all",
        isExpanded ? "border-gray-300" : "border-gray-200 hover:border-gray-300",
        isEmpty && !isExpanded && "border-dashed border-gray-300"
      )}>
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer select-none",
          isExpanded && "border-b border-gray-100"
        )} onClick={onToggle}>
          {showDrag && <DragHandle dragHandleProps={dragHandleProps} />}
          <span className="text-xs font-semibold text-gray-400 shrink-0 w-12">Step {stepNumber}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-semibold",
                isExpanded ? "text-gray-900" : "text-gray-800"
              )}>
                {isInitial ? "Initial Email" : `Follow-up #${stepNumber - 1}`}
              </span>
              {hasCondition && condOpt && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                  <condOpt.icon className="h-3 w-3" />{condOpt.label}
                </span>
              )}
              {mode === "advanced" && hasAB && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700">
                  <Beaker className="h-3 w-3" />A/B
                </span>
              )}
              {mode === "advanced" && hasCustomTime && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                  <Clock4 className="h-3 w-3" />{SEND_HOURS[step.sendHour as number].label}
                </span>
              )}
            </div>
            {!isInitial && (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                <span>{step.waitDays}d</span>
                {step.subject && <><span className="text-gray-200">|</span><span className="truncate max-w-[200px]">{step.subject}</span></>}
                {isEmpty && !isExpanded && <span className="italic text-gray-300">Empty — click to edit</span>}
              </div>
            )}
            {isInitial && <p className="text-xs text-gray-400 mt-0.5">Primary outreach message</p>}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-300 transition-transform shrink-0",
            isExpanded && "rotate-180 text-gray-500"
          )} />
        </div>

        {isExpanded && !isInitial && (
          <div className="px-4 py-4 space-y-4 bg-gray-50/60">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-gray-400" />
                <input type="number" min={1} max={60} value={step.waitDays}
                  onChange={(e) => onUpdate("waitDays", parseInt(e.target.value) || 1)}
                  className="h-8 w-16 rounded-lg border border-gray-200 bg-white text-center text-xs font-semibold text-gray-900 outline-none focus:border-gray-400" />
                <span className="text-xs text-gray-500">days after previous</span>
              </div>
              {mode === "advanced" && (
                <div className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-gray-400" />
                  <select value={hasCustomTime ? step.sendHour : -1} onChange={(e) => onUpdate("sendHour", parseInt(e.target.value))}
                    className="h-8 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 outline-none px-2">
                    <option value={-1}>Default time</option>
                    {SEND_HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Trigger condition</label>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => onUpdate("condition", opt.value === "none" ? "none" : opt.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium transition-all",
                      (condType === opt.value) || (condType === "none" && opt.value === "none")
                        ? opt.value === "none"
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-gray-900 text-white border-gray-900"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                    )}>
                    <opt.icon className="h-3.5 w-3.5" />{opt.label}
                  </button>
                ))}
              </div>

              {mode === "advanced" && hasCondition && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <GitBranch className="h-3.5 w-3.5 text-gray-500" />
                      Flow routing
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                      {condOpt?.icon && <condOpt.icon className="h-3 w-3" />}
                      {condOpt?.label}
                    </span>
                  </div>

                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium",
                        "bg-white border-gray-200 text-gray-700"
                      )}>
                        <div className="h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-bold">
                          {stepNumber - 1}
                        </div>
                        <span>This step</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border",
                        "bg-gray-900 text-white border-gray-900"
                      )}>
                        <GitBranch className="h-3 w-3" />
                        {condOpt?.label}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />

                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-emerald-700 font-medium">Match</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] text-amber-600 font-medium">Fallback</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-emerald-200 overflow-hidden">
                        <div className="px-3 py-2 bg-emerald-50 flex items-center gap-2 border-b border-emerald-100">
                          <ArrowRight className="h-3 w-3 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-emerald-700">Condition met</span>
                          <span className="text-[10px] text-emerald-500 ml-auto">Follow-up sends</span>
                        </div>
                        <div className="p-3 space-y-2">
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Recipient <strong>{condOpt?.label?.toLowerCase()}</strong> the email.
                            After sending this follow-up, route them to:
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <select value={step.condition?.onMatchNodeId ?? ""}
                                onChange={(e) => { onUpdate("condition", { ...(step.condition ?? { type: condType as SequenceConditionType, rules: { operator: "AND", operands: [{ type: condType as SequenceConditionType }] } }), onMatchNodeId: e.target.value || null }); }}
                                className="w-full h-8 text-xs rounded-lg border border-emerald-200 bg-white px-2.5 outline-none focus:border-emerald-400 appearance-none">
                                <option value="">End sequence</option>
                                {(steps ?? []).map((_, idx) => <option key={`m${idx}`} value={`n${idx + 1}`}>{`Step ${idx + 1}`}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-medium text-emerald-700">
                              {matchStepNumber
                                ? `Routes to Step ${matchStepNumber}`
                                : "Routes to end of sequence"}
                            </span>
                            {matchStepNumber && steps?.[matchStepNumber - 1]?.subject && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                — {steps[matchStepNumber - 1].subject}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-200 overflow-hidden">
                        <div className="px-3 py-2 bg-amber-50 flex items-center gap-2 border-b border-amber-100">
                          <ArrowRight className="h-3 w-3 text-amber-600" />
                          <span className="text-[11px] font-semibold text-amber-700">Condition not met</span>
                          <span className="text-[10px] text-amber-500 ml-auto">Follow-up skipped</span>
                        </div>
                        <div className="p-3 space-y-2">
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Recipient did <strong>not</strong> {condOpt?.label?.toLowerCase()} the email.
                            Skip this follow-up and route them to:
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <select value={step.condition?.onNoMatchNodeId ?? ""}
                                onChange={(e) => { onUpdate("condition", { ...(step.condition ?? { type: condType as SequenceConditionType, rules: { operator: "AND", operands: [{ type: condType as SequenceConditionType }] } }), onNoMatchNodeId: e.target.value || null }); }}
                                className="w-full h-8 text-xs rounded-lg border border-amber-200 bg-white px-2.5 outline-none focus:border-amber-400 appearance-none">
                                <option value="">End sequence</option>
                                {(steps ?? []).map((_, idx) => <option key={`n${idx}`} value={`n${idx + 1}`}>{`Step ${idx + 1}`}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-amber-400" />
                            <span className="text-[10px] font-medium text-amber-700">
                              {noMatchStepNumber
                                ? `Routes to Step ${noMatchStepNumber}`
                                : "Routes to end of sequence"}
                            </span>
                            {noMatchStepNumber && steps?.[noMatchStepNumber - 1]?.subject && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                — {steps[noMatchStepNumber - 1].subject}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(hasSelfRoute || hasBackwardRoute) && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-2.5 flex items-start gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <div className="text-[11px] text-rose-700 leading-relaxed">
                          {hasSelfRoute && <span>This step routes <strong>to itself</strong>, creating a loop. </span>}
                          {!hasSelfRoute && hasBackwardRoute && <span>This step routes <strong>backward</strong> to an earlier step. </span>}
                          {hasSelfRoute && hasBackwardRoute && <span>Routes point to this step or earlier steps. </span>}
                          Loops may cause repeated sends. Only use if you intentionally want recipients to retry this step.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500">Follow-up subject</span>
                {mode === "advanced" && hasAB && (
                  <span className="text-[11px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    {step.altSubjects!.length + 1} variants
                  </span>
                )}
              </div>
              <div className="relative">
                <input value={step.subject} onChange={(e) => onUpdate("subject", e.target.value)}
                  placeholder="e.g. Quick follow-up regarding {{company}}"
                  className={cn(
                    "w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900",
                    mode === "advanced" ? "pr-14" : "pr-3"
                  )} />
                {mode === "advanced" && !hasAB && (
                  <button onClick={() => onUpdate("altSubjects", [""])}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2 rounded text-[11px] font-medium text-purple-600 hover:bg-purple-50 border border-gray-200 bg-white flex items-center gap-1">
                    <Beaker className="h-3 w-3" />A/B
                  </button>
                )}
              </div>
              {mode === "advanced" && hasAB && step.altSubjects?.map((alt, ai) => (
                <div key={ai} className="flex items-center gap-2 mt-2 pl-3 border-l-2 border-gray-200">
                  <span className="text-[11px] font-medium text-gray-400 w-12 shrink-0">Var {ai + 1}</span>
                  <input value={alt} onChange={(e) => { const u = [...(step.altSubjects || [])]; u[ai] = e.target.value; onUpdate("altSubjects", u); }}
                    placeholder="Alternate subject..." className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900" />
                  <button onClick={() => { const u = (step.altSubjects || []).filter((_, j) => j !== ai); onUpdate("altSubjects", u.length > 0 ? u : undefined); }}
                    className="h-8 w-8 flex items-center justify-center rounded text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {mode === "advanced" && hasAB && (step.altSubjects?.length || 0) < 3 && (
                <button onClick={() => onUpdate("altSubjects", [...(step.altSubjects || []), ""])}
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-purple-600 hover:text-purple-700">
                  <Plus className="h-3 w-3" /> Add variant
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Follow-up body</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Editor value={step.body} onChange={(html) => onUpdate("body", html)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {!isInitial && (
        <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
          {onDuplicate && (
            <button onClick={onDuplicate} className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50" title="Duplicate">
              <Copy className="h-3 w-3" />Duplicate
            </button>
          )}
          <button onClick={onRemove} className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] text-gray-400 hover:text-red-500 hover:bg-red-50" title="Remove">
            <Trash2 className="h-3 w-3" />Remove
          </button>
        </div>
      )}
    </div>
  );
}

function PresetSelector({ templates, onSelect }: { templates: FollowUpTemplate[]; onSelect: (p: SequencePreset) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const recentTemplates = getLastUsedTemplates(templates, 3);
  const recentIds = new Set(recentTemplates.map(t => t.id));

  const filtered = templates.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
  });

  const recent = filtered.filter(t => recentIds.has(t.id));
  const rest = filtered.filter(t => !recentIds.has(t.id));

  return (
    <div className="relative">
      <button onClick={() => { setIsOpen(!isOpen); setSearchQuery(""); }} className="inline-flex items-center gap-2 px-3 h-8 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
        <LayoutGrid className="h-3.5 w-3.5 text-gray-500" />Templates<ChevronDown className={cn("h-3 w-3 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg border border-gray-200 shadow-sm z-50 p-1 max-h-96 overflow-y-auto">
          <div className="px-2 pb-1 pt-1">
            <div className="flex items-center gap-1.5 px-2 h-8 rounded bg-gray-50 border border-gray-200 text-xs">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder:text-gray-400" />
            </div>
          </div>
          {templates.length === 0 && <p className="px-3 py-4 text-[11px] text-gray-500 text-center">No saved follow-up templates yet.</p>}
          {templates.length > 0 && filtered.length === 0 && <p className="px-3 py-4 text-[11px] text-gray-500 text-center">No matching templates.</p>}
          {recent.length > 0 && (
            <>
              <div className="px-3 py-1 flex items-center gap-1.5">
                <History className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Recently used</span>
              </div>
              <div className="px-1 pb-1">
                {recent.map(t => {
                  const p = followUpTemplateToPreset(t);
                  return <button key={p.name} onClick={() => { onSelect(p); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 flex items-start gap-2">
                    <History className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{p.label}</p>
                      <p className="text-[11px] text-gray-500 truncate">{p.description}</p>
                      <div className="flex gap-0.5 mt-1">{p.steps.map((_, i) => <div key={i} className="h-1 flex-1 rounded-full bg-gray-200" />)}</div>
                    </div>
                  </button>;
                })}
              </div>
              {rest.length > 0 && <div className="border-t border-gray-100 mx-2" />}
            </>
          )}
          {rest.length > 0 && (
            <>
              {recent.length > 0 && (
                <div className="px-3 py-1 flex items-center gap-1.5">
                  <LayoutGrid className="h-3 w-3 text-gray-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">All templates</span>
                </div>
              )}
              <div className="px-1 pb-1">
                {rest.map(t => {
                  const p = followUpTemplateToPreset(t);
                  return <button key={p.name} onClick={() => { onSelect(p); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-start gap-2">
                    <ListOrdered className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{p.label}</p>
                      <p className="text-[11px] text-gray-500 truncate">{p.description}</p>
                      <div className="flex gap-0.5 mt-1">{p.steps.map((_, i) => <div key={i} className="h-1 flex-1 rounded-full bg-gray-200" />)}</div>
                    </div>
                  </button>;
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleConfigPanel({ config, onChange }: { config: SequenceScheduleConfig; onChange: (c: SequenceScheduleConfig) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isActive = config.sendHour >= 0 || !config.skipWeekends;
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={cn("inline-flex items-center gap-2 px-3 h-8 rounded-lg border text-xs font-medium transition-all", isActive ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}>
        <CalendarDays className="h-3.5 w-3.5 text-gray-500" />Send time{isActive && <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg border border-gray-200 shadow-sm z-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-900">Follow-up send time</p>
          <p className="text-[11px] text-gray-500">Controls <strong>when during the day</strong> follow-up emails are delivered. The per-step timing above (e.g. "3 days after") determines the date; this setting adjusts the time-of-day.</p>
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Default send hour</label>
            <div className="flex items-center gap-2">
              <select value={config.sendHour} onChange={(e) => onChange({ ...config, sendHour: parseInt(e.target.value) })} className="flex-1 h-8 rounded border border-gray-200 text-xs px-2 bg-white">
                <option value={-1}>As soon as ready</option>
                {SEND_HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Allowed days</label>
            <div className="flex gap-1">
              {DAYS.map((day, i) => (
                <button key={i} onClick={() => { const cur = config.allowedDaysOfWeek || [1, 2, 3, 4, 5]; const nxt = cur.includes(i) ? cur.filter(d => d !== i) : [...cur, i].sort(); onChange({ ...config, allowedDaysOfWeek: nxt.length > 0 ? nxt : [i] }); }}
                  className={cn("flex-1 h-7 rounded text-[11px] font-medium transition-all", (config.allowedDaysOfWeek || [1, 2, 3, 4, 5]).includes(i) ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-400")}>{day}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.skipWeekends !== false} onChange={(e) => onChange({ ...config, skipWeekends: e.target.checked })}
              className="rounded border-gray-300 text-gray-800 h-4 w-4" />
            <span className="text-xs text-gray-700">Skip weekends</span>
          </label>
        </div>
      )}
    </div>
  );
}

function FrequencyCapsPanel({ caps, onChange }: { caps: FrequencyCap; onChange: (c: FrequencyCap) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const has = caps.maxPerRecipient > 0 || caps.maxPerDay > 0 || caps.maxPerWeek > 0;
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={cn("inline-flex items-center gap-2 px-3 h-8 rounded-lg border text-xs font-medium transition-all", has ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}>
        <Ban className="h-3.5 w-3.5 text-gray-500" />Limits{has && <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg border border-gray-200 shadow-sm z-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-900">Follow-up limits</p>
          <p className="text-[11px] text-gray-500">Control how many follow-ups a single recipient can receive across the sequence. These apply <strong>only to follow-up emails</strong>, not the initial message.</p>
          {(["maxPerRecipient", "maxPerDay", "maxPerWeek"] as const).map(key => (
            <div key={key}>
              <label className="text-[11px] font-medium text-gray-500 block mb-1">{key === 'maxPerRecipient' ? 'Per recipient (total)' : key === 'maxPerDay' ? 'Per recipient / day' : 'Per recipient / week'}</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={caps[key]} onChange={(e) => onChange({ ...caps, [key]: parseInt(e.target.value) || 0 })}
                  className="w-16 h-8 rounded border border-gray-200 text-center text-xs font-medium text-gray-900 bg-white" />
                <span className="text-[11px] text-gray-400">(0 = unlimited)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAddStep, onApplyPreset, templates }: { onAddStep: () => void; onApplyPreset: (p: SequencePreset) => void; templates: FollowUpTemplate[] }) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="px-8 py-12 md:py-16 text-center max-w-md mx-auto">
        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Route className="h-6 w-6 text-gray-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Build a follow-up sequence</h3>
        <p className="text-sm text-gray-500 mb-6">
          Automated follow-ups can <span className="font-medium text-gray-700">3x your reply rate</span>.
          Start from scratch, or import a saved follow-up template.
        </p>
        <button onClick={onAddStep}
          className="inline-flex items-center gap-2 px-5 h-10 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all mb-6">
          <Plus className="h-4 w-4" />Start from scratch
        </button>
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-medium text-gray-400 mb-3">Saved templates</p>
          {templates.length === 0 ? (
            <p className="text-xs text-gray-500">Create templates from the Templates tab, then import them here.</p>
          ) : (
          <div className="grid grid-cols-2 gap-2">
            {templates.slice(0, 6).map((t) => {
              const p = followUpTemplateToPreset(t);
              return (
              <button key={p.name} onClick={() => onApplyPreset(p)} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <ListOrdered className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{p.label}</p>
                  <div className="flex gap-0.5 mt-1">{p.steps.map((_, i) => <div key={i} className="h-1 flex-1 rounded-full bg-gray-200" />)}</div>
                </div>
              </button>
            )})}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthNote({ score, issues }: { score: number; issues: string[] }) {
  if (score >= 80) return null;
  const color = score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200";
  return (
    <div className={cn("border rounded-lg px-3 py-2 text-xs", color)}>
      {issues.length > 0 ? issues[0] : "Review your sequence setup."}
    </div>
  );
}

function PathChart({ steps }: { steps: SequenceStepInput[] }) {
  const [scenario, setScenario] = useState<"opened" | "clicked" | "replied" | "none">("opened");
  if (steps.length === 0) return null;

  const scenarioConfig = [
    { value: "opened" as const, label: "Opened", icon: Eye },
    { value: "clicked" as const, label: "Clicked", icon: MousePointer2 },
    { value: "replied" as const, label: "Replied", icon: MessageCircle },
    { value: "none" as const, label: "Did nothing", icon: Clock },
  ];
  const currentScenario = scenarioConfig.find(s => s.value === scenario)!;

  function condOpt(type: string) { return CONDITION_OPTIONS.find(o => o.value === type); }
  function condIcon(type: string) { return condOpt(type)?.icon ?? Clock; }
  function condLabel(type: string) { return condOpt(type)?.label ?? "After delay"; }
  function stepTargetId(s: SequenceStepInput, field: "onMatchNodeId" | "onNoMatchNodeId") {
    const v = s.condition?.[field]; return v ? parseInt(v.replace('n', '')) - 1 : null;
  }

  const infos = steps.map((s, i) => {
    const type = s.condition?.type || "none";
    const matchTgt = stepTargetId(s, "onMatchNodeId");
    const fallbackTgt = stepTargetId(s, "onNoMatchNodeId");
    return { type, noCondition: type === "none", matchTgt, fallbackTgt };
  });

  const fires = new Set<number>();
  const endIn = new Set<number>();
  let idx = 0;
  const visited = new Set<number>();
  while (idx >= 0 && idx < steps.length && !visited.has(idx)) {
    visited.add(idx); fires.add(idx);
    const info = infos[idx];
    if (info.noCondition) { idx++; }
    else if (info.type === scenario) { idx = info.matchTgt !== null ? info.matchTgt : idx + 1; }
    else { endIn.add(idx); idx = info.fallbackTgt !== null ? info.fallbackTgt : -1; }
  }

  const reachedVia: { from: number; label: string }[][] = steps.map(() => []);
  infos.forEach((info, j) => {
    if (info.matchTgt !== null) reachedVia[info.matchTgt].push({ from: j, label: `Step ${j + 1} match` });
    if (info.fallbackTgt !== null) reachedVia[info.fallbackTgt].push({ from: j, label: `Step ${j + 1} fallback` });
  });

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-800">Path Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">If recipient:</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {scenarioConfig.map(s => (
              <button key={s.value} onClick={() => setScenario(s.value)}
                className={cn("inline-flex items-center gap-1 px-2 h-7 rounded text-[11px] font-medium transition-all whitespace-nowrap",
                  scenario === s.value
                    ? "bg-white text-gray-900 border border-gray-200 shadow-sm"
                    : "text-gray-500 hover:text-gray-700")}>
                <s.icon className="h-3 w-3" />{s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="text-xs text-gray-500 mb-4 leading-relaxed">
          If recipient <strong className="text-gray-700">{currentScenario.label.toLowerCase()}</strong>, the <strong className="text-blue-700">highlighted path</strong> is taken.
          Faded steps are skipped. Each step shows <span className="text-emerald-600 font-medium">match</span> and <span className="text-amber-600 font-medium">fallback</span> routes.
        </div>

        <div className="relative">
          {steps.length > 1 && (
            <div className="absolute left-[15px] top-3 bottom-4 w-0.5 bg-gray-200 z-0" />
          )}
          <div className="space-y-0 relative z-10">
            {steps.map((s, i) => {
              const stepFires = fires.has(i);
              const stepEnds = endIn.has(i);
              const CondIcon = condIcon(infos[i].type);
              const label = condLabel(infos[i].type);

              return (
                <div key={i} className={cn("relative pb-3 last:pb-0 transition-opacity", !stepFires && "opacity-40")}>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0 w-[30px]">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ring-4",
                        stepFires ? "bg-blue-600 text-white ring-white" : "bg-gray-200 text-gray-400 ring-white"
                      )}>
                        {i + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pb-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-2 pt-0.5">
                        {s.subject ? (
                          <p className="text-xs font-semibold text-gray-900 truncate max-w-[200px]">{s.subject}</p>
                        ) : (
                          <p className="text-xs font-semibold italic text-gray-400">Step {i + 1}</p>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5 shrink-0">
                          <Clock className="h-2.5 w-2.5" />{s.waitDays || 0}d
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-1">
                        {!infos[i].noCondition && (
                          <div className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                            stepFires
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-400 border-gray-200"
                          )}>
                            <CondIcon className="h-2.5 w-2.5" />{label}
                            {stepFires && <span className="text-green-600 ml-0.5">✓</span>}
                          </div>
                        )}
                        {infos[i].noCondition && stepFires && (
                          <span className="text-[10px] text-gray-400">Always sends</span>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                          {infos[i].matchTgt !== null && (
                            <span className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              stepFires ? "text-emerald-600" : "text-gray-400"
                            )}>
                              <ArrowRight className="h-2.5 w-2.5" />
                              Match → Step {infos[i].matchTgt + 1}
                              {steps[infos[i].matchTgt]?.subject && (
                                <span className="text-gray-400 font-normal truncate max-w-[100px]">
                                  {steps[infos[i].matchTgt].subject}
                                </span>
                              )}
                            </span>
                          )}
                          {infos[i].fallbackTgt !== null && (
                            <span className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              stepFires ? "text-gray-400" : "text-amber-600"
                            )}>
                              <ArrowRight className="h-2.5 w-2.5" />
                              Fallback → Step {infos[i].fallbackTgt + 1}
                              {steps[infos[i].fallbackTgt]?.subject && (
                                <span className="text-gray-400 font-normal truncate max-w-[100px]">
                                  {steps[infos[i].fallbackTgt].subject}
                                </span>
                              )}
                            </span>
                          )}
                          {infos[i].matchTgt === null && !infos[i].noCondition && (
                            <span className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              stepFires ? "text-emerald-600" : "text-gray-400"
                            )}>
                              <ArrowRight className="h-2.5 w-2.5" />
                              Match → Next step
                            </span>
                          )}
                          {infos[i].fallbackTgt === null && !infos[i].noCondition && (
                            <span className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              stepFires ? "text-gray-400" : "text-amber-600"
                            )}>
                              <Ban className="h-2.5 w-2.5" />
                              Fallback → End
                            </span>
                          )}
                        </div>

                        {!stepFires && (
                          <p className="text-[10px] text-gray-400 italic mt-0.5">
                            Skipped — not reached in this scenario
                            {reachedVia[i].length > 0 && (
                              <span> (reachable via {reachedVia[i].map(r => r.label).join(", ")})</span>
                            )}
                          </p>
                        )}
                        {stepFires && stepEnds && (
                          <p className="text-[10px] text-gray-400 italic mt-0.5 flex items-center gap-1">
                            <Ban className="h-2.5 w-2.5" />
                            Sequence ends here for this scenario
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SequenceBuilder({
  steps, onChange, subject = "", body = "",
  scheduleConfig = DEFAULT_SCHEDULE_CONFIG, onScheduleConfigChange,
  frequencyCaps = DEFAULT_FREQUENCY_CAPS, onFrequencyCapsChange,
  editingTemplate,
}: SequenceBuilderProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<FollowUpTemplate[]>([]);
  const { addToast } = useToast();
  const health = evaluateHealth(steps);

  useEffect(() => {
    (async () => {
      try {
        const templates = await listFollowUpTemplates();
        setSavedTemplates(templates);
      } catch {
        addToast("error", "Failed to load follow-up templates");
      }
    })();
  }, []);

  const addStep = () => {
    if (steps.length >= MAX_FOLLOW_UPS) return;
    onChange([...steps, { subject: "", body: "", waitDays: 3 }]);
    setExpandedStep(steps.length);
  };
  const removeStep = (i: number) => {
    onChange(steps.filter((_, j) => j !== i));
    if (expandedStep === i) setExpandedStep(null);
    else if (expandedStep && expandedStep > i) setExpandedStep(expandedStep - 1);
  };
  const duplicateStep = (i: number) => {
    if (steps.length >= MAX_FOLLOW_UPS) return;
    onChange([...steps.slice(0, i + 1), { ...steps[i] }, ...steps.slice(i + 1)]);
  };
  const updateStep = (i: number, field: keyof SequenceStepInput, value: any) => {
    onChange(steps.map((s, j) => {
      if (j !== i) return s;
      if (field === "condition") {
        if (typeof value === "string") {
          if (value === "none" || value === undefined) {
            const { condition: _, ...r } = s;
            return r as SequenceStepInput;
          }
          if (mode === "advanced") {
            return {
              ...s,
              condition: {
                type: value as SequenceConditionType,
                rules: s.condition?.rules ?? { operator: "AND" as const, operands: [{ type: value as SequenceConditionType }] },
                onMatchNodeId: s.condition?.onMatchNodeId ?? null,
                onNoMatchNodeId: s.condition?.onNoMatchNodeId ?? null,
              }
            };
          }
          return { ...s, condition: { type: value as SequenceConditionType } };
        }
        return { ...s, condition: value };
      }
      return { ...s, [field]: value };
    }));
  };
  const moveStep = useCallback((from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const ns = [...steps]; const [m] = ns.splice(from, 1); ns.splice(to, 0, m);
    onChange(ns); setExpandedStep(to);
  }, [steps, onChange]);
  const applyPreset = async (preset: SequencePreset) => {
    onChange(
      preset.steps.map((s, i) => {
        const a = buildAutoFollowupCopy(subject, body, i);
        return {
          subject: s.subject || a.subject,
          body: s.body || a.body,
          waitDays: s.waitDays || 3,
          condition: s.condition as SequenceStepInput["condition"],
        };
      })
    );
    try {
      const templates = await listFollowUpTemplates();
      setSavedTemplates(templates);
    } catch {
      // no-op
    }
    addToast("success", `Applied "${preset.label}" preset`);
  };
  const autoFillCopy = () => {
    onChange(steps.map((s, i) => (s.subject.trim() || (s.body || "").replace(/<[^>]+>/g, "").trim()) ? s : { ...s, ...buildAutoFollowupCopy(subject, body, i) }));
    addToast("success", "Auto-filled empty follow-up copy");
  };
  const convertToAdvanced = () => {
    setMode("advanced");
    onChange(steps.map((s, i) => ({ ...s, condition: { type: s.condition?.type ?? "none", rules: s.condition?.rules ?? { operator: "AND", operands: s.condition?.type && s.condition.type !== "none" ? [{ type: s.condition.type }] : [] }, onMatchNodeId: s.condition?.onMatchNodeId ?? (i + 2 <= steps.length ? `n${i + 2}` : null), onNoMatchNodeId: s.condition?.onNoMatchNodeId ?? null } })));
  };
  const revertToSimple = () => {
    if (steps.some((s, i) => { const d = i + 2 <= steps.length ? `n${i + 2}` : null; return !!s.condition?.onNoMatchNodeId || (s.condition?.onMatchNodeId ?? d) !== d; })) {
      addToast("warning", "Revert not possible with custom branching"); return;
    }
    setMode("simple");
    onChange(steps.map((s) => ({ ...s, condition: s.condition?.type && s.condition.type !== "none" ? { type: s.condition.type } : undefined })));
  };
  const toggleExpand = (i: number) => setExpandedStep(expandedStep === i ? null : i);
  const saveCurrentAsTemplate = async () => {
    if (steps.length === 0) return;
    const name = editingTemplate
      ? editingTemplate.name
      : window.prompt("Template name", `Follow-up flow (${steps.length} steps)`);
    if (!name || !name.trim()) return;
    const payload: FollowUpTemplatePayload & { id?: string } = {
      id: editingTemplate?.id,
      name: name.trim(),
      description: editingTemplate?.description || `Saved from compose (${steps.length} steps)`,
      steps: steps.map((s) => ({
        waitDays: s.waitDays,
        condition: s.condition,
        subject: s.subject,
        body: s.body,
        altSubjects: s.altSubjects,
        sendHour: s.sendHour,
        waitHours: s.waitHours,
      })),
    };
    try {
      const template = await upsertFollowUpTemplate(payload);
      const templates = await listFollowUpTemplates();
      setSavedTemplates(templates);
      addToast("success", editingTemplate ? `Template updated: ${template.name}` : `Saved template: ${template.name}`);
    } catch {
      addToast("error", "Failed to save follow-up template");
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {editingTemplate && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <FileText className="h-4 w-4 shrink-0" />
          <span className="flex-1">Editing template: <strong>{editingTemplate.name}</strong></span>
          <span className="text-xs text-blue-600">Click "Update template" to save changes</span>
        </div>
      )}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Follow-up Sequence</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {mode === "simple"
              ? "Add timed follow-ups that send based on recipient behavior."
              : "Configure branching rules, behavior triggers, and advanced routing."}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => mode === "advanced" ? revertToSimple() : setMode("simple")}
            className={cn("px-3 h-7 rounded-md text-xs font-medium transition-all", mode === "simple" ? "bg-white text-gray-900 border border-gray-200 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            Simple
          </button>
          <button onClick={convertToAdvanced}
            className={cn("px-3 h-7 rounded-md text-xs font-medium transition-all", mode === "advanced" ? "bg-white text-gray-900 border border-gray-200 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            Advanced
          </button>
        </div>
      </div>

      {mode === "simple" && steps.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 px-4 py-2.5 flex items-center gap-3">
          <p className="text-xs text-gray-600 flex-1">
            Each step sends in order. Set a condition to skip based on whether recipients opened, clicked, or replied.
          </p>
          <button onClick={autoFillCopy} className="inline-flex items-center gap-1.5 px-3 h-7 rounded bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shrink-0">
            Auto-fill copy
          </button>
        </div>
      )}

      {mode === "advanced" && steps.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 px-4 py-2.5 flex items-center gap-3">
          <p className="text-xs text-gray-600 flex-1">
            Combine behavior triggers with AND/OR logic. Route recipients to different steps based on their actions.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <PresetSelector templates={savedTemplates} onSelect={applyPreset} />
        <span className="text-gray-200 text-xs">|</span>
        <button onClick={saveCurrentAsTemplate} disabled={steps.length === 0}
          className={cn("inline-flex items-center gap-2 px-3 h-8 rounded-lg border text-xs font-medium", steps.length === 0 ? "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}
        >
          <Route className="h-3.5 w-3.5" />{editingTemplate ? "Update template" : "Save as template"}
        </button>
        {onScheduleConfigChange && <ScheduleConfigPanel config={scheduleConfig} onChange={onScheduleConfigChange} />}
        {onFrequencyCapsChange && <FrequencyCapsPanel caps={frequencyCaps} onChange={onFrequencyCapsChange} />}
        <div className="ml-auto">
          <button onClick={addStep} disabled={steps.length >= MAX_FOLLOW_UPS}
            className={cn("inline-flex items-center gap-2 px-4 h-8 rounded-lg text-xs font-medium transition-all", steps.length >= MAX_FOLLOW_UPS ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800")}>
            <Plus className="h-3.5 w-3.5" />Add Step
          </button>
        </div>
      </div>

      <div>
        {steps.length === 0 ? (
          <EmptyState onAddStep={addStep} onApplyPreset={applyPreset} templates={savedTemplates} />
        ) : (
          <div className="space-y-3">
            <HealthNote score={health.score} issues={health.issues} />

            <div className="space-y-4">
              <StepCard step={{ subject: "", body: "", waitDays: 0 }} index={-1} isExpanded={false} onToggle={()=>{}} onRemove={()=>{}} onUpdate={()=>{}} mode={mode} steps={steps} />

              {steps.map((step, i) => (
                <div key={i}
                  draggable={mode === "advanced"}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIndex !== null && dragIndex !== i) moveStep(dragIndex, i); setDragIndex(null); }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <StepCard step={step} index={i} isExpanded={expandedStep === i} onToggle={() => toggleExpand(i)} onRemove={() => removeStep(i)} onUpdate={(f, v) => updateStep(i, f, v)} onDuplicate={() => duplicateStep(i)} mode={mode} steps={steps} />
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {steps.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
          {mode === "advanced" && steps.length > 1 && (
            <span className="flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" />Drag to reorder</span>
          )}
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{steps.length} step{steps.length > 1 ? 's' : ''}, ~{steps.reduce((s, st) => s + (st.waitDays || 0), 0)} days total</span>
        </div>
      )}

      {mode === "advanced" && steps.length > 0 && <PathChart steps={steps} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Editor } from "./Editor";
import { Plus, Trash2, GripVertical, Eye, MousePointer2, MessageCircle, Clock, GitBranch, ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceStepInput, SequenceConditionType } from "@/types";

interface SequenceBuilderProps {
  steps: SequenceStepInput[];
  onChange: (steps: SequenceStepInput[]) => void;
}

const MAX_FOLLOW_UPS = 8;

const CONDITION_OPTIONS: { value: SequenceConditionType; label: string; icon: typeof Eye; color: string; description: string }[] = [
  { value: "none", label: "After delay", icon: Clock, color: "gray", description: "Send after waiting" },
  { value: "opened", label: "If opened", icon: Eye, color: "brand", description: "Send if email was opened" },
  { value: "clicked", label: "If clicked", icon: MousePointer2, color: "purple", description: "Send if link was clicked" },
  { value: "replied", label: "If replied", icon: MessageCircle, color: "brand", description: "Send if recipient replied" },
];

function ConditionBadge({ type }: { type: SequenceConditionType }) {
  const option = CONDITION_OPTIONS.find(o => o.value === type);
  if (!option || type === "none") return null;

  const colorClasses: Record<string, string> = {
    brand: "bg-brand text-white border-transparent shadow-sm",
    purple: "bg-purple-600 text-white border-transparent shadow-sm",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
      colorClasses[option.color]
    )}>
      <option.icon className="h-3 w-3" />
      {option.label}
    </span>
  );
}

function TimelineConnector({ hasBranch = false }: { hasBranch?: boolean }) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className={cn(
        "flex flex-col items-center",
        hasBranch ? "text-purple-500" : "text-gray-200"
      )}>
        <div className="h-8 w-1 bg-current rounded-full opacity-50" />
        {hasBranch && <GitBranch className="h-4 w-4 my-1" />}
      </div>
    </div>
  );
}

function TimelineNode({
  step,
  index,
  isExpanded,
  onToggle,
  onRemove,
  onUpdate,
}: {
  step: SequenceStepInput;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (field: keyof SequenceStepInput, value: string | number | SequenceStepInput["condition"] | undefined) => void;
}) {
  const conditionOption = CONDITION_OPTIONS.find(o => o.value === step.condition?.type) || CONDITION_OPTIONS[0];
  const isInitial = index === -1;
  const stepNumber = isInitial ? 1 : index + 2;

  const nodeColors: Record<string, string> = {
    brand: "bg-brand shadow-brand/20",
    purple: "bg-purple-600 shadow-purple-600/20",
    gray: "bg-gray-900 shadow-gray-900/10",
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {!isInitial && <TimelineConnector hasBranch={step.condition?.type !== "none" && step.condition?.type !== undefined} />}

      <div className={cn(
        "rounded-2xl border transition-all duration-300 overflow-hidden bg-white",
        isExpanded 
          ? "border-brand shadow-xl ring-4 ring-brand/5 scale-[1.01]" 
          : "border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:border-brand/20 hover:scale-[1.005]"
      )}>
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={onToggle}
        >
          <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />

          {/* Step number circle */}
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-lg",
            nodeColors[conditionOption.color]
          )}>
            {stepNumber}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                {isInitial ? "Initial Campaign Email" : `Follow-up sequence #${stepNumber - 1}`}
              </p>
              {step.condition?.type && step.condition.type !== "none" && (
                <ConditionBadge type={step.condition.type} />
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
              {isInitial
                ? "Primary communication channel"
                : step.subject
                  ? `${step.waitDays} DAY DELAY • SUBJECT: ${step.subject}`
                  : `Waiting period: ${step.waitDays} business day${step.waitDays !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {!isInitial && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <ChevronDown
            className={cn(
              "h-5 w-5 text-gray-300 transition-transform duration-300 shrink-0",
              isExpanded && "rotate-180 text-brand"
            )}
          />
        </div>

        {/* Expanded content */}
        {isExpanded && !isInitial && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-2 duration-300">
            {/* Condition selector */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Flow Trigger Condition</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONDITION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate("condition", opt.value === "none" ? undefined : { type: opt.value })}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all",
                      step.condition?.type === opt.value || (!step.condition?.type && opt.value === "none")
                        ? opt.value === "none"
                          ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                          : opt.value === "opened"
                            ? "bg-brand border-brand text-white shadow-lg shadow-brand/20"
                            : opt.value === "clicked"
                              ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20"
                              : "bg-brand border-brand text-white shadow-lg shadow-brand/20"
                        : "bg-white border-gray-100 text-gray-500 hover:border-brand/20 hover:bg-gray-50"
                    )}
                  >
                    <opt.icon className="h-5 w-5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">{opt.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delay</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={step.waitDays}
                  onChange={(e) => onUpdate("waitDays", parseInt(e.target.value) || 1)}
                  className="h-9 w-16 rounded-xl border border-gray-200 bg-white text-center text-sm font-black text-gray-900 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all shadow-sm"
                />
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Days</span>
              </div>

              {step.condition?.type && step.condition.type !== "none" && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-light text-brand text-[10px] font-black uppercase tracking-widest border border-brand/10">
                  <Zap className="h-3.5 w-3.5" />
                  Trigger Response: Immediate Delivery
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="px-1 block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Subject Line</label>
              <input
                value={step.subject}
                onChange={(e) => onUpdate("subject", e.target.value)}
                placeholder="Follow-up: regarding {{company}} opportunity"
                className="w-full px-5 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-gray-900"
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="px-1 block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Message Content</label>
              <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <Editor
                  value={step.body}
                  onChange={(html) => onUpdate("body", html)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SequenceBuilder({ steps, onChange }: SequenceBuilderProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const addStep = () => {
    if (steps.length >= MAX_FOLLOW_UPS) return;
    onChange([...steps, { subject: "", body: "", waitDays: 3 }]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
    setExpandedStep(null);
  };

  const updateStep = (index: number, field: keyof SequenceStepInput, value: string | number | SequenceStepInput["condition"] | undefined) => {
    const updated = steps.map((s, i) => {
      if (i !== index) return s;

      if (field === "condition" && typeof value !== "undefined") {
        return {
          ...s,
          condition: value as SequenceStepInput["condition"]
        };
      }

      return { ...s, [field]: value };
    });
    onChange(updated);
  };

  const toggleExpand = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Sequence Workflow</h2>
            {steps.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-brand text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">
                {steps.length} Follow-up{steps.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em]">
            Automate your outreach journey
          </p>
        </div>

        <button
          onClick={addStep}
          disabled={steps.length >= MAX_FOLLOW_UPS}
          className={cn(
            "flex items-center justify-center gap-2 px-6 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand/20",
            steps.length >= MAX_FOLLOW_UPS
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-brand text-white hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <Plus className="h-4 w-4" />
          Add Sequence Step
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {steps.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
            <div className="h-20 w-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <GitBranch className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">No follow-ups defined</p>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed mb-8">
              Sequences significantly increase reply rates by staying top-of-mind.
            </p>
            <button
              className="inline-flex items-center gap-3 px-8 h-12 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:scale-105 transition-all"
              onClick={addStep}
            >
              <Plus className="h-4 w-4" />
              Build First Step
            </button>
          </div>
        ) : (
          /* Follow-up accordion list */
          <div className="space-y-2">
            {/* Initial email node */}
            <TimelineNode
              step={{ subject: "", body: "", waitDays: 0 }}
              index={-1}
              isExpanded={false}
              onToggle={() => { }}
              onRemove={() => { }}
              onUpdate={() => { }}
            />

            {/* Follow-up nodes */}
            {steps.map((step, index) => (
              <TimelineNode
                key={index}
                step={step}
                index={index}
                isExpanded={expandedStep === index}
                onToggle={() => toggleExpand(index)}
                onRemove={() => removeStep(index)}
                onUpdate={(field, value) => updateStep(index, field, value)}
              />
            ))}

            {/* Add step button at end */}
            <div className="pt-8 flex justify-center">
              <button
                onClick={addStep}
                disabled={steps.length >= MAX_FOLLOW_UPS}
                className={cn(
                  "group flex flex-col items-center gap-3 transition-all",
                  steps.length >= MAX_FOLLOW_UPS
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:scale-110"
                )}
              >
                <div className="h-12 w-12 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 group-hover:border-brand group-hover:text-brand transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 group-hover:text-brand">Next Sequence Step</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

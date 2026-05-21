"use client";

import { useState } from "react";
import { Editor } from "./Editor";
import { Plus, Trash2, GripVertical, Eye, MousePointer2, MessageCircle, Clock, GitBranch, ChevronDown, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceStepInput, SequenceConditionType } from "@/types";
import { generateAIFollowUps } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";

interface SequenceBuilderProps {
  steps: SequenceStepInput[];
  onChange: (steps: SequenceStepInput[]) => void;
  subject?: string;
  body?: string;
}

const MAX_FOLLOW_UPS = 5;

const CONDITION_OPTIONS: { value: SequenceConditionType; label: string; icon: typeof Eye; color: string; description: string }[] = [
  { value: "none", label: "After delay", icon: Clock, color: "gray", description: "Send after waiting" },
  { value: "opened", label: "If opened", icon: Eye, color: "brand", description: "Send if email was opened" },
  { value: "clicked", label: "If clicked", icon: MousePointer2, color: "brand", description: "Send if link was clicked" },
  { value: "replied", label: "If replied", icon: MessageCircle, color: "brand", description: "Send if recipient replied" },
];

function ConditionBadge({ type }: { type: SequenceConditionType }) {
  const option = CONDITION_OPTIONS.find(o => o.value === type);
  if (!option || type === "none") return null;

  const colorClasses: Record<string, string> = {
    brand: "bg-brand/10 text-brand",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-transparent",
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
        hasBranch ? "text-green-500" : "text-gray-100"
      )}>
        <div className="h-8 w-1 bg-current rounded-full" />
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
  const conditionOption = CONDITION_OPTIONS.find(o => o.value === (step.condition?.type || "none")) || CONDITION_OPTIONS[0];
  const isInitial = index === -1;
  const stepNumber = isInitial ? 1 : index + 2;

  const nodeColors: Record<string, string> = {
    brand: "bg-brand",
    gray: "bg-gray-900",
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {!isInitial && <TimelineConnector hasBranch={step.condition?.type !== "none" && !!step.condition?.type} />}

      <div className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden bg-white",
        isExpanded
          ? "border-brand shadow-sm"
          : "border-gray-100 shadow-sm hover:border-gray-200"
      )}>
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={onToggle}
        >
          <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />

          {/* Step number circle */}
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm",
            nodeColors[conditionOption.color]
          )}>
            {stepNumber}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-gray-900">
                {isInitial ? "Initial Email" : `Follow-up #${stepNumber - 1}`}
              </p>
              {step.condition?.type && step.condition.type !== "none" && (
                <ConditionBadge type={step.condition.type} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {isInitial
                ? "Primary outreach message"
                : step.subject
                  ? `${step.waitDays} day delay • ${step.subject}`
                  : `${step.waitDays} business day delay`
              }
            </p>
          </div>

          {!isInitial && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <ChevronDown
            className={cn(
              "h-5 w-5 text-gray-300 transition-transform duration-200 shrink-0",
              isExpanded && "rotate-180 text-brand"
            )}
          />
        </div>

        {/* Expanded content */}
        {isExpanded && !isInitial && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-50 space-y-6">
            {/* Condition selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Trigger Condition</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONDITION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate("condition", opt.value === "none" ? "none" : opt.value)}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-xl border text-left transition-all",
                      (step.condition?.type === opt.value) || (!step.condition?.type && opt.value === "none")
                        ? "bg-brand text-white border-brand shadow-sm"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-wider">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delay</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={step.waitDays}
                  onChange={(e) => onUpdate("waitDays", parseInt(e.target.value) || 1)}
                  className="h-8 w-14 rounded-lg border border-gray-200 bg-white text-center text-sm font-bold text-gray-900 outline-none focus:border-brand transition-all"
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Days</span>
              </div>

              {step.condition?.type && step.condition.type !== "none" && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-light text-brand text-[11px] font-bold uppercase tracking-wider border border-brand/10">
                  <Zap className="h-3.5 w-3.5" />
                  Immediate delivery on trigger
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="px-1 block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject Line</label>
              <input
                value={step.subject}
                onChange={(e) => onUpdate("subject", e.target.value)}
                placeholder="Follow-up: regarding {{company}} opportunity"
                className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all font-bold text-gray-900"
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="px-1 block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message Content</label>
              <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
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

export default function SequenceBuilder({ steps, onChange, subject = "", body = "" }: SequenceBuilderProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const addStep = () => {
    if (steps.length >= MAX_FOLLOW_UPS) return;
    onChange([...steps, { subject: "", body: "", waitDays: 3, condition: undefined }]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
    setExpandedStep(null);
  };

  const updateStep = (index: number, field: keyof SequenceStepInput, value: string | number | SequenceStepInput["condition"] | undefined) => {
    const updated = steps.map((s, i) => {
      if (i !== index) return s;

      if (field === "condition") {
        const condType = value as string;
        if (condType === "none" || condType === undefined) {
          const { condition: _, ...rest } = s;
          return rest as SequenceStepInput;
        }
        return {
          ...s,
          condition: { type: condType as SequenceConditionType }
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
    <div className="mt-8 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Sequence Workflow</h2>
          <p className="text-xs text-text-secondary mt-1 font-bold uppercase tracking-widest">
            Automate your outreach journey
          </p>
        </div>

        <button
          onClick={addStep}
          disabled={steps.length >= MAX_FOLLOW_UPS}
          className={cn(
            "flex items-center justify-center gap-2 px-5 h-10 rounded-xl text-xs font-bold transition-all shadow-sm",
            steps.length >= MAX_FOLLOW_UPS
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-brand text-white hover:bg-brand-hover"
          )}
        >
          <Plus className="h-4 w-4" />
          Add Follow-up
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {steps.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="h-16 w-16 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <GitBranch className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-2">No follow-ups defined</p>
            <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed mb-8 font-medium">
              Sequences significantly increase reply rates by staying top-of-mind.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="inline-flex items-center gap-2 px-6 h-11 bg-brand text-white rounded-xl text-sm font-bold shadow-sm hover:bg-brand-hover transition-all"
                onClick={addStep}
              >
                <Plus className="h-4 w-4" />
                Build First Step
              </button>
              <AIFollowUpButton onAIFollowUps={(newSteps) => onChange(newSteps)} subject={subject} body={body} />
            </div>
          </div>
        ) : (
          /* Follow-up list */
          <div className="space-y-1">
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
                  "flex flex-col items-center gap-2 transition-all",
                  steps.length >= MAX_FOLLOW_UPS
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:scale-105"
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-300 hover:border-brand hover:text-brand transition-all">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Step</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AIFollowUpButtonProps {
  onAIFollowUps: (steps: SequenceStepInput[]) => void;
  disabled?: boolean;
  subject?: string;
  body?: string;
}

function AIFollowUpButton({ onAIFollowUps, disabled, subject = "", body = "" }: AIFollowUpButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleGenerate = async () => {
    if (!subject || !body) {
      addToast("error", "Please enter subject and body first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateAIFollowUps("", subject, body);
      
      if (result.followUps && result.followUps.length > 0) {
        const steps: SequenceStepInput[] = result.followUps.map((f: { subject: string; body: string; waitDays: number }) => ({
          subject: f.subject,
          body: f.body,
          waitDays: f.waitDays,
          condition: undefined,
        }));
        onAIFollowUps(steps);
        addToast("success", "AI follow-ups generated!");
      }
    } catch (error) {
      console.error("Failed to generate AI follow-ups:", error);
      addToast("error", "Failed to generate follow-ups. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="inline-flex items-center gap-2 px-6 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
      onClick={handleGenerate}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      <span>AI Generate</span>
    </button>
  );
}

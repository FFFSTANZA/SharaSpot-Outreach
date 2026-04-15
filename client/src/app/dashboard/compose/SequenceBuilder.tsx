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
  { value: "opened", label: "If opened", icon: Eye, color: "blue", description: "Send if email was opened" },
  { value: "clicked", label: "If clicked", icon: MousePointer2, color: "purple", description: "Send if link was clicked" },
  { value: "replied", label: "If replied", icon: MessageCircle, color: "green", description: "Send if recipient replied" },
];

function ConditionBadge({ type }: { type: SequenceConditionType }) {
  const option = CONDITION_OPTIONS.find(o => o.value === type);
  if (!option || type === "none") return null;

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
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
        "flex items-center gap-2",
        hasBranch ? "text-purple-500" : "text-gray-300"
      )}>
        <div className="h-6 w-px bg-current" />
        {hasBranch && <GitBranch className="h-3 w-3" />}
        <div className="h-6 w-px bg-current" />
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
    blue: "bg-blue-500 border-blue-600",
    purple: "bg-purple-500 border-purple-600",
    green: "bg-emerald-500 border-emerald-600",
    gray: "bg-gray-400 border-gray-500",
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {!isInitial && <TimelineConnector hasBranch={step.condition?.type !== "none" && step.condition?.type !== undefined} />}

      <div className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        isExpanded ? "border-indigo-200 shadow-sm bg-white ring-1 ring-indigo-100" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      )}>
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={onToggle}
        >
          <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />

          {/* Step number circle */}
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm",
            nodeColors[conditionOption.color]
          )}>
            {stepNumber}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {isInitial ? "Initial Email" : `Follow-up ${stepNumber - 1}`}
              </p>
              {step.condition?.type && step.condition.type !== "none" && (
                <ConditionBadge type={step.condition.type} />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {isInitial
                ? "Uses main subject and body"
                : step.subject
                  ? `"${step.subject.substring(0, 30)}${step.subject.length > 30 ? '...' : ''}" · ${step.waitDays}d wait`
                  : `Waiting: ${step.waitDays} day${step.waitDays !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {!isInitial && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-gray-300 transition-transform duration-200 shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        </div>

        {/* Expanded content */}
        {isExpanded && !isInitial && (
          <div className="px-3 pb-4 pt-2 border-t border-gray-50 space-y-4">
            {/* Condition selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Trigger Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate("condition", opt.value === "none" ? undefined : { type: opt.value })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                      step.condition?.type === opt.value || (!step.condition?.type && opt.value === "none")
                        ? opt.value === "none"
                          ? "bg-gray-100 border-gray-300 text-gray-700"
                          : opt.value === "opened"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : opt.value === "clicked"
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <opt.icon className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-80">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 shrink-0">Wait</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={step.waitDays}
                  onChange={(e) => onUpdate("waitDays", parseInt(e.target.value) || 1)}
                  className="h-8 w-16 rounded-md border border-gray-200 bg-white text-center text-xs font-semibold text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                />
                <span className="text-xs text-gray-500">day(s)</span>
              </div>

              {step.condition?.type && step.condition.type !== "none" && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Zap className="h-3 w-3" />
                  then send immediately
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Subject Line</label>
              <Input
                value={step.subject}
                onChange={(e) => onUpdate("subject", e.target.value)}
                placeholder="Follow-up: {{company}} opportunity"
                className="text-xs"
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Email Body</label>
              <div className="rounded-md border border-gray-200 overflow-hidden">
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
  const [showTimeline, setShowTimeline] = useState(true);

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
    <div className="mt-3 md:mt-4 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-700">
                Follow-up Sequence
              </p>
              {steps.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100">
                  {steps.length} step{steps.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {steps.length === 0
                ? "Add automated follow-ups to boost replies"
                : steps.length === 1
                  ? "1 follow-up after initial email"
                  : `${steps.length} follow-ups in sequence`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className={cn(
              "w-auto px-3.5 py-1.5 rounded-lg text-xs gap-1.5 font-medium",
              steps.length >= MAX_FOLLOW_UPS && "opacity-50 cursor-not-allowed"
            )}
            onClick={addStep}
            disabled={steps.length >= MAX_FOLLOW_UPS}
            title={steps.length >= MAX_FOLLOW_UPS ? `Maximum ${MAX_FOLLOW_UPS} follow-ups` : "Add follow-up step"}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Follow-up
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {steps.length === 0 ? (
          /* Empty state */
          <div className="text-center py-10">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
              <GitBranch className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No follow-up sequence yet</p>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Add automated follow-ups to increase replies. Each step can be sent after a delay or triggered by a recipient action.
            </p>
            <Button
              variant="outline"
              className="mt-5 px-5 py-2 rounded-lg text-xs font-medium"
              onClick={addStep}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Follow-up
            </Button>
          </div>
        ) : (
          /* Follow-up accordion list */
          <div className="space-y-0">
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
            <div className="pt-4 flex justify-center">
              <button
                onClick={addStep}
                disabled={steps.length >= MAX_FOLLOW_UPS}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-dashed transition-all text-xs font-semibold",
                  steps.length >= MAX_FOLLOW_UPS
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Step {steps.length + 1}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

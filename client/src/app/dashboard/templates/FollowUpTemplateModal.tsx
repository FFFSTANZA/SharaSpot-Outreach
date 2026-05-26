"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Editor } from "@/app/dashboard/compose/Editor";
import type { FollowUpTemplate, SequenceConditionType, SequenceStepInput } from "@/types";
import { ChevronDown, Clock, Eye, MousePointer2, MessageCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpTemplateModalProps {
  template?: FollowUpTemplate | null;
  onClose: () => void;
  onSave: (payload: { id?: string; name: string; description?: string; steps: Partial<SequenceStepInput>[] }) => void;
}

const MAX_STEPS = 10;

const CONDITION_OPTIONS = [
  { value: "none", label: "After delay", icon: Clock },
  { value: "opened", label: "If opened", icon: Eye },
  { value: "clicked", label: "If clicked", icon: MousePointer2 },
  { value: "replied", label: "If replied", icon: MessageCircle },
];

export default function FollowUpTemplateModal({ template, onClose, onSave }: FollowUpTemplateModalProps) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [steps, setSteps] = useState<Partial<SequenceStepInput>[]>(
    template?.steps?.length ? template.steps : [{ waitDays: 2, condition: { type: "opened" }, subject: "", body: "" }]
  );
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const updateStep = (index: number, field: string, value: unknown) => {
    setSteps((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      if (field === "waitDays") return { ...s, waitDays: value as number };
      if (field === "condition") {
        return value === "none" ? { ...s, condition: undefined } : { ...s, condition: { type: value as SequenceConditionType } };
      }
      return { ...s, [field]: value };
    }));
  };

  const condType = (step: Partial<SequenceStepInput>) => step.condition?.type || "none";

  return (
    <Modal isOpen onClose={onClose} className="max-w-[640px] w-[90vw] sm:w-full">
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">{template ? "Edit" : "New"} Follow-up Template</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Template name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="e.g. Event follow-up flow" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm" placeholder="Optional" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Steps</p>
            {steps.length < MAX_STEPS && (
              <button onClick={() => {
                const idx = steps.length;
                setSteps((prev) => [...prev, { waitDays: 3, condition: { type: "opened" }, subject: "", body: "" }]);
                setExpandedStep(idx);
              }} className="inline-flex items-center gap-1 text-xs font-medium text-[#00A63E] hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Step
              </button>
            )}
          </div>

          {steps.map((step, i) => {
            const isExpanded = expandedStep === i;
            const ct = condType(step);
            const condOpt = CONDITION_OPTIONS.find(o => o.value === ct);

            return (
              <div key={i} className="border border-gray-200 rounded-lg bg-white">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                >
                  <span className="text-xs font-semibold text-gray-400 shrink-0 w-16">Step {i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", step.subject ? "text-gray-900" : "text-gray-400")}>
                        {step.subject || "Empty step"}
                      </span>
                      {condOpt && ct !== "none" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                          <condOpt.icon className="h-3 w-3" />{condOpt.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{step.waitDays || 3}d</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-gray-300 transition-transform shrink-0", isExpanded && "rotate-180")} />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <input type="number" min={1} max={60} value={step.waitDays || 3}
                          onChange={(e) => updateStep(i, "waitDays", parseInt(e.target.value) || 1)}
                          className="h-8 w-16 rounded-lg border border-gray-200 bg-white text-center text-xs font-semibold text-gray-900 outline-none focus:border-gray-400" />
                        <span className="text-xs text-gray-500">days</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">When to send</label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => updateStep(i, "condition", opt.value)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium transition-all",
                              ct === opt.value
                                ? opt.value === "none"
                                  ? "bg-gray-800 text-white border-gray-800"
                                  : "bg-gray-900 text-white border-gray-900"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                            )}>
                            <opt.icon className="h-3.5 w-3.5" />{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">Subject</label>
                      <input value={step.subject || ""} onChange={(e) => updateStep(i, "subject", e.target.value)}
                        placeholder="e.g. Quick follow-up regarding {{company}}"
                        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">Body</label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Editor value={step.body || ""} onChange={(html) => updateStep(i, "body", html)} />
                      </div>
                    </div>

                    <button onClick={() => {
                      setSteps((prev) => prev.filter((_, idx) => idx !== i));
                      if (expandedStep === i) setExpandedStep(null);
                    }} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
                      <Trash2 className="h-3.5 w-3.5" /> Remove step
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {steps.length === 0 && (
            <p className="text-xs text-gray-400">No steps yet. Add at least one step.</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 rounded-lg" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 rounded-lg" onClick={() => onSave({ id: template?.id, name: name.trim(), description: description.trim() || undefined, steps })} disabled={!name.trim() || steps.length === 0}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

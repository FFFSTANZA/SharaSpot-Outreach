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
        <h2 className="text-lg font-semibold text-text-primary">{template ? "Edit" : "New"} Follow-up Template</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Template name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 rounded-lg border border-border-light px-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted" placeholder="e.g. Event follow-up flow" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-10 rounded-lg border border-border-light px-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted" placeholder="Optional" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Steps</p>
            {steps.length < MAX_STEPS && (
              <button onClick={() => {
                const idx = steps.length;
                setSteps((prev) => [...prev, { waitDays: 3, condition: { type: "opened" }, subject: "", body: "" }]);
                setExpandedStep(idx);
              }} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Step
              </button>
            )}
          </div>

          {steps.map((step, i) => {
            const isExpanded = expandedStep === i;
            const ct = condType(step);
            const condOpt = CONDITION_OPTIONS.find(o => o.value === ct);

            return (
              <div key={i} className="border border-border-light rounded-lg bg-white">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                >
                  <span className="text-xs font-semibold text-text-muted shrink-0 w-16">Step {i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", step.subject ? "text-text-primary" : "text-text-muted")}>
                        {step.subject || "Empty step"}
                      </span>
                      {condOpt && ct !== "none" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F8F9FA] text-text-secondary">
                          <condOpt.icon className="h-3 w-3" />{condOpt.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                      <span>{step.waitDays || 3}d</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform shrink-0", isExpanded && "rotate-180")} />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border-light">
                    <div className="flex items-center gap-4 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-text-muted" />
                        <input type="number" min={1} max={60} value={step.waitDays || 3}
                          onChange={(e) => updateStep(i, "waitDays", parseInt(e.target.value) || 1)}
                          className="h-8 w-16 rounded-lg border border-border-light bg-white text-center text-xs font-semibold text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10" />
                        <span className="text-xs text-text-muted">days</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-muted mb-2 block">When to send</label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => updateStep(i, "condition", opt.value)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium transition-all",
                              ct === opt.value
                                ? "bg-brand text-white border-brand"
                                : "bg-white border-border-light text-text-secondary hover:border-border-medium hover:text-text-primary"
                            )}>
                            <opt.icon className="h-3.5 w-3.5" />{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-muted mb-2 block">Subject</label>
                      <input value={step.subject || ""} onChange={(e) => updateStep(i, "subject", e.target.value)}
                        placeholder="e.g. Quick follow-up regarding {{company}}"
                        className="w-full h-10 px-3 text-sm border border-border-light rounded-lg outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 text-text-primary placeholder:text-text-muted" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-muted mb-2 block">Body</label>
                      <div className="border border-border-light rounded-lg overflow-hidden">
                        <Editor value={step.body || ""} onChange={(html) => updateStep(i, "body", html)} />
                      </div>
                    </div>

                    <button onClick={() => {
                      setSteps((prev) => prev.filter((_, idx) => idx !== i));
                      if (expandedStep === i) setExpandedStep(null);
                    }} className="inline-flex items-center gap-1 text-xs text-error-text hover:underline">
                      <Trash2 className="h-3.5 w-3.5" /> Remove step
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {steps.length === 0 && (
            <p className="text-xs text-text-muted">No steps yet. Add at least one step.</p>
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

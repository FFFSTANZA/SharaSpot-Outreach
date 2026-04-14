"use client";

import { useState, useEffect } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Editor } from "./Editor";
import { Plus, Trash2, GripVertical, ChevronDown, Save, FolderOpen, Users, Clock, Settings2, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceStepInput, SenderResponse, SequenceTemplate } from "@/types";
import ConditionBuilder from "@/components/ConditionBuilder";
import ABVariantEditor from "@/components/ABVariantEditor";
import AdvancedTimingEditor from "@/components/AdvancedTimingEditor";
import { getSenders, getSequenceTemplates, createSequenceTemplate } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";

interface SequenceBuilderProps {
  steps: SequenceStepInput[];
  onChange: (steps: SequenceStepInput[]) => void;
}

const MAX_FOLLOW_UPS = 5;

export default function SequenceBuilder({ steps, onChange }: SequenceBuilderProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [templates, setTemplates] = useState<SequenceTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    getSenders().then(setSenders);
    getSequenceTemplates().then(setTemplates);
  }, []);

  const addStep = () => {
    if (steps.length >= MAX_FOLLOW_UPS) return;
    onChange([...steps, { 
      subject: "", 
      body: "", 
      waitDays: 3,
      conditions: [],
      variants: [],
      sendTimeConfig: { timezone: "UTC" }
    }]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
    setExpandedStep(null);
  };

  const updateStep = (index: number, field: keyof SequenceStepInput, value: any) => {
    const updated = steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange(updated);
  };

  const saveAsTemplate = async () => {
    const name = prompt("Enter template name:");
    if (!name) return;
    try {
      await createSequenceTemplate({
        name,
        steps,
      });
      addToast("success", "Sequence template saved!");
      getSequenceTemplates().then(setTemplates);
    } catch (err: any) {
      addToast("error", err.response?.data?.error || "Failed to save template");
    }
  };

  const applyTemplate = (template: SequenceTemplate) => {
    onChange(template.steps as SequenceStepInput[]);
    setShowTemplates(false);
    addToast("info", `Applied template: ${template.name}`);
  };

  const toggleExpand = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  return (
    <div className="mt-3 md:mt-4 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-3 flex items-center justify-between bg-gray-50/30">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Follow-up Sequence
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-gray-400">
              {steps.length === 0
                ? "No follow-ups configured"
                : `${steps.length} follow-up${steps.length !== 1 ? "s" : ""}`}
            </p>
            {steps.length > 0 && (
              <button onClick={saveAsTemplate} className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-1">
                <Save className="h-3 w-3" /> Save as Template
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="w-auto px-2 py-1.5 rounded-lg text-[11px] gap-1"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <FolderOpen className="h-3 w-3" />
            Templates
          </Button>
          <Button
            variant="outline"
            className={cn(
              "w-auto px-3 py-1.5 rounded-lg text-[11px] gap-1 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
              steps.length >= MAX_FOLLOW_UPS && "opacity-50 cursor-not-allowed"
            )}
            onClick={addStep}
            disabled={steps.length >= MAX_FOLLOW_UPS}
          >
            <Plus className="h-3 w-3" />
            Add Step
          </Button>
        </div>
      </div>

      {showTemplates && (
        <div className="px-4 md:px-5 py-3 border-b border-gray-50 bg-gray-50/50">
          <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Available Templates</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <p className="text-[11px] font-semibold text-gray-700 truncate">{t.name}</p>
                <p className="text-[9px] text-gray-400">{(t.steps as any[]).length} steps</p>
              </button>
            ))}
            {templates.length === 0 && <p className="text-[10px] text-gray-400 col-span-full italic">No templates found</p>}
          </div>
        </div>
      )}

      {/* Step 0 indicator */}
      {steps.length > 0 && (
        <div className="mx-4 md:mx-5 mt-4 mb-2 px-3 py-2 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">1</div>
          <div>
            <p className="text-[11px] font-medium text-blue-900">
              Initial Email
            </p>
            <p className="text-[10px] text-blue-700/70">Sends immediately based on campaign schedule</p>
          </div>
        </div>
      )}

      {/* Follow-up steps */}
      <div className="px-4 md:px-5 pb-4 space-y-3 mt-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl border transition-all duration-200 overflow-hidden",
              expandedStep === index ? "border-blue-200 shadow-md ring-4 ring-blue-50" : "border-gray-100 hover:border-gray-200"
            )}
          >
            {/* Step header */}
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors",
                expandedStep === index ? "bg-blue-50/50" : "bg-white"
              )}
              onClick={() => toggleExpand(index)}
            >
              <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                {index + 2}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-gray-700">
                    Follow-up Step
                  </p>
                  <div className="flex items-center gap-1">
                    {(step.conditions?.length ?? 0) > 0 && <Settings2 className="h-3 w-3 text-orange-500" />}
                    {(step.variants?.length ?? 0) > 0 && <BarChart2 className="h-3 w-3 text-purple-500" />}
                    {step.senderId && <Users className="h-3 w-3 text-green-500" />}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 truncate">
                  {step.subject || "(No subject)"} · Wait {step.waitHours ? `${step.waitHours}h` : `${step.waitDays}d`}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-300 transition-transform duration-200",
                  expandedStep === index && "rotate-180"
                )}
              />
            </div>

            {/* Expanded content */}
            {expandedStep === index && (
              <div className="px-4 pb-4 space-y-5 bg-white border-t border-gray-50 pt-4">
                {/* Timing Row */}
                <div className="flex flex-wrap items-center gap-4 py-3 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <label className="text-[11px] font-medium text-gray-600">Wait</label>
                    <input
                      type="number"
                      min={1}
                      value={step.waitHours || step.waitDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (step.waitHours) updateStep(index, "waitHours", val);
                        else updateStep(index, "waitDays", val);
                      }}
                      className="h-7 w-12 rounded border border-gray-200 text-center text-[11px] font-bold outline-none focus:border-blue-500"
                    />
                    <select
                      value={step.waitHours ? "hours" : "days"}
                      onChange={(e) => {
                        if (e.target.value === "hours") {
                          updateStep(index, "waitHours", step.waitDays || 1);
                          updateStep(index, "waitDays", 0);
                        } else {
                          updateStep(index, "waitDays", step.waitHours || 1);
                          updateStep(index, "waitHours", null);
                        }
                      }}
                      className="h-7 rounded border border-gray-200 bg-white text-[11px] outline-none"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>

                  <div className="h-4 w-px bg-gray-200" />

                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    <label className="text-[11px] font-medium text-gray-600">Sender</label>
                    <select
                      value={step.senderId || ""}
                      onChange={(e) => updateStep(index, "senderId", e.target.value || null)}
                      className="h-7 rounded border border-gray-200 bg-white text-[11px] outline-none max-w-[150px]"
                    >
                      <option value="">Pool Rotation</option>
                      {senders.map(s => (
                        <option key={s.id} value={s.id}>{s.email}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Email Content / A/B Variants */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Content</p>
                      <button
                        onClick={() => {
                          if ((step.variants?.length ?? 0) === 0) {
                            updateStep(index, "variants", [
                              { name: "Variant A", subject: step.subject, body: step.body, weight: 50 },
                              { name: "Variant B", subject: step.subject, body: step.body, weight: 50 }
                            ]);
                          } else {
                            updateStep(index, "variants", []);
                          }
                        }}
                        className="text-[10px] text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {(step.variants?.length ?? 0) > 0 ? "Remove A/B Test" : "Add A/B Test"}
                      </button>
                    </div>

                    {(step.variants?.length ?? 0) > 0 ? (
                      <ABVariantEditor
                        variants={step.variants || []}
                        onChange={(variants) => updateStep(index, "variants", variants)}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Subject</label>
                          <Input
                            value={step.subject}
                            onChange={(e) => updateStep(index, "subject", e.target.value)}
                            placeholder="Re: {{company}} x SharaSpot"
                            className="text-xs h-9"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Body</label>
                          <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                            <Editor
                              value={step.body}
                              onChange={(html) => updateStep(index, "body", html)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Logic & Advanced Timing */}
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 space-y-6">
                      <ConditionBuilder
                        conditions={step.conditions || []}
                        onChange={(conditions) => updateStep(index, "conditions", conditions)}
                      />

                      <div className="h-px bg-gray-100" />

                      <AdvancedTimingEditor
                        config={step.sendTimeConfig || { timezone: "UTC" }}
                        onChange={(config) => updateStep(index, "sendTimeConfig", config)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {steps.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
            <Plus className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-sm font-medium text-gray-400">Add follow-up steps to your campaign</p>
            <p className="text-[11px] text-gray-300 mt-1 max-w-[200px] text-center">Automatically send emails if your recipients don't reply</p>
          </div>
        )}
      </div>
    </div>
  );
}

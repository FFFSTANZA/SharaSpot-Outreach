"use client";

import { SequenceCondition } from "@/types";
import { Plus, X } from "lucide-react";

interface ConditionBuilderProps {
  conditions: SequenceCondition[];
  onChange: (conditions: SequenceCondition[]) => void;
}

const CONDITION_TYPES = [
  { value: "if_no_reply", label: "No reply received" },
  { value: "if_opened", label: "Previous email opened" },
  { value: "if_not_opened", label: "Previous email not opened" },
  { value: "if_clicked", label: "Previous email link clicked" },
  { value: "if_not_clicked", label: "Previous email link not clicked" },
];

export default function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const addCondition = () => {
    onChange([...conditions, { type: "if_no_reply" }]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, type: SequenceCondition["type"]) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-gray-500">Sending Conditions</label>
        <button
          onClick={addCondition}
          className="text-[10px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Condition
        </button>
      </div>

      {conditions.length === 0 ? (
        <p className="text-[10px] text-gray-400 italic">Always sends after wait period</p>
      ) : (
        <div className="space-y-1.5">
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-medium shrink-0">If</span>
              <select
                value={condition.type}
                onChange={(e) => updateCondition(index, e.target.value as SequenceCondition["type"])}
                className="flex-1 h-7 rounded-md border border-gray-200 bg-white px-2 text-[11px] text-gray-700 focus:border-blue-500 focus:ring-0 outline-none"
              >
                {CONDITION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeCondition(index)}
                className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <p className="text-[9px] text-gray-400 px-1">Multiple conditions are evaluated with AND logic.</p>
        </div>
      )}
    </div>
  );
}

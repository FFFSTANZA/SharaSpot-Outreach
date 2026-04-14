"use client";

import { useState } from "react";
import Input from "@/components/Input";
import { Editor } from "@/app/dashboard/compose/Editor";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Variant {
  name: string;
  subject: string;
  body: string;
  weight: number;
}

interface ABVariantEditorProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

export default function ABVariantEditor({ variants, onChange }: ABVariantEditorProps) {
  const [expandedVariant, setExpandedVariant] = useState<number | null>(0);

  const addVariant = () => {
    const newVariant = {
      name: `Variant ${String.fromCharCode(65 + variants.length)}`,
      subject: "",
      body: "",
      weight: 50,
    };
    
    // Adjust weights of existing variants to accommodate new one
    const newWeight = Math.floor(100 / (variants.length + 1));
    const updated = [...variants.map(v => ({ ...v, weight: newWeight })), { ...newVariant, weight: 100 - (newWeight * variants.length) }];
    
    onChange(updated);
    setExpandedVariant(variants.length);
  };

  const removeVariant = (index: number) => {
    const remaining = variants.filter((_, i) => i !== index);
    // Redistribute weight
    if (remaining.length > 0) {
      const newWeight = Math.floor(100 / remaining.length);
      remaining.forEach((v, i) => {
        v.weight = i === remaining.length - 1 ? 100 - (newWeight * (remaining.length - 1)) : newWeight;
      });
    }
    onChange(remaining);
    setExpandedVariant(null);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-gray-500">A/B Testing Variants</label>
        <button
          onClick={addVariant}
          disabled={variants.length >= 4}
          className="text-[10px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          Add Variant
        </button>
      </div>

      <div className="space-y-2">
        {variants.map((variant, index) => (
          <div key={index} className="rounded-lg border border-gray-100 bg-gray-50/50 overflow-hidden">
            <div 
              className="px-3 py-2 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedVariant(expandedVariant === index ? null : index)}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                  {variant.name}
                </span>
                <span className="text-[10px] text-gray-500">{variant.weight}% weight</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); removeVariant(index); }}
                  className="p-1 rounded text-gray-300 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {expandedVariant === index ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
              </div>
            </div>

            {expandedVariant === index && (
              <div className="px-3 pb-3 space-y-3 bg-white border-t border-gray-100 pt-3">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-400">Variant Name</label>
                  <Input
                    value={variant.name}
                    onChange={(e) => updateVariant(index, "name", e.target.value)}
                    className="h-7 text-[11px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-400">Weight (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={variant.weight}
                      onChange={(e) => updateVariant(index, "weight", parseInt(e.target.value) || 0)}
                      className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[11px] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-400">Subject</label>
                  <Input
                    value={variant.subject}
                    onChange={(e) => updateVariant(index, "subject", e.target.value)}
                    className="h-7 text-[11px]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-gray-400">Body</label>
                  <div className="rounded border border-gray-100 overflow-hidden">
                    <Editor
                      value={variant.body}
                      onChange={(html) => updateVariant(index, "body", html)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

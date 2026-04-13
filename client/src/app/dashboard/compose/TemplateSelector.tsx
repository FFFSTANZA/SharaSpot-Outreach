"use client";

import { useEffect, useState } from "react";
import { getTemplates } from "@/lib/apis";
import type { EmailTemplate } from "@/types";
import { Search, FileText, Globe, User, ChevronRight } from "lucide-react";

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "personal" | "system">("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch {
        // Silently fail
      }
    })();
  }, []);

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                         t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "personal" && !t.isSystem) || 
                         (filter === "system" && t.isSystem);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-blue-300 transition-all"
        />
      </div>

      <div className="flex items-center gap-1">
        {(["all", "personal", "system"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full group flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50 transition-all text-left border border-transparent hover:border-blue-100"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                t.isSystem ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
              }`}>
                {t.isSystem ? <Globe className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                  {t.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{t.subject}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </button>
          ))
        ) : (
          <div className="py-8 text-center">
            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-[11px] text-gray-400">No templates found</p>
          </div>
        )}
      </div>
    </div>
  );
}

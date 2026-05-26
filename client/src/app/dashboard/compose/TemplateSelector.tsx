"use client";

import { useEffect, useState, useRef } from "react";
import { getTemplates } from "@/lib/apis";
import type { EmailTemplate } from "@/types";
import { cn } from "@/lib/utils";
import { FileText, Search, ChevronDown, X } from "lucide-react";

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await getTemplates();
        setTemplates(data || []);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = templates.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between h-9 px-3 rounded-lg border text-xs font-medium transition-all",
          isOpen
            ? "bg-white border-gray-300 text-gray-900"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300"
        )}>
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-gray-400" />
          <span>Use template</span>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <div className="flex items-center gap-1.5 px-2 h-8 rounded-md bg-gray-50 border border-gray-200 text-xs">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input ref={inputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder:text-gray-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border-t border-gray-100">
            {isLoading ? (
              <div className="px-4 py-6 text-center">
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-1/2 bg-gray-50 rounded animate-pulse mx-auto" />
              </div>
            ) : templates.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[11px] text-gray-400">No templates yet</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Create one from the Templates tab</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[11px] text-gray-400">No matching templates</p>
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((template) => (
                  <button key={template.id} onClick={() => { onSelect(template); setIsOpen(false); setSearchQuery(""); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2.5">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{template.name}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {template.subject || "No subject"}
                      </p>
                      {template.body && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {stripHtml(template.body).slice(0, 60)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

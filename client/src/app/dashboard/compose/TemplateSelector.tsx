"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/types";

interface TemplateSelectorProps {
  value?: EmailTemplate | null;
  onChange?: (template: EmailTemplate) => void;
  onSelect?: (template: EmailTemplate) => void;
  templates?: EmailTemplate[];
  isLoading?: boolean;
  placeholder?: string;
}

export default function TemplateSelector({
  value,
  onChange,
  onSelect,
  templates = [],
  isLoading = false,
  placeholder = "Select template...",
}: TemplateSelectorProps) {
  const handleSelect = onChange || onSelect;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center justify-between gap-2 w-full h-10 px-3 rounded-md border text-sm font-medium transition-all",
          value
            ? "bg-white border-border-light text-text-primary"
            : "bg-[#F8F9FA] border-border-light text-text-secondary hover:bg-white hover:border-border-light"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <span className="truncate text-[11px]">{value ? value.name : placeholder}</span>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-border-light shadow-premium-lg z-50 overflow-hidden">
          <div className="p-2">
            <div className="flex items-center gap-1.5 px-2 h-8 rounded-md bg-[#F8F9FA] border border-border-light text-xs">
              <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="flex-1 bg-transparent outline-none text-text-secondary placeholder:text-text-muted"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 text-text-muted hover:text-text-secondary">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border-t border-border-light">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-6 text-center">
                <FileText className="h-8 w-8 text-text-muted/50 mx-auto mb-2" />
                <p className="text-[11px] text-text-muted">No templates yet</p>
                <p className="text-[10px] text-text-muted/50 mt-0.5">Create one from the Templates tab</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[11px] text-text-muted">No matching templates</p>
              </div>
            ) : (
              filteredTemplates.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    handleSelect?.(template);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 transition-colors",
                    value?.id === template.id ? "bg-brand-light" : "hover:bg-[#F8F9FA]"
                  )}
                >
                  <FileText className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-primary truncate">{template.name}</p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">{template.subject || "No subject"}</p>

                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

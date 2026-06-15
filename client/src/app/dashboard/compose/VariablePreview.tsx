"use client";

import { useState } from "react";
import { Eye, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariablePreviewProps {
  subject: string;
  body: string;
  recipientColumnData: Record<string, Record<string, string>>;
  recipients: string[];
}

function resolveVariable(text: string, varName: string, value: string) {
  return text.replace(new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, "gi"), value);
}

export default function VariablePreview({
  subject,
  body,
  recipientColumnData,
  recipients,
}: VariablePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const email = recipients[currentIndex]?.toLowerCase() || "";
  const currentRow = recipientColumnData[email] || {};

  const resolvedSubject = Object.keys(currentRow).reduce(
    (acc, v) => resolveVariable(acc, v, currentRow[v] || `{{${v}}}`), subject
  );
  const resolvedBody = Object.keys(currentRow).reduce(
    (acc, v) => resolveVariable(acc, v, currentRow[v] || `{{${v}}}`), body
  );

  return (
    <div className="rounded-lg bg-white border border-border-light shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 md:px-5 py-3 hover:bg-[#F8F9FA] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Variable Preview
          </span>
          {recipients.length > 0 && (
            <span className="text-[10px] text-text-muted">
              ({currentIndex + 1} of {recipients.length})
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-text-muted transition-transform duration-200",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-[#F8F9FA] rounded-lg px-3 py-2">
            <button
              type="button"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="text-xs text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-text-secondary">
              Row {currentIndex + 1} of {recipients.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIndex(Math.min(recipients.length - 1, currentIndex + 1))}
              disabled={currentIndex === recipients.length - 1}
              className="text-xs text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {recipients.length === 0 && (
            <p className="text-[10px] text-text-muted italic">
              Import a CSV to see variable preview
            </p>
          )}

          {recipients.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-text-muted mb-1">Subject</p>
                <p className="text-sm text-text-primary bg-[#F8F9FA] rounded-lg px-4 py-3 border border-border-light font-medium">
                  {resolvedSubject || <span className="text-text-muted italic">No subject...</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-muted mb-1">Email Body</p>
                <div
                  className="text-sm text-text-primary bg-[#F8F9FA] rounded-lg px-4 py-3 border border-border-light max-h-64 overflow-y-auto leading-relaxed prose prose-sm max-w-none prose-p:my-1"
                  dangerouslySetInnerHTML={{
                    __html: resolvedBody || "<span class='text-text-muted italic'>No content yet...</span>",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

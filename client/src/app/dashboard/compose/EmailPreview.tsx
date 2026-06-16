"use client";

import { useState } from "react";
import { Eye, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailPreviewProps {
  subject: string;
  body: string;
  recipientColumnData: Record<string, Record<string, string>>;
  recipients: string[];
}

function resolveVariable(text: string, varName: string, value: string) {
  return text.replace(new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, "gi"), value);
}

export default function EmailPreview({
  subject,
  body,
  recipientColumnData,
  recipients,
}: EmailPreviewProps) {
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

  const toEmail = email || (recipients[currentIndex] || "");

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
            Email Preview
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
              Import a CSV or add recipients to see the email preview
            </p>
          )}

          {recipients.length > 0 && (
            <div className="border border-border-light rounded-lg overflow-hidden">
              <div className="bg-[#F8F9FA] px-4 py-3 border-b border-border-light space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted font-medium w-12 shrink-0">From:</span>
                  <span className="text-text-primary font-medium truncate">Your Sender</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted font-medium w-12 shrink-0">To:</span>
                  <span className="text-text-primary truncate">{toEmail || "recipient@example.com"}</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-text-muted font-medium w-12 shrink-0 mt-0.5">Subject:</span>
                  <span className="text-text-primary font-semibold">
                    {resolvedSubject || <span className="text-text-muted italic">No subject</span>}
                  </span>
                </div>
              </div>
              <div className="px-4 py-4">
                <div
                  className="text-sm text-text-primary leading-relaxed prose prose-sm max-w-none prose-p:my-1"
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

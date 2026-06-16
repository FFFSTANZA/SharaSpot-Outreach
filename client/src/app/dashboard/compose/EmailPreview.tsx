"use client";

import { useState, useMemo } from "react";
import { Eye, ChevronDown } from "lucide-react";
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

const SAMPLE_VALUES: Record<string, string> = {
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  company: "Acme Corp",
  email: "john@acme.com",
  phone: "+1 (555) 123-4567",
  title: "CEO",
  position: "CEO",
  role: "CEO",
};

function buildSampleRow(text: string): Record<string, string> {
  const matches = text.match(/\{\{\s*(\w+)\s*\}\}/gi);
  if (!matches) return {};
  const row: Record<string, string> = {};
  for (const match of matches) {
    const name = match.replace(/\{\{|\}\}|\s+/g, "").toLowerCase();
    if (!row[name]) row[name] = SAMPLE_VALUES[name] || `[${name}]`;
  }
  return row;
}

export default function EmailPreview({
  subject,
  body,
  recipientColumnData,
  recipients,
}: EmailPreviewProps) {
  const [expanded, setExpanded] = useState(true);

  const firstEmail = recipients[0]?.toLowerCase() || "";
  const csvRow = recipientColumnData[firstEmail] || {};

  const sampleRow = useMemo(() => {
    if (Object.keys(csvRow).length > 0) return csvRow;
    const merged = { ...buildSampleRow(subject), ...buildSampleRow(body) };
    return merged;
  }, [subject, body, csvRow]);

  const resolvedSubject = Object.keys(sampleRow).reduce(
    (acc, v) => resolveVariable(acc, v, sampleRow[v]), subject
  );

  const resolvedBody = Object.keys(sampleRow).reduce(
    (acc, v) => resolveVariable(acc, v, sampleRow[v]), body
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
            Email Preview
          </span>
          {recipients.length > 0 && (
            <span className="text-[10px] text-text-muted">({recipients.length} recipient{recipients.length > 1 ? "s" : ""})</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-text-muted transition-transform duration-200",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 animate-in fade-in duration-200">
          <div className="border border-border-light rounded-lg overflow-hidden mt-1">
            <div className="bg-[#F8F9FA] px-4 py-3 border-b border-border-light space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted font-medium w-12 shrink-0">From:</span>
                <span className="text-text-primary font-medium truncate">Your Sender</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted font-medium w-12 shrink-0">To:</span>
                <span className="text-text-primary truncate">{firstEmail || "recipient@example.com"}</span>
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
        </div>
      )}
    </div>
  );
}

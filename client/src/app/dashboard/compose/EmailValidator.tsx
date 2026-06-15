"use client";

import { useState } from "react";
import { validateEmails, BatchValidationResponse } from "@/lib/apis";
import { ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailValidatorProps {
  emails: string[];
  onRemoveEmail: (email: string) => void;
  onValidationComplete: (result: BatchValidationResponse) => void;
}

export function EmailValidator({ emails, onRemoveEmail, onValidationComplete }: EmailValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<BatchValidationResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "invalid" | "risky" | "valid">("all");

  const closeModal = () => {
    setShowModal(false);
  };

  const handleValidate = async () => {
    if (emails.length === 0) return;
    setIsValidating(true);
    setFilter("all");

    try {
      const result = await validateEmails(emails);
      setValidationResult(result);
      setShowModal(true);
      onValidationComplete(result);
    } catch {
      alert("Failed to validate emails. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const invalidEmails = validationResult?.results.filter(r => !r.valid) || [];
  const riskyEmails = validationResult?.results.filter(r => r.riskLevel === "high" || r.riskLevel === "critical") || [];

  const filteredResults = validationResult?.results.filter(r => {
    if (filter === "invalid") return !r.valid;
    if (filter === "risky") return r.riskLevel === "high" || r.riskLevel === "critical";
    if (filter === "valid") return r.valid;
    return true;
  }) || [];

  const handleRemoveInvalid = () => {
    invalidEmails.forEach(r => onRemoveEmail(r.email));
    closeModal();
  };

  return (
    <>
      <button
        onClick={handleValidate}
        disabled={isValidating || emails.length === 0}
        className={cn(
          "shrink-0 flex items-center gap-2 h-9 px-3 rounded-md border text-sm transition-all",
          emails.length === 0
            ? "border-border-light bg-[#F8F9FA] text-text-muted cursor-not-allowed"
            : isValidating
              ? "border-border-light bg-[#F8F9FA] text-text-muted"
              : "border-border-light bg-white text-text-secondary hover:bg-[#F0F1F3] hover:text-text-primary"
        )}
      >
        {isValidating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Validate</span>
        {emails.length > 0 && (
          <span className="text-xs text-text-muted">({emails.length})</span>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-2xl mx-4 rounded-lg bg-white shadow-premium-lg" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
              <div>
                <h3 className="text-lg font-bold text-text-primary tracking-tight">Email Validation</h3>
                <p className="text-xs text-text-muted font-medium">
                  {validationResult?.total} recipients analyzed - {validationResult?.processingTimeMs}ms
                </p>
              </div>
            </div>

            {validationResult && (
              <>
                {/* Summary */}
                <div className="flex items-center gap-12 px-8 py-6 border-b border-border-light bg-[#F8F9FA]">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Total</span>
                    <span className="text-2xl font-bold text-text-primary">{validationResult.total}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Valid</span>
                    <span className="text-2xl font-bold text-green-700">{validationResult.valid}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-error-text font-black uppercase tracking-widest mb-1">Invalid</span>
                    <span className="text-2xl font-bold text-error-text">{validationResult.invalid}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">Risky</span>
                    <span className="text-2xl font-bold text-amber-700">{validationResult.risky}</span>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 px-5 py-3 border-b border-border-light bg-white">
                  {[
                    { key: "all", label: "All", count: validationResult.total },
                    { key: "valid", label: "Valid", count: validationResult.valid },
                    { key: "risky", label: "Risky", count: validationResult.risky },
                    { key: "invalid", label: "Invalid", count: validationResult.invalid },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key as typeof filter)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        filter === tab.key
                          ? "bg-brand text-white"
                          : "text-text-muted hover:text-text-secondary hover:bg-[#F0F1F3]"
                      )}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Results list */}
                <div className="max-h-80 overflow-y-auto bg-white">
                  {filteredResults.length === 0 && (
                    <div className="text-center py-12 text-text-muted">
                      <p className="text-sm font-medium">No recipients found in this category</p>
                    </div>
                  )}
                  {filteredResults.map((result) => (
                    <div
                      key={result.email}
                      className="flex items-center justify-between px-6 py-4 border-b border-border-light/50 hover:bg-[#F8F9FA] transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          result.valid ? "bg-green-500" :
                            result.riskLevel === "high" || result.riskLevel === "critical" ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <span className="text-sm font-medium text-text-secondary truncate">
                          {result.email}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveEmail(result.email)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error-text transition-all rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {(invalidEmails.length > 0 || riskyEmails.length > 0) && (
                  <div className="px-6 py-5 border-t border-border-light bg-[#F8F9FA] flex gap-3">
                    {invalidEmails.length > 0 && (
                      <button
                        onClick={handleRemoveInvalid}
                        className="flex flex-1 h-11 items-center justify-center rounded-md border border-border-light bg-white px-5 text-xs font-bold text-error-text transition-all hover:bg-error-bg"
                      >
                        Remove {invalidEmails.length} invalid
                      </button>
                    )}
                    {riskyEmails.length > 0 && (
                      <button
                        onClick={() => {
                          riskyEmails.forEach(r => onRemoveEmail(r.email));
                          closeModal();
                        }}
                        className="flex flex-1 h-11 items-center justify-center rounded-md border border-border-light bg-white px-5 text-xs font-bold text-amber-700 transition-all hover:bg-amber-50"
                      >
                        Remove {riskyEmails.length} risky
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

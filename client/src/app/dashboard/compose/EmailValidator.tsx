"use client";

import { useState } from "react";
import { validateEmails, BatchValidationResponse } from "@/lib/apis";
import { ShieldCheck, ShieldAlert, Loader2, X, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

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

  const handleValidate = async () => {
    if (emails.length === 0) return;
    setIsValidating(true);

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
    setShowModal(false);
  };

  return (
    <>
      {/* Validate Button - Clean & Subtle */}
      <button
        onClick={handleValidate}
        disabled={isValidating || emails.length === 0}
        className={cn(
          "shrink-0 flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-all",
          emails.length === 0
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : isValidating
              ? "border-gray-200 bg-gray-50 text-gray-400"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        {isValidating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Validate</span>
        {emails.length > 0 && (
          <span className="text-xs text-gray-400">({emails.length})</span>
        )}
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="w-full max-w-2xl flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Email Validation</h3>
              <p className="text-xs text-gray-400 font-medium">
                {validationResult?.total} recipients analyzed — {validationResult?.processingTimeMs}ms
              </p>
            </div>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {validationResult && (
            <>
              {/* Summary - Horizontal Stats */}
              <div className="flex items-center gap-12 px-8 py-6 border-b border-gray-100 bg-gray-50/30">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{validationResult.total}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Valid</span>
                  <span className="text-2xl font-bold text-emerald-600">{validationResult.valid}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">Invalid</span>
                  <span className="text-2xl font-bold text-red-600">{validationResult.invalid}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1">Risky</span>
                  <span className="text-2xl font-bold text-amber-600">{validationResult.risky}</span>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 px-5 py-3 border-b border-gray-100 bg-white">
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
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      filter === tab.key
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Results list */}
              <div className="max-h-80 overflow-y-auto bg-white">
                {filteredResults.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm font-medium">No recipients found in this category</p>
                  </div>
                )}
                {filteredResults.map((result) => (
                  <div
                    key={result.email}
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        result.valid ? "bg-emerald-400" :
                          result.riskLevel === "high" || result.riskLevel === "critical" ? "bg-amber-400" : "bg-red-400"
                      )} />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {result.email}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveEmail(result.email)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {(invalidEmails.length > 0 || riskyEmails.length > 0) && (
                <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                  {invalidEmails.length > 0 && (
                    <Button
                      variant="secondary"
                      className="flex-1 bg-white border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-100 font-bold h-11"
                      onClick={handleRemoveInvalid}
                    >
                      Remove {invalidEmails.length} invalid
                    </Button>
                  )}
                  {riskyEmails.length > 0 && (
                    <Button
                      variant="secondary"
                      className="flex-1 bg-white border-gray-200 text-amber-600 hover:bg-amber-50 hover:border-amber-100 font-bold h-11"
                      onClick={() => {
                        riskyEmails.forEach(r => onRemoveEmail(r.email));
                        setShowModal(false);
                      }}
                    >
                      Remove {riskyEmails.length} risky
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

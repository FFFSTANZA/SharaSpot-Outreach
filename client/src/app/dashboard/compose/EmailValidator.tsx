"use client";

import { useState } from "react";
import { validateEmails, BatchValidationResponse, ValidationResult } from "@/lib/apis";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, X, AlertCircle, CheckCircle2, Trash2, ChevronDown, ChevronUp, Building2, Mail, Clock, Zap, Lightbulb, Check, AlertTriangle } from "lucide-react";
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
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "invalid" | "risky" | "valid">("all");

  const handleValidate = async () => {
    if (emails.length === 0) return;
    
    setIsValidating(true);
    
    try {
      const result = await validateEmails(emails);
      setValidationResult(result);
      setShowModal(true);
      onValidationComplete(result);
    } catch (error: any) {
      if (error?.response?.data?.upgradeRequired) {
        alert("Email validation is a premium feature. Please upgrade to use it.");
      } else {
        alert("Failed to validate emails. Please try again.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const getRiskIcon = (level: ValidationResult["riskLevel"]) => {
    switch (level) {
      case "low":
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case "medium":
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case "high":
        return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      case "critical":
        return <ShieldX className="h-4 w-4 text-red-500" />;
    }
  };

  const getRiskColor = (level: ValidationResult["riskLevel"]) => {
    switch (level) {
      case "low":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "medium":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "critical":
        return "bg-red-50 border-red-200 text-red-700";
    }
  };

  const getCheckIcon = (status: ValidationResult["checks"][0]["status"]) => {
    switch (status) {
      case "pass":
        return <Check className="h-3 w-3 text-emerald-500" />;
      case "fail":
        return <X className="h-3 w-3 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    }
  };

  const invalidEmails = validationResult?.results.filter(r => !r.valid) || [];
  const riskyEmails = validationResult?.results.filter(r => r.riskLevel === "high" || r.riskLevel === "critical") || [];
  const validEmails = validationResult?.results.filter(r => r.valid) || [];

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
      <button
        onClick={handleValidate}
        disabled={isValidating || emails.length === 0}
        className={cn(
          "shrink-0 flex items-center gap-1.5 h-7 md:h-8 px-2 md:px-3 rounded-lg border text-[9px] md:text-[10px] font-bold transition-all",
          emails.length === 0
            ? "border-gray-100 bg-gray-50/50 text-gray-400 cursor-not-allowed"
            : "border-blue-200 bg-blue-50/50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 hover:border-blue-300"
        )}
      >
        {isValidating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
        )}
        <span>Validate</span>
        {emails.length > 0 && (
          <span className="text-blue-400 ml-0.5">{emails.length}</span>
        )}
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="w-full max-w-3xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Email Health Check</h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Validated in {validationResult?.processingTimeMs}ms
                {validationResult?.deduplicated && (
                  <span className="text-amber-600">
                    ({validationResult.originalCount - validationResult.total} duplicates removed)
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {validationResult && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 md:p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <div className="text-center p-2 rounded-xl bg-white border border-gray-100">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{validationResult.total}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-white border border-emerald-100">
                  <div className="text-xl md:text-2xl font-bold text-emerald-600">{validationResult.valid}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Valid</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-white border border-red-100">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{validationResult.invalid}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Invalid</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-white border border-amber-100">
                  <div className="text-xl md:text-2xl font-bold text-amber-600">{validationResult.risky}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Risky</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 px-4 md:px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-gray-600">{validationResult.corporateEmails} Corporate</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-gray-600">{validationResult.freeEmails} Free Email</span>
                </div>
              </div>

              {validationResult.recommendations.length > 0 && (
                <div className="px-4 md:px-6 py-3 bg-amber-50 border-b border-amber-100">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Recommendations</p>
                      <ul className="space-y-0.5">
                        {validationResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-[10px] text-amber-700 flex items-start gap-1">
                            <Zap className="h-3 w-3 shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-gray-100 overflow-x-auto">
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
                      "shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      filter === tab.key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No emails match this filter</p>
                  </div>
                )}
                {filteredResults.map((result) => (
                  <div
                    key={result.email}
                    className={cn(
                      "rounded-xl border transition-all",
                      result.valid
                        ? "bg-emerald-50/30 border-emerald-100"
                        : "bg-red-50/30 border-red-100"
                    )}
                  >
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => setExpandedEmail(expandedEmail === result.email ? null : result.email)}
                    >
                      {getRiskIcon(result.riskLevel)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-xs font-medium truncate",
                            result.valid ? "text-emerald-700" : "text-red-700"
                          )}>
                            {result.email}
                          </p>
                          <span className={cn(
                            "shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                            result.isCorporateEmail 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {result.isCorporateEmail ? "Corporate" : "Free"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className={cn(
                            "h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden"
                          )}>
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                result.riskScore < 20 ? "bg-emerald-500" :
                                result.riskScore < 50 ? "bg-amber-500" :
                                result.riskScore < 80 ? "bg-orange-500" : "bg-red-500"
                              )}
                              style={{ width: `${100 - result.riskScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400">
                            {100 - result.riskScore}% healthy
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveEmail(result.email); }}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {result.issues.length > 0 && (
                        expandedEmail === result.email ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )
                      )}
                    </div>

                    {expandedEmail === result.email && (
                      <div className="px-3 pb-3 space-y-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {result.checks.map((check, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "flex items-center gap-1.5 p-1.5 rounded-lg text-[10px]",
                                check.status === "pass" ? "bg-emerald-50" :
                                check.status === "fail" ? "bg-red-50" : "bg-amber-50"
                              )}
                            >
                              {getCheckIcon(check.status)}
                              <span className={cn(
                                "truncate",
                                check.status === "pass" ? "text-emerald-700" :
                                check.status === "fail" ? "text-red-700" : "text-amber-700"
                              )}>
                                {check.name}: {check.status === "pass" ? "OK" : check.status === "fail" ? "Fail" : "Warn"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {result.issues.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Issues Found</p>
                            {result.issues.map((issue, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-start gap-2 p-2 rounded-lg text-xs",
                                  issue.severity === "error" ? "bg-red-100/50" :
                                  issue.severity === "warning" ? "bg-amber-100/50" : "bg-blue-100/50"
                                )}
                              >
                                {issue.severity === "error" ? (
                                  <X className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                ) : issue.severity === "warning" ? (
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className={cn(
                                    "font-medium",
                                    issue.severity === "error" ? "text-red-700" :
                                    issue.severity === "warning" ? "text-amber-700" : "text-blue-700"
                                  )}>
                                    {issue.message}
                                  </p>
                                  {issue.suggestion && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">{issue.suggestion}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {invalidEmails.length > 0 && (
                <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleRemoveInvalid}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove {invalidEmails.length} Invalid Email{invalidEmails.length > 1 ? "s" : ""}
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      riskyEmails.forEach(r => onRemoveEmail(r.email));
                      setShowModal(false);
                    }}
                  >
                    <ShieldX className="h-4 w-4 mr-2" />
                    Also Remove {riskyEmails.length} Risky
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

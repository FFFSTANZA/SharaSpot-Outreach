import api from "../axios";

export interface ValidationIssue { type: "syntax" | "mx_record" | "disposable" | "role_based" | "typo" | "subdomain" | "free_email" | "catch_all" | "suspicious_tld" | "missing_name"; severity: "warning" | "error" | "info"; message: string; suggestion?: string; }
export interface ValidationCheck { name: string; status: "pass" | "fail" | "warning"; message: string; }
export interface ValidationResult { email: string; valid: boolean; issues: ValidationIssue[]; riskScore: number; riskLevel: "low" | "medium" | "high" | "critical"; checks: ValidationCheck[]; isFreeEmail: boolean; isCorporateEmail: boolean; isCatchAll: boolean; }
export interface BatchValidationResponse { message: string; total: number; valid: number; invalid: number; risky: number; freeEmails: number; corporateEmails: number; results: ValidationResult[]; summary: { criticalCount: number; highCount: number; mediumCount: number; lowCount: number; syntaxErrors: number; mxErrors: number; disposableEmails: number; typosFound: number; }; recommendations: string[]; processingTimeMs: number; deduplicated: boolean; originalCount: number; }

export const validateEmails = async (emails: string[]): Promise<BatchValidationResponse> => {
  const res = await api.post("/api/validation/validate-emails", { emails });
  return res.data;
};

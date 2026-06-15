"use client";

import React, { useState, useRef } from "react";
import {
    X,
    Upload,
    FileText,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Mail,
    User,
    Building2,
    Briefcase,
    Globe,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { importContacts } from "@/lib/apis";

type ImportRowError = { error: string };

const getErrorMessage = (error: unknown, fallback: string) => {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object" &&
        (error as { response?: { data?: { message?: unknown } } }).response?.data &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
    ) {
        return (error as { response?: { data?: { message: string } } }).response!.data!.message;
    }

    if (error instanceof Error && error.message) return error.message;
    return fallback;
};

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SYSTEM_FIELDS = [
    { key: "email", label: "Email", icon: Mail, required: false },
    { key: "website", label: "Website", icon: Globe, required: false },
    { key: "companyDomain", label: "Company Domain", icon: Globe, required: false },
    { key: "firstName", label: "First Name", icon: User, required: false },
    { key: "lastName", label: "Last Name", icon: User, required: false },
    { key: "company", label: "Company", icon: Building2, required: false },
    { key: "jobTitle", label: "Job Title", icon: Briefcase, required: false },
];

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
    const [step, setStep] = useState<"upload" | "mapping" | "processing">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        count: number;
        errors?: ImportRowError[];
        qualitySummary?: {
            duplicateContacts: number;
            invalidEmails: number;
            missingRequiredFields: number;
        };
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".xlsx")) {
            setError("Please upload a CSV or Excel file.");
            return;
        }

        setFile(selectedFile);
        setIsUploading(true);
        setError(null);

        try {
            // Send file to server to get headers
            const res = await importContacts(selectedFile, {});
            const importedHeaders = Array.isArray(res.headers) ? res.headers : [];
            if (importedHeaders.length > 0) {
                setHeaders(importedHeaders);

                // Auto-match headers
                const initialMapping: Record<string, string> = {};
                importedHeaders.forEach((header) => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes("email")) initialMapping.email = header;
                    else if (lowerHeader.includes("website") || lowerHeader === "url") initialMapping.website = header;
                    else if (lowerHeader.includes("domain")) initialMapping.companyDomain = header;
                    else if (lowerHeader.includes("first") && lowerHeader.includes("name")) initialMapping.firstName = header;
                    else if (lowerHeader.includes("last") && lowerHeader.includes("name")) initialMapping.lastName = header;
                    else if (lowerHeader.includes("company") || lowerHeader.includes("organization")) initialMapping.company = header;
                    else if (lowerHeader.includes("job") || lowerHeader.includes("title") || lowerHeader.includes("role")) initialMapping.jobTitle = header;
                });
                setMapping(initialMapping);
                setStep("mapping");
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to parse file."));
        } finally {
            setIsUploading(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        if (!mapping.email && !mapping.website && !mapping.companyDomain) {
            setError("Map at least Email, Website, or Company Domain.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setStep("processing");

        try {
            const res = await importContacts(file, mapping);
            if (typeof res.count !== "number") {
                throw new Error("Import response did not include a processed contact count.");
            }
            setResult({
                count: res.count,
                errors: Array.isArray(res.errors) ? (res.errors as ImportRowError[]) : undefined,
                qualitySummary: res.qualitySummary,
            });
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Import failed."));
            setStep("mapping");
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setHeaders([]);
        setMapping({});
        setStep("upload");
        setError(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-text-primary/10 backdrop-blur-sm p-4">
            <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-premium-lg">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-light bg-white px-6 py-5">
                    <div>
                        <h2 className="text-xl font-semibold text-text-primary">Import contacts</h2>
                        <p className="text-sm text-text-muted">Bring in records from CSV or Excel and clean them up in your PRM.</p>
                    </div>
                    <button
                        onClick={() => { reset(); onClose(); }}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === "upload" && (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                                     isUploading ? "border-brand/30 bg-brand/5" : "border-border-light hover:border-brand/30 hover:bg-brand/5"
                                )}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".csv,.xlsx"
                                />

                                {isUploading ? (
                                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand" />
                                ) : (
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-brand/10">
                                        <Upload className="h-8 w-8 text-brand" />
                                    </div>
                                )}

                                <p className="text-lg font-semibold text-text-primary mb-1">
                                    {isUploading ? "Processing file..." : "Choose a file to import"}
                                </p>
                                <p className="text-sm text-text-muted text-center">
                                    Drag and drop your file here, or click to browse.<br />
                                    Supports CSV and Excel format.
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-error-bg rounded-lg flex items-start gap-3 text-error-text">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="rounded-lg bg-white p-4 ring-1 ring-border-light">
                                <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Guidelines</h4>
                                <div className="space-y-2 text-sm text-text-secondary">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-brand" />
                                        <span>First row must contain headers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-brand" />
                                        <span>Email is preferred, but Website or Company Domain can be used to discover it</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-brand" />
                                        <span>Duplicates will be updated based on email</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "mapping" && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 rounded-lg border border-brand/10 bg-brand/5 p-4">
                                <FileText className="h-6 w-6 text-brand" />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-text-primary">{file?.name}</p>
                                    <p className="text-xs text-text-muted">{headers.length} columns found</p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="p-2 text-xs font-medium uppercase text-brand hover:text-brand/80"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium uppercase tracking-widest text-text-muted">Map columns</h3>
                                <div className="overflow-hidden rounded-lg border border-border-light bg-white divide-y divide-border-light">
                                    {SYSTEM_FIELDS.map((field) => {
                                        const Icon = field.icon;
                                        return (
                                            <div key={field.key} className="p-4 flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8F9FA]">
                                                    <Icon className="h-5 w-5 text-text-muted" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <label className="block text-sm font-medium text-text-primary">
                                                        {field.label}
                                                        {field.required && <span className="text-error-text ml-1">*</span>}
                                                    </label>
                                                    <p className="text-xs text-text-muted">PRM field</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-text-muted" />
                                                <select
                                                    className={cn(
                                                        "flex-1 min-w-[140px] h-10 appearance-none rounded-lg border border-border-light bg-[#F8F9FA] px-3 text-sm outline-none transition-all cursor-pointer focus:border-brand/30",
                                                        mapping[field.key] ? "text-text-primary font-medium" : "text-text-muted"
                                                    )}
                                                    value={mapping[field.key] || ""}
                                                    onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                >
                                                    <option value="">Select column...</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-error-bg rounded-lg flex items-start gap-3 text-error-text">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === "processing" && (
                        <div className="flex flex-col items-center justify-center py-12">
                            {result ? (
                                <div className="text-center space-y-4">
                                    <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
                                        <CheckCircle2 className="h-10 w-10 text-brand" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-text-primary">Import complete</h3>
                                    <p className="text-text-muted">
                                        <span className="font-bold text-text-primary">{result.count}</span> contacts have been successfully imported/updated.
                                    </p>
                                     {result.qualitySummary && (
                                         <div className="grid gap-3 text-left sm:grid-cols-3">
                                              <div className="rounded-lg bg-white p-4 ring-1 ring-border-light">
                                                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Duplicates</p>
                                                  <p className="mt-1 text-2xl font-bold text-text-primary">{result.qualitySummary.duplicateContacts}</p>
                                              </div>
                                              <div className="rounded-lg bg-white p-4 ring-1 ring-border-light">
                                                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Invalid Emails</p>
                                                  <p className="mt-1 text-2xl font-bold text-text-primary">{result.qualitySummary.invalidEmails}</p>
                                              </div>
                                              <div className="rounded-lg bg-white p-4 ring-1 ring-border-light">
                                                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Missing Names</p>
                                                  <p className="mt-1 text-2xl font-bold text-text-primary">{result.qualitySummary.missingRequiredFields}</p>
                                              </div>
                                         </div>
                                     )}
                                      {result.errors && result.errors.length > 0 && (
                                          <div className="mt-4 p-4 bg-brand/5 rounded-lg text-left max-h-40 overflow-y-auto">
                                              <p className="text-xs font-bold text-brand uppercase mb-2">{result.errors.length} rows skipped</p>
                                              <ul className="text-xs text-text-secondary space-y-1">
                                                {result.errors.slice(0, 10).map((err, i) => (
                                                    <li key={i}>• Row {i + 2}: {err.error}</li>
                                                ))}
                                                {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                                            </ul>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { onSuccess(); onClose(); reset(); }}
                                        className="mt-6 h-12 w-full rounded-lg bg-brand text-white transition-all hover:bg-brand/90"
                                    >
                                        View Contacts
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="relative">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
                                            <Loader2 className="h-10 w-10 animate-spin text-brand" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-lg shadow-md border border-border-light">
                                            <FileText className="h-5 w-5 text-text-muted" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-text-primary">Importing contacts</h3>
                                    <p className="text-text-muted">This may take a moment depending on the file size.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === "mapping" && (
                    <div className="sticky bottom-0 flex gap-3 border-t border-border-light bg-white px-6 py-6">
                        <button
                            onClick={() => setStep("upload")}
                            className="h-12 flex-1 rounded-lg border border-border-light text-text-secondary transition-all hover:bg-[#F0F1F3]"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isUploading || (!mapping.email && !mapping.website && !mapping.companyDomain)}
                            className="flex flex-[2] h-12 items-center justify-center gap-2 rounded-lg bg-brand text-white transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Import"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

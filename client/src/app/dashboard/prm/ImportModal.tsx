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
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { importContacts } from "@/lib/apis";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SYSTEM_FIELDS = [
    { key: "email", label: "Email", icon: Mail, required: true },
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
    const [result, setResult] = useState<{ count: number; errors?: any[] } | null>(null);
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
            if ((res as any).headers) {
                setHeaders((res as any).headers);

                // Auto-match headers
                const initialMapping: Record<string, string> = {};
                (res as any).headers.forEach((header: string) => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes("email")) initialMapping.email = header;
                    else if (lowerHeader.includes("first") && lowerHeader.includes("name")) initialMapping.firstName = header;
                    else if (lowerHeader.includes("last") && lowerHeader.includes("name")) initialMapping.lastName = header;
                    else if (lowerHeader.includes("company") || lowerHeader.includes("organization")) initialMapping.company = header;
                    else if (lowerHeader.includes("job") || lowerHeader.includes("title") || lowerHeader.includes("role")) initialMapping.jobTitle = header;
                });
                setMapping(initialMapping);
                setStep("mapping");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to parse file.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        if (!mapping.email) {
            setError("Email mapping is required.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setStep("processing");

        try {
            const res = await importContacts(file, mapping);
            setResult(res);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Import failed.");
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Import Contacts</h2>
                        <p className="text-sm text-gray-500">Add contacts from CSV or Excel</p>
                    </div>
                    <button
                        onClick={() => { reset(); onClose(); }}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
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
                                    "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                                    isUploading ? "border-amber-400 bg-amber-50/30" : "border-gray-200 hover:border-amber-400 hover:bg-amber-50/30"
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
                                    <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
                                ) : (
                                    <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Upload className="h-8 w-8 text-amber-600" />
                                    </div>
                                )}

                                <p className="text-lg font-semibold text-gray-900 mb-1">
                                    {isUploading ? "Processing file..." : "Choose a file to import"}
                                </p>
                                <p className="text-sm text-gray-500 text-center">
                                    Drag and drop your file here, or click to browse.<br />
                                    Supports CSV and Excel format.
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 text-red-700">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-2xl p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Guidelines</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>First row must contain headers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>Email address is required for each contact</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>Duplicates will be updated based on email</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "mapping" && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <FileText className="h-6 w-6 text-amber-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-amber-900 truncate">{file?.name}</p>
                                    <p className="text-xs text-amber-700">{headers.length} columns found</p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase p-2"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Map Columns</h3>
                                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden divide-y divide-gray-50">
                                    {SYSTEM_FIELDS.map((field) => {
                                        const Icon = field.icon;
                                        return (
                                            <div key={field.key} className="p-4 flex items-center gap-4">
                                                <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                                    <Icon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <label className="block text-sm font-semibold text-gray-900">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    <p className="text-xs text-gray-500">System field</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-300" />
                                                <select
                                                    className={cn(
                                                        "flex-1 min-w-[140px] h-10 px-3 text-sm bg-gray-50 rounded-xl border border-transparent outline-none focus:border-amber-400 transition-all appearance-none cursor-pointer",
                                                        mapping[field.key] ? "text-gray-900 font-medium" : "text-gray-400"
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
                                <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 text-red-700">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === "processing" && (
                        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
                            {result ? (
                                <div className="text-center space-y-4">
                                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">Import Complete!</h3>
                                    <p className="text-gray-500">
                                        <span className="font-bold text-gray-900">{result.count}</span> contacts have been successfully imported/updated.
                                    </p>
                                    {result.errors && result.errors.length > 0 && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-left max-h-40 overflow-y-auto">
                                            <p className="text-xs font-bold text-amber-700 uppercase mb-2">{result.errors.length} rows skipped</p>
                                            <ul className="text-xs text-amber-600 space-y-1">
                                                {result.errors.slice(0, 10).map((err, i) => (
                                                    <li key={i}>• Row {i + 2}: {err.error}</li>
                                                ))}
                                                {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                                            </ul>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { onSuccess(); onClose(); reset(); }}
                                        className="mt-6 w-full h-12 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                                    >
                                        View Contacts
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="relative">
                                        <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                            <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-md border border-gray-100">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Importing Contacts...</h3>
                                    <p className="text-gray-500 animate-pulse">This may take a moment depending on the file size.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === "mapping" && (
                    <div className="px-6 py-6 border-t border-gray-50 bg-white sticky bottom-0 flex gap-3">
                        <button
                            onClick={() => setStep("upload")}
                            className="flex-1 h-12 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isUploading || !mapping.email}
                            className="flex-[2] h-12 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Import"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

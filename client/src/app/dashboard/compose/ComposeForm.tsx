"use client";

import { useEffect, useRef, useState } from "react";
import { ComposeFormData, ComposeFormProps, SenderResponse } from "@/types";
import { getSenders, BatchValidationResponse } from "@/lib/apis";
import { SenderModal } from "./SenderModal";
import { Editor } from "./Editor";
import { X, CheckCircle2, AlertCircle, Plus, AlertTriangle, ChevronDown, Copy, Trash2, Send, Loader2, Settings2, Zap, Shield, MoreHorizontal, FileText, Eye, MousePointer2, ArrowLeft, CheckSquare, Square } from "lucide-react";
import TemplateSelector from "./TemplateSelector";
import type { EmailTemplate, SequenceStepInput } from "@/types";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import VariablePreview from "./VariablePreview";
import SequenceBuilder from "./SequenceBuilder";
import { EmailValidator } from "./EmailValidator";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { getSubscription } from "@/lib/apis";

interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export function ComposeForm({
  scheduledAt,
  setScheduledAt,
  uploadedAttachments,
  onFilesSelected,
  onRemoveAttachment,
  isUploading,
  onSubmit,
  submitTrigger,
  isSubmitting,
  initialEmails
}: ComposeFormProps & {
  setScheduledAt: (date: Date | null) => void;
  onFilesSelected: (files: File[]) => void;
  onRemoveAttachment: (url: string) => void;
  isUploading: boolean;
  isSubmitting?: boolean;
  initialEmails?: string[];
}) {
  const { addToast } = useToast();
  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isSenderLoading, setIsSenderLoading] = useState(true);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);
  const [isSenderDropdownOpen, setIsSenderDropdownOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([
    { id: "default", name: "Default", content: "", isDefault: true },
  ]);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const senderDropdownRef = useRef<HTMLDivElement>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ComposeFormData>({
    from: "", selectedSenderIds: [], to: initialEmails || [], cc: [], bcc: [], subject: "", body: "",
    delayBetweenEmails: 30, hourlyLimit: 50, selectedRecipients: new Set(),
    attachments: [],
    scheduleDate: null,
  });

  useEffect(() => {
    if (initialEmails && initialEmails.length > 0) {
      setData(prev => ({
        ...prev,
        to: Array.from(new Set([...prev.to, ...initialEmails]))
      }));
    }
  }, [initialEmails]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [priorityEnabled, setPriorityEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<EmailTemplate | null>(null);
  const [recipientColumnData, setRecipientColumnData] = useState<Record<string, Record<string, string>>>({});
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStepInput[]>([]);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(signatures[0]);
  const [,] = useState<BatchValidationResponse | null>(null);

  const selectedSenders = senders.filter(s => data.selectedSenderIds.includes(s.id));
  const selectedSender = selectedSenders[0] || null;

  useEffect(() => {
    const saved = localStorage.getItem("email_signatures");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSignatures(parsed);
        const defaultSig = parsed.find((s: Signature) => s.isDefault) || parsed[0];
        setSelectedSignature(defaultSig);
      } catch { }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (senderDropdownRef.current && !senderDropdownRef.current.contains(e.target as Node)) {
        setIsSenderDropdownOpen(false);
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setIsBulkMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await getSenders();
        setSenders(list);
        const firstVerified = list.find(s => s.isVerified);
        if (firstVerified) {
          setData(prev => ({ ...prev, from: firstVerified.email, selectedSenderIds: [firstVerified.id] }));
        } else if (list.length > 0) {
          setData(prev => ({ ...prev, from: list[0].email, selectedSenderIds: [list[0].id] }));
        }
        try {
          const sub = await getSubscription();
          setIsPremium(sub.isPremium);
        } catch { }
      } catch { } finally { setIsSenderLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!submitTrigger) return;
    handleFormSubmit();
  }, [submitTrigger]);

  const toggleSender = (senderId: string) => {
    setData(prev => {
      const isSelected = prev.selectedSenderIds.includes(senderId);
      const newIds = isSelected
        ? prev.selectedSenderIds.filter(id => id !== senderId)
        : [...prev.selectedSenderIds, senderId];
      const firstSender = senders.find(s => newIds.includes(s.id));
      return { ...prev, selectedSenderIds: newIds, from: firstSender?.email || "" };
    });
    setErrors(p => ({ ...p, from: "" }));
  };

  const removeSelectedRecipients = () => {
    setData(prev => ({
      ...prev,
      to: prev.to.filter(e => !prev.selectedRecipients.has(e)),
      selectedRecipients: new Set(),
    }));
    setIsBulkMenuOpen(false);
    addToast("success", "Selected recipients removed");
  };

  const exportSelectedToCsv = () => {
    const selectedEmails = data.to.filter(e => data.selectedRecipients.has(e));
    const csvContent = selectedEmails.map(email => {
      const colData = recipientColumnData[email.toLowerCase()];
      if (colData && Object.keys(colData).length > 0) {
        const values = [email, ...Object.values(colData)];
        return values.join(",");
      }
      return email;
    }).join("\n");

    const headers = recipientColumnData[data.to[0]?.toLowerCase()]
      ? `email,${Object.keys(recipientColumnData[data.to[0]?.toLowerCase()]).join(",")}`
      : "email";

    const blob = new Blob([headers + "\n" + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-recipients.csv";
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", `${selectedEmails.length} recipients exported`);
    setIsBulkMenuOpen(false);
  };

  const copyAllEmails = () => {
    const emails = data.to.join(", ");
    navigator.clipboard.writeText(emails);
    addToast("success", `${data.to.length} emails copied`);
    setIsBulkMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length === 0) return;
      const firstLine = lines[0].toLowerCase();
      const isCsv = firstLine.includes(",") || file.name.endsWith(".csv");
      let newEmails: string[] = [];
      let newColumnData: Record<string, Record<string, string>> = { ...recipientColumnData };
      if (isCsv) {
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const emailIdx = headers.indexOf("email");
        if (emailIdx === -1) {
          setCsvError("CSV must have an 'email' column");
          return;
        }
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",").map(r => r.trim());
          const email = row[emailIdx];
          if (email && email.includes("@")) {
            newEmails.push(email);
            const data: Record<string, string> = {};
            headers.forEach((h, idx) => { if (idx !== emailIdx) data[h] = row[idx] || ""; });
            newColumnData[email.toLowerCase()] = data;
          }
        }
      } else {
        newEmails = lines.map(l => l.trim()).filter(l => l.includes("@"));
      }
      if (newEmails.length > 0) {
        setData(prev => ({ ...prev, to: Array.from(new Set([...prev.to, ...newEmails])) }));
        setRecipientColumnData(newColumnData);
        setCsvMessage(`Imported ${newEmails.length} recipients`);
        setCsvError(null);
        addToast("success", `Imported ${newEmails.length} recipients`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFormSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!data.from) newErrors.from = "Select a sender";
    if (data.to.length === 0) newErrors.to = "Add recipients";
    if (!data.subject.trim()) newErrors.subject = "Subject required";
    if (!data.body.trim()) newErrors.body = "Body required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast("warning", "Please fill required fields");
      return;
    }
    setErrors({});
    const finalBody = selectedSignature ? `${data.body}<br><br>${selectedSignature.content}` : data.body;
    onSubmit({
      ...data,
      body: finalBody,
      sequenceSteps,
      trackOpens,
      trackClicks,
      scheduledAt: scheduledAt || null,
    });
  };

  const toggleRecipientSelection = (email: string) => {
    setData(prev => {
      const next = new Set(prev.selectedRecipients);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return { ...prev, selectedRecipients: next };
    });
  };

  const toggleSelectAll = () => {
    setData(prev => {
      if (prev.selectedRecipients.size === prev.to.length) return { ...prev, selectedRecipients: new Set() };
      return { ...prev, selectedRecipients: new Set(prev.to) };
    });
  };

  const removeRecipient = (email: string) => {
    setData(prev => ({
      ...prev,
      to: prev.to.filter(e => e !== email),
      selectedRecipients: (() => {
        const next = new Set(prev.selectedRecipients);
        next.delete(email);
        return next;
      })(),
    }));
  };

  return (
    <div className="mx-auto max-w-[1280px] p-3 md:p-6 space-y-6">
      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-3 font-bold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{submitError}</p>
          <button onClick={() => setSubmitError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Campaign config */}
        <div className="lg:col-span-4 space-y-6">
          {/* Senders section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <Shield className="h-4 w-4 text-brand" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Sender Accounts</h3>
              </div>
              <button
                onClick={() => setIsSenderModalOpen(true)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand hover:bg-brand-light transition-all"
                title="Add Sender"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative" ref={senderDropdownRef}>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Sender</label>
                <button
                  type="button"
                  onClick={() => setIsSenderDropdownOpen(!isSenderDropdownOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 h-11 rounded-xl border transition-all text-sm",
                    errors.from ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200",
                    isSenderDropdownOpen && "border-brand/30 ring-4 ring-brand/5 bg-white"
                  )}
                >
                  {isSenderLoading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading senders...</span>
                    </div>
                  ) : selectedSender ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-brand flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white">{selectedSender.name[0].toUpperCase()}</span>
                      </div>
                      <span className="font-semibold text-gray-700 truncate">{selectedSender.email}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Select a sender</span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isSenderDropdownOpen && "rotate-180")} />
                </button>

                {isSenderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden py-1">
                    {senders.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-gray-400">No senders found</p>
                        <button onClick={() => setIsSenderModalOpen(true)} className="mt-2 text-xs text-brand font-bold hover:underline">Add your first sender</button>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {senders.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { toggleSender(s.id); setIsSenderDropdownOpen(false); }}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                              data.selectedSenderIds.includes(s.id) ? "bg-brand-light/50" : "hover:bg-gray-50"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{s.email}</p>
                              <p className="text-[10px] text-gray-400">{s.name} · {s.dailyLimit} daily</p>
                            </div>
                            {data.selectedSenderIds.includes(s.id) && <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-sender rotation status */}
              {data.selectedSenderIds.length > 1 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-light/30 border border-brand/10">
                  <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center shrink-0 shadow-sm">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-brand uppercase tracking-wider">Multi-Account Rotation</p>
                    <p className="text-[10px] text-brand/70 font-medium">Outreach will be distributed across {data.selectedSenderIds.length} accounts</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipients section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <Users className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">Recipients</h3>
                  <p className="text-[10px] text-gray-400 font-medium">{data.to.length} total</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => csvInputRef.current?.click()}
                  className="h-8 px-3 flex items-center gap-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Import
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 shrink-0 bg-gray-50/30">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter email addresses..."
                    className={cn(
                      "w-full h-10 pl-9 pr-4 rounded-xl border text-sm transition-all bg-white font-medium",
                      errors.to ? "border-red-200 focus:border-red-300 focus:ring-4 ring-red-50" : "border-gray-200 focus:border-brand/40 focus:ring-4 ring-brand/5"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim().replace(",", "");
                        if (val && val.includes("@")) {
                          setData(prev => ({ ...prev, to: Array.from(new Set([...prev.to, val])) }));
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {data.to.length > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                    {data.selectedRecipients.size === data.to.length ? <CheckSquare className="h-3.5 w-3.5 text-brand" /> : <Square className="h-3.5 w-3.5" />}
                    {data.selectedRecipients.size === data.to.length ? "Deselect All" : "Select All"}
                  </button>

                  <div className="relative" ref={bulkMenuRef}>
                    <button
                      onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                      disabled={data.selectedRecipients.size === 0}
                      className="flex items-center gap-1.5 text-brand hover:text-brand-hover font-bold disabled:opacity-30 transition-colors"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                      <span>Actions ({data.selectedRecipients.size})</span>
                    </button>

                    {isBulkMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1 overflow-hidden">
                        <button onClick={copyAllEmails} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <Copy className="h-4 w-4 text-gray-400" /> Copy selected
                        </button>
                        <button onClick={exportSelectedToCsv} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <FileText className="h-4 w-4 text-gray-400" /> Export to CSV
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={removeSelectedRecipients} className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                          <Trash2 className="h-4 w-4 text-red-500" /> Remove selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {data.to.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Users className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">No recipients added</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Import a CSV or enter emails manually to start your outreach.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.to.map((email, i) => (
                    <div
                      key={email}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3 transition-colors",
                        data.selectedRecipients.has(email) ? "bg-brand-light/20" : "hover:bg-gray-50"
                      )}
                    >
                      <button onClick={() => toggleRecipientSelection(email)} className="shrink-0">
                        {data.selectedRecipients.has(email) ? <CheckSquare className="h-4 w-4 text-brand" /> : <Square className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{email}</p>
                        {recipientColumnData[email.toLowerCase()] && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                            {Object.values(recipientColumnData[email.toLowerCase()]).filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button onClick={() => removeRecipient(email)} className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delivery settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Settings2 className="h-4 w-4 text-gray-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Delivery Pace</h3>
              </div>
            </div>
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Delay between emails</label>
                    <span className="text-xs font-bold text-brand">{data.delayBetweenEmails} seconds</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={data.delayBetweenEmails}
                    onChange={(e) => setData({ ...data, delayBetweenEmails: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Adds human-like variance to every send</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hourly limit per sender</label>
                    <span className="text-xs font-bold text-brand">{data.hourlyLimit} emails/hr</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={data.hourlyLimit}
                    onChange={(e) => setData({ ...data, hourlyLimit: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Stops immediately if provider limits are detected</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setTrackOpens(!trackOpens)}
                    className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                      trackOpens ? "bg-brand border-brand text-white" : "bg-white border-gray-200 group-hover:border-brand/40"
                    )}
                  >
                    {trackOpens && <CheckSquare className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-gray-700">Track email opens</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setTrackClicks(!trackClicks)}
                    className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                      trackClicks ? "bg-brand border-brand text-white" : "bg-white border-gray-200 group-hover:border-brand/40"
                    )}
                  >
                    {trackClicks && <CheckSquare className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-gray-700">Track link clicks</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Content editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <Send className="h-4 w-4 text-brand" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Campaign Content</h3>
              </div>
              <div className="flex items-center gap-2">
                <TemplateSelector onSelect={(template) => setPendingTemplate(template)} />
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-4 space-y-4 shrink-0 bg-gray-50/30">
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Subject Line"
                      value={data.subject}
                      onChange={(e) => { setData({ ...data, subject: e.target.value }); setErrors(p => ({ ...p, subject: "" })); }}
                      className={cn(
                        "w-full h-11 px-4 rounded-xl border text-base font-bold transition-all bg-white",
                        errors.subject ? "border-red-200 focus:border-red-300 focus:ring-4 ring-red-50" : "border-gray-200 focus:border-brand/40 focus:ring-4 ring-brand/5"
                      )}
                    />
                    {errors.subject && <p className="text-[10px] text-red-500 mt-1.5 font-bold uppercase tracking-wider">{errors.subject}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCc(!showCc)}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all", showCc ? "bg-brand text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                    >
                      Cc
                    </button>
                    <button
                      onClick={() => setShowBcc(!showBcc)}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all", showBcc ? "bg-brand text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                    >
                      Bcc
                    </button>
                    <div className="h-4 w-px bg-gray-200 mx-1" />
                    <VariablePreview body={data.body} columnData={Object.values(recipientColumnData)[0] || {}} />
                  </div>

                  {showCc && (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cc emails..."
                          className="w-full h-10 pl-4 pr-4 rounded-xl border border-gray-200 text-sm bg-white focus:border-brand/40 focus:ring-4 ring-brand/5 outline-none transition-all font-medium"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim().replace(",", "");
                              if (val && val.includes("@")) {
                                setData(prev => ({ ...prev, cc: Array.from(new Set([...prev.cc, val])) }));
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.cc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-gray-100 text-[11px] font-bold text-gray-600">
                            {email}
                            <button onClick={() => setData({ ...data, cc: data.cc.filter(e => e !== email) })}><X className="h-3 w-3 hover:text-red-500" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {showBcc && (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Bcc emails..."
                          className="w-full h-10 pl-4 pr-4 rounded-xl border border-gray-200 text-sm bg-white focus:border-brand/40 focus:ring-4 ring-brand/5 outline-none transition-all font-medium"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim().replace(",", "");
                              if (val && val.includes("@")) {
                                setData(prev => ({ ...prev, bcc: Array.from(new Set([...prev.bcc, val])) }));
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.bcc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-gray-100 text-[11px] font-bold text-gray-600">
                            {email}
                            <button onClick={() => setData({ ...data, bcc: data.bcc.filter(e => e !== email) })}><X className="h-3 w-3 hover:text-red-500" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-[400px] relative overflow-hidden flex flex-col">
                <Editor
                  content={data.body}
                  onChange={(val) => { setData({ ...data, body: val }); setErrors(p => ({ ...p, body: "" })); }}
                  placeholder="Start writing your professional outreach email here..."
                  error={errors.body}
                />
              </div>

              <div className="shrink-0 p-5 bg-gray-50/50 border-t border-gray-50 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-brand/30 hover:text-brand transition-all shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {selectedSignature ? `Signature: ${selectedSignature.name}` : "Add Signature"}
                    </button>
                    {selectedSignature && (
                      <button
                        onClick={() => setSelectedSignature(null)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Remove signature"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up sequences */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">Automated Follow-ups</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pause automatically when someone replies</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <SequenceBuilder
                steps={sequenceSteps}
                onChange={setSequenceSteps}
              />
            </div>
          </div>
        </div>
      </div>

      <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />

      {/* Signature Modal */}
      <Modal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} title="Manage Signatures">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Signatures</h2>
            <Button
              size="sm"
              onClick={() => { setEditingSignature({ id: Math.random().toString(36).substr(2, 9), name: "", content: "", isDefault: false }); }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Signature
            </Button>
          </div>

          <div className="space-y-3">
            {signatures.map(sig => (
              <div
                key={sig.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                  selectedSignature?.id === sig.id ? "border-brand bg-brand-light/20 ring-4 ring-brand/5" : "border-gray-100 hover:border-gray-200"
                )}
                onClick={() => setSelectedSignature(sig)}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{sig.name}</p>
                    {sig.isDefault && <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Default</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate opacity-60 font-medium" dangerouslySetInnerHTML={{ __html: sig.content }} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingSignature(sig); }}
                    className="p-2 text-gray-400 hover:text-brand hover:bg-brand-light rounded-lg transition-all"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                  {signatures.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = signatures.filter(s => s.id !== sig.id);
                        setSignatures(next);
                        localStorage.setItem("email_signatures", JSON.stringify(next));
                        if (selectedSignature?.id === sig.id) setSelectedSignature(next[0]);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button onClick={() => setIsSignatureModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Signature Modal */}
      {editingSignature && (
        <Modal isOpen={true} onClose={() => setEditingSignature(null)} title="Edit Signature">
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Signature Name</label>
              <input
                type="text"
                value={editingSignature.name}
                onChange={(e) => setEditingSignature({ ...editingSignature, name: e.target.value })}
                placeholder="e.g. Sales, Professional, Simple"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-brand/40 focus:ring-4 ring-brand/5 outline-none transition-all text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Content (HTML supported)</label>
              <textarea
                value={editingSignature.content}
                onChange={(e) => setEditingSignature({ ...editingSignature, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand/40 focus:ring-4 ring-brand/5 outline-none transition-all text-sm font-bold"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setEditingSignature({ ...editingSignature, isDefault: !editingSignature.isDefault })}
                className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                  editingSignature.isDefault ? "bg-brand border-brand text-white" : "bg-white border-gray-200 group-hover:border-brand/40"
                )}
              >
                {editingSignature.isDefault && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
              <span className="text-xs font-bold text-gray-700">Set as default signature</span>
            </label>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingSignature(null)}
                className="flex-1 h-11 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const exists = signatures.find(s => s.id === editingSignature.id);
                  let next;
                  if (exists) next = signatures.map(s => s.id === editingSignature.id ? editingSignature : s);
                  else next = [...signatures, editingSignature];
                  if (editingSignature.isDefault) next = next.map(s => s.id === editingSignature.id ? s : { ...s, isDefault: false });
                  setSignatures(next);
                  localStorage.setItem("email_signatures", JSON.stringify(next));
                  setEditingSignature(null);
                }}
                disabled={!editingSignature.name || !editingSignature.content}
                className="flex-1 h-11 bg-brand text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-40 transition-all"
              >
                Save Signature
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sender Modal */}
      <SenderModal
        isOpen={isSenderModalOpen}
        onClose={() => setIsSenderModalOpen(false)}
        onSuccess={async () => {
          const list = await getSenders();
          setSenders(list);
          setIsSenderModalOpen(false);
          addToast("success", "Sender added successfully");
        }}
      />

      {/* Template Confirmation Modal */}
      {pendingTemplate && (
        <Modal isOpen={true} onClose={() => setPendingTemplate(null)} title="Apply Template?">
          <div className="space-y-6">
            <div className="h-16 w-16 rounded-3xl bg-brand-light flex items-center justify-center mx-auto border border-brand/10">
              <Zap className="h-8 w-8 text-brand" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">Apply Template?</h2>
              <p className="text-sm text-gray-500 mt-2 px-6 font-medium">This will replace your current subject and body. This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingTemplate(null)}
                className="flex-1 h-12 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Keep Current
              </button>
              <button
                onClick={() => {
                  setData({ ...data, subject: pendingTemplate.subject, body: pendingTemplate.body });
                  setPendingTemplate(null);
                  addToast("success", `Template applied: ${pendingTemplate.name}`);
                }}
                className="flex-1 h-12 bg-brand text-white rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                Apply Template
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

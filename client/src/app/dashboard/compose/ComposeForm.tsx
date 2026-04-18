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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvMessage(null); setCsvError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const lines = (reader.result as string).split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { setCsvError("CSV needs header + data"); addToast("error", "Invalid CSV"); return; }

        const headers = lines[0].split(",").map(h => h.trim());
        const emails: string[] = [];
        const colData: Record<string, Record<string, string>> = {};

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim());
          const email = cols[0];
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
          emails.push(email);
          const row: Record<string, string> = {};
          for (let j = 1; j < headers.length; j++) {
            if (headers[j] && cols[j] !== undefined) row[headers[j]] = cols[j];
          }
          colData[email.toLowerCase()] = row;
        }

        if (!emails.length) { setCsvError("No valid emails"); addToast("error", "No valid emails in CSV"); return; }
        setData(prev => ({ ...prev, to: Array.from(new Set([...prev.to, ...emails])) }));
        setRecipientColumnData(prev => ({ ...prev, ...colData }));
        setCsvMessage(`${emails.length} imported`);
        addToast("success", `${emails.length} contacts imported`);
        setTimeout(() => setCsvMessage(null), 3000);
      } catch { setCsvError("Invalid CSV format"); addToast("error", "Invalid CSV"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const applyTemplate = (template: EmailTemplate) => {
    setData(prev => ({ ...prev, subject: template.subject, body: template.body }));
    setPendingTemplate(null);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    const isDirty = data.subject.trim() !== "" || (data.body.trim() !== "" && data.body !== "<p></p>");
    if (isDirty) setPendingTemplate(template);
    else applyTemplate(template);
  };

  const handleSaveSignature = (sig: Signature) => {
    const updated = signatures.map(s => s.id === sig.id ? sig : s);
    setSignatures(updated);
    localStorage.setItem("email_signatures", JSON.stringify(updated));
    if (sig.isDefault) setSelectedSignature(sig);
    setEditingSignature(null);
    addToast("success", "Signature saved");
  };

  const handleFormSubmit = async () => {
    const e: Record<string, string> = {};
    if (!data.selectedSenderIds.length) e.from = "Select a sender";
    const hasUnverified = selectedSenders.some(s => !s.isVerified);
    if (hasUnverified) e.from = "Sender not verified";
    if (!data.to.length) e.to = "Add at least one recipient";
    if (!data.subject.trim()) e.subject = "Add a subject";
    setErrors(e);
    if (Object.keys(e).length) {
      addToast("warning", "Please fill required fields");
      return;
    }
    try {
      setSubmitError(null);
      await onSubmit({
        senderIds: data.selectedSenderIds,
        subject: data.subject,
        body: data.body + (selectedSignature?.content ? `<p>${selectedSignature.content}</p>` : ""),
        startTime: scheduledAt?.toISOString() || new Date().toISOString(),
        delaySeconds: data.delayBetweenEmails,
        hourlyLimit: data.hourlyLimit,
        emails: data.to.map(email => {
          const colData = recipientColumnData[email.toLowerCase()];
          return colData && Object.keys(colData).length > 0 ? { email, columnData: colData } : email;
        }),
        ccEmails: data.cc.length > 0 ? data.cc : undefined,
        bccEmails: data.bcc.length > 0 ? data.bcc : undefined,
        attachments: uploadedAttachments.length ? uploadedAttachments : undefined,
        steps: sequenceSteps.length > 0 ? sequenceSteps : undefined,
        trackOpens,
        trackClicks,
        isPriority: priorityEnabled,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create campaign";
      setSubmitError(message);
    }
  };

  const handleSenderUpdated = (s: SenderResponse) => {
    setSenders(prev => prev.find(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]);
    if (s.isVerified) {
      setData(prev => ({
        ...prev,
        selectedSenderIds: prev.selectedSenderIds.includes(s.id) ? prev.selectedSenderIds : [...prev.selectedSenderIds, s.id],
        from: prev.from || s.email,
      }));
    }
  };

  return (
    <>
      <div className="h-full bg-gray-50/50 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 min-h-full">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => window.history.back()}
                  className="group h-12 w-12 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-white rounded-2xl transition-all shadow-sm border border-gray-100 hover:border-gray-200"
                  title="Go back"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Compose</h1>
                  <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.2em]">Create your outreach campaign</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  className="px-8 h-12 font-black rounded-2xl shadow-lg shadow-brand/20 uppercase tracking-widest text-xs"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {scheduledAt ? "Schedule" : "Send Campaign"}
                </Button>
              </div>
            </div>

            {submitError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-[11px] text-red-600 flex items-center gap-3 font-black uppercase tracking-tight animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Compose Area */}
              <div className="lg:col-span-8 space-y-6">
                {/* Email Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
                  {/* From */}
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 shrink-0">From</span>
                    <div className="relative flex-1 min-w-0" ref={senderDropdownRef}>
                      <button
                        type="button"
                        className="w-full text-left flex items-center justify-between py-1 text-sm text-gray-900 font-bold"
                        onClick={() => !isSenderLoading && setIsSenderDropdownOpen(prev => !prev)}
                        disabled={isSenderLoading}
                      >
                        <span className="truncate pr-2">
                          {isSenderLoading
                            ? "Loading..."
                            : data.selectedSenderIds.length === 0
                              ? "Select sender"
                              : data.selectedSenderIds.length === 1
                                ? selectedSender?.email || ""
                                : `${data.selectedSenderIds.length} senders`}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-gray-300 shrink-0 transition-transform", isSenderDropdownOpen && "rotate-180 text-brand")} />
                      </button>

                      {isSenderDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="py-2 max-h-64 overflow-y-auto">
                            {senders.map(s => (
                              <label key={s.id} className={cn(
                                "flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                                data.selectedSenderIds.includes(s.id) && "bg-brand-light/20"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={data.selectedSenderIds.includes(s.id)}
                                  onChange={() => toggleSender(s.id)}
                                  className="h-4 w-4 rounded-lg border-gray-300 text-brand focus:ring-brand/20"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate font-bold tracking-tight">{s.email}</p>
                                  {s.name && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.name}</p>}
                                </div>
                                {s.isVerified ? (
                                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIsSenderModalOpen(true)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:text-brand hover:bg-brand-light hover:border-brand/20 transition-all shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* To */}
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 shrink-0">To</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 min-h-[32px] cursor-text" onClick={() => inputRef.current?.focus()}>
                        {data.to.map(email => (
                          <span
                            key={email}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(data.selectedRecipients);
                              if (newSelected.has(email)) newSelected.delete(email);
                              else newSelected.add(email);
                              setData({ ...data, selectedRecipients: newSelected });
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl text-[10px] font-black px-3 py-1.5 cursor-pointer transition-all uppercase tracking-tight",
                              data.selectedRecipients.has(email)
                                ? "bg-brand text-white shadow-lg shadow-brand/20"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button
                              type="button"
                              className={cn("ml-1 hover:scale-125 transition-transform", data.selectedRecipients.has(email) ? "text-white/70" : "text-gray-400")}
                              onClick={(e) => {
                                e.stopPropagation();
                                setData({ ...data, to: data.to.filter(e => e !== email) });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          ref={inputRef}
                          placeholder={data.to.length === 0 ? "recipient@example.com" : ""}
                          className="flex-1 min-w-[150px] text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400 font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              const v = (e.target as HTMLInputElement).value.trim().replace(/,/g, "");
                              if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                                if (!data.to.includes(v)) setData({ ...data, to: [...data.to, v] });
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                            if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && data.to.length)
                              setData({ ...data, to: data.to.slice(0, -1) });
                          }}
                        />
                      </div>
                      {errors.to && <p className="text-[10px] text-red-500 mt-2 font-black uppercase tracking-widest">{errors.to}</p>}
                      {csvMessage && <p className="text-[10px] text-brand mt-2 font-black uppercase tracking-widest">{csvMessage}</p>}
                      {csvError && <p className="text-[10px] text-red-500 mt-2 font-black uppercase tracking-widest">{csvError}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {data.to.length > 0 && (
                        <EmailValidator
                          emails={data.to}
                          onRemoveEmail={(email) => setData(prev => ({ ...prev, to: prev.to.filter(e => e !== email) }))}
                          onValidationComplete={() => { }}
                        />
                      )}
                      <button
                        onClick={() => setShowCc(!showCc)}
                        className={cn("text-[10px] font-black h-10 px-3 rounded-xl transition-all uppercase tracking-widest", showCc ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-400 hover:bg-gray-50")}
                      >
                        CC
                      </button>
                      <button
                        onClick={() => setShowBcc(!showBcc)}
                        className={cn("text-[10px] font-black h-10 px-3 rounded-xl transition-all uppercase tracking-widest", showBcc ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-400 hover:bg-gray-50")}
                      >
                        BCC
                      </button>
                    </div>
                  </div>

                  {/* CC */}
                  {showCc && (
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 shrink-0">Cc</span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-2 items-center">
                        {data.cc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1.5 rounded-xl text-[10px] font-black bg-white border border-gray-100 text-gray-700 px-3 py-1.5 uppercase tracking-tight shadow-sm">
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button type="button" className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setData({ ...data, cc: data.cc.filter(e => e !== email) })}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BCC */}
                  {showBcc && (
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 shrink-0">Bcc</span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-2 items-center">
                        {data.bcc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1.5 rounded-xl text-[10px] font-black bg-white border border-gray-100 text-gray-700 px-3 py-1.5 uppercase tracking-tight shadow-sm">
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button type="button" className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setData({ ...data, bcc: data.bcc.filter(e => e !== email) })}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 shrink-0">Subject</span>
                    <input
                      type="text"
                      placeholder="Enter campaign subject line..."
                      value={data.subject}
                      onChange={(e) => { setData({ ...data, subject: e.target.value }); setErrors(p => ({ ...p, subject: "" })); }}
                      className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-300 font-bold tracking-tight"
                    />
                  </div>

                  {/* Body */}
                  <div className="min-h-[400px]">
                    <Editor value={data.body} onChange={(html) => setData({ ...data, body: html })} />
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                      <button
                        onClick={() => csvInputRef.current?.click()}
                        className="h-11 px-5 rounded-2xl border border-gray-100 bg-white text-gray-700 text-[10px] font-black uppercase tracking-widest hover:border-brand/20 hover:text-brand flex items-center gap-2.5 transition-all shadow-sm"
                      >
                        <FileText className="h-4 w-4 text-gray-400" />
                        Import CSV
                      </button>

                      {/* Bulk actions dropdown */}
                      <div className="relative" ref={bulkMenuRef}>
                        <button
                          onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                          className={cn(
                            "h-11 px-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-sm",
                            data.selectedRecipients.size > 0
                              ? "border-brand bg-brand text-white shadow-lg shadow-brand/20"
                              : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          {data.selectedRecipients.size > 0 ? `${data.selectedRecipients.size} selected` : "Bulk Actions"}
                          <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 transition-transform", isBulkMenuOpen && "rotate-180")} />
                        </button>
                        {isBulkMenuOpen && (
                          <div className="absolute bottom-full left-0 mb-3 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 min-w-[240px] z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-50 mb-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selection Tools</p>
                            </div>
                            <button
                              onClick={() => {
                                setData(prev => ({ ...prev, selectedRecipients: new Set(prev.to) }));
                                setIsBulkMenuOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <CheckSquare className="h-4 w-4 text-gray-400" /> Select all ({data.to.length})
                            </button>
                            <button
                              onClick={() => {
                                setData(prev => ({ ...prev, selectedRecipients: new Set() }));
                                setIsBulkMenuOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Square className="h-4 w-4 text-gray-400" /> Deselect all
                            </button>

                            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-50 my-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Actions</p>
                            </div>
                            <button
                              onClick={copyAllEmails}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Copy className="h-4 w-4 text-gray-400" /> Copy all emails
                            </button>
                            <button
                              onClick={exportSelectedToCsv}
                              disabled={data.selectedRecipients.size === 0}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <FileText className="h-4 w-4 text-gray-400" /> Export selected
                            </button>
                            <div className="border-t border-gray-50 my-1" />
                            <button
                              onClick={removeSelectedRecipients}
                              disabled={data.selectedRecipients.size === 0}
                              className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" /> Remove selected
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => window.history.back()}
                      className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                      title="Discard draft"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Sequence Builder */}
                <SequenceBuilder steps={sequenceSteps} onChange={setSequenceSteps} />
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Settings Toggle */}
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm text-xs font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all"
                >
                  <span className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-brand" />
                    Campaign Settings
                  </span>
                  <ChevronDown className={cn("h-5 w-5 text-gray-300 transition-transform duration-300", isSettingsOpen && "rotate-180 text-brand")} />
                </button>

                {isSettingsOpen && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    {/* Sending Rate */}
                    <div className="p-6 border-b border-gray-50">
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Sending Strategy</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Minimum Delay</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={data.delayBetweenEmails}
                              onChange={(e) => setData({ ...data, delayBetweenEmails: Number(e.target.value) })}
                              className="w-full bg-white px-4 py-2.5 text-sm border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-black text-gray-900"
                              min={5}
                              max={300}
                            />
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">sec / email</span>
                          </div>
                        </div>
                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Hourly Limit</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={data.hourlyLimit}
                              onChange={(e) => setData({ ...data, hourlyLimit: Number(e.target.value) })}
                              className="w-full bg-white px-4 py-2.5 text-sm border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-black text-gray-900"
                              min={1}
                              max={500}
                            />
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">emails / hr</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tracking */}
                    <div className="p-6 border-b border-gray-50">
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center">
                          <Eye className="h-4 w-4 text-brand" />
                        </div>
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Analytics Tracking</p>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/50 cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:border-brand/20 transition-all">
                              <Eye className="h-4 w-4 text-gray-400 group-hover:text-brand" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 tracking-tight">Track Opens</p>
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Delivery Insights</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackOpens}
                            onChange={(e) => setTrackOpens(e.target.checked)}
                            className="h-5 w-5 rounded-lg border-gray-300 text-brand focus:ring-brand/20 transition-all"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/50 cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:border-brand/20 transition-all">
                              <MousePointer2 className="h-4 w-4 text-gray-400 group-hover:text-brand" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 tracking-tight">Track Clicks</p>
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Interaction Data</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackClicks}
                            onChange={(e) => setTrackClicks(e.target.checked)}
                            className="h-5 w-5 rounded-lg border-gray-300 text-brand focus:ring-brand/20 transition-all"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Premium Features */}
                    <div className="p-6 border-b border-gray-50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Priority Features</p>
                      <div className="space-y-3">
                        <label className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all border border-transparent group",
                          isPremium
                            ? "hover:bg-gray-50/50 cursor-pointer hover:border-gray-100"
                            : "opacity-60 bg-gray-50/30"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center transition-all shadow-sm border border-transparent",
                              isPremium ? "bg-white border-amber-100" : "bg-gray-100"
                            )}>
                              <Zap className={cn("h-4 w-4", isPremium ? "text-amber-500" : "text-gray-400")} />
                            </div>
                            <div>
                              <p className={cn("text-sm font-bold tracking-tight", isPremium ? "text-gray-900" : "text-gray-500")}>Priority Sending</p>
                              <p className="text-[10px] text-brand font-black uppercase tracking-widest mt-0.5">Full Access Included</p>
                            </div>
                          </div>
                          {isPremium ? (
                            <input
                              type="checkbox"
                              checked={priorityEnabled}
                              onChange={(e) => setPriorityEnabled(e.target.checked)}
                              className="h-5 w-5 rounded-lg border-gray-300 text-brand focus:ring-brand/20 transition-all"
                            />
                          ) : (
                            <Shield className="h-4 w-4 text-gray-300" />
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Signature</p>
                        <button
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="text-[10px] text-brand hover:underline font-black uppercase tracking-widest"
                        >
                          Manage
                        </button>
                      </div>
                      <select
                        value={selectedSignature?.id || ""}
                        onChange={(e) => {
                          const sig = signatures.find(s => s.id === e.target.value);
                          if (sig) setSelectedSignature(sig);
                        }}
                        className="w-full px-4 py-3 text-xs border border-gray-100 bg-gray-50/50 rounded-xl focus:outline-none focus:border-brand transition-all font-bold text-gray-900 uppercase tracking-tight"
                      >
                        <option value="">No signature</option>
                        {signatures.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {selectedSignature?.content && (
                        <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl text-[11px] text-gray-500 border border-gray-100 font-medium leading-relaxed italic">
                          <div dangerouslySetInnerHTML={{ __html: selectedSignature.content }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Templates */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] relative z-30 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Templates</p>
                    <span className="text-[9px] text-brand font-black uppercase tracking-widest bg-brand-light px-2 py-1 rounded-lg">Select to Apply</span>
                  </div>
                  <div className="p-6">
                    <TemplateSelector onSelect={handleTemplateSelect} />
                  </div>
                </div>

                <VariablePreview
                  subject={data.subject}
                  body={data.body}
                  recipientColumnData={recipientColumnData}
                  recipients={data.to}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals outside main layout */}
      {selectedSender && (
        <SenderModal
          isOpen={isSenderModalOpen}
          onClose={() => setIsSenderModalOpen(false)}
          onSuccess={handleSenderUpdated}
          existingSender={!selectedSender.isVerified ? selectedSender : null}
        />
      )}

      {/* Template confirmation */}
      {pendingTemplate && (
        <Modal isOpen onClose={() => setPendingTemplate(null)}>
          <div className="p-8 text-center">
            <div className="h-16 w-16 bg-brand-light rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand/10">
              <FileText className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Overwrite content?</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              Applying this template will replace your current subject and body content.
            </p>
            <div className="flex gap-4">
              <Button variant="secondary" className="flex-1 h-12 font-black rounded-2xl uppercase tracking-widest text-xs" onClick={() => setPendingTemplate(null)}>Cancel</Button>
              <Button className="flex-1 h-12 font-black rounded-2xl shadow-lg shadow-brand/20 uppercase tracking-widest text-xs" onClick={() => applyTemplate(pendingTemplate!)}>Apply Template</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Signature Modal */}
      <Modal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)}>
        <div className="p-0 max-w-lg w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Email Signatures</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Manage your professional sign-offs</p>
            </div>
            <button
              onClick={() => setIsSignatureModalOpen(false)}
              className="h-10 w-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8">
            {editingSignature ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Signature Name</label>
                  <input
                    type="text"
                    value={editingSignature.name}
                    onChange={(e) => setEditingSignature({ ...editingSignature!, name: e.target.value })}
                    placeholder="e.g. CEO Professional, Support Informal"
                    className="w-full px-5 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Signature Content</label>
                  <textarea
                    value={editingSignature.content}
                    onChange={(e) => setEditingSignature({ ...editingSignature!, content: e.target.value })}
                    placeholder="Best regards,&#10;John Doe"
                    rows={6}
                    className="w-full px-5 py-4 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-medium resize-none leading-relaxed text-gray-700"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" className="flex-1 h-12 font-black rounded-2xl uppercase tracking-widest text-xs" onClick={() => setEditingSignature(null)}>Cancel</Button>
                  <Button variant="primary" className="flex-1 h-12 font-black rounded-2xl shadow-lg shadow-brand/20 uppercase tracking-widest text-xs" onClick={() => handleSaveSignature(editingSignature!)}>Save Signature</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 gap-4">
                  {signatures.map(sig => (
                    <div
                      key={sig.id}
                      className={cn(
                        "group flex items-start justify-between p-5 rounded-3xl border transition-all cursor-default",
                        sig.isDefault ? "bg-brand-light/30 border-brand shadow-md" : "bg-white border-gray-100 hover:border-brand/20 hover:bg-gray-50/30"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-black text-gray-900 truncate tracking-tight">{sig.name}</p>
                          {sig.isDefault && (
                            <span className="px-2.5 py-1 rounded-lg bg-brand text-white text-[9px] font-black uppercase tracking-widest shadow-sm">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 italic font-medium leading-relaxed">{sig.content || "No content"}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingSignature({ ...sig, content: sig.content || "" })}
                          className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand hover:bg-white shadow-sm border border-transparent hover:border-brand/10 transition-all"
                        >
                          Edit
                        </button>
                        {!sig.isDefault && (
                          <button
                            onClick={() => {
                              const updated = signatures.map(s => ({ ...s, isDefault: s.id === sig.id }));
                              setSignatures(updated);
                              localStorage.setItem("email_signatures", JSON.stringify(updated));
                              addToast("info", "Default signature updated");
                            }}
                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand hover:bg-white shadow-sm border border-transparent hover:border-brand/10 transition-all"
                          >
                            Use as Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {signatures.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-sm text-gray-300 font-black uppercase tracking-widest">No signatures created</p>
                    </div>
                  )}
                </div>

                <button
                  className="w-full h-14 border-2 border-dashed border-gray-200 hover:border-brand hover:bg-brand-light/20 font-black uppercase tracking-widest transition-all text-gray-400 hover:text-brand rounded-2xl flex items-center justify-center gap-3 text-xs"
                  onClick={() => setEditingSignature({ id: Date.now().toString(), name: "", content: "", isDefault: false })}
                >
                  <Plus className="h-5 w-5" />
                  Create New Signature
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ComposeFormData, ComposeFormProps, SenderResponse } from "@/types";
import { getSenders, BatchValidationResponse } from "@/lib/apis";
import { SenderModal } from "./SenderModal";
import { Editor } from "./Editor";
import { X, CheckCircle2, AlertCircle, Plus, AlertTriangle, ChevronDown, Copy, Trash2, Send, Loader2, Settings2, Zap, MoreHorizontal, FileText, Eye, MousePointer2, ArrowLeft, CheckSquare, Square } from "lucide-react";
import TemplateSelector from "./TemplateSelector";
import type { EmailTemplate, SequenceStepInput } from "@/types";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import VariablePreview from "./VariablePreview";
import SequenceBuilder from "./SequenceBuilder";
import { EmailValidator } from "./EmailValidator";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

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
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 min-h-full">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="group p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                  title="Go back"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-none">Compose Campaign</h1>
                  <p className="text-xs text-gray-500 mt-1">Create and schedule your email outreach</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  className="px-6 gap-2 h-10 font-bold"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {scheduledAt ? "Schedule" : "Send"}
                </Button>
              </div>
            </div>

            {submitError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="font-medium">{submitError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Compose Area */}
              <div className="lg:col-span-8 space-y-4">
                {/* Email Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* From */}
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-16 shrink-0">From</span>
                    <div className="relative flex-1 min-w-0" ref={senderDropdownRef}>
                      <button
                        type="button"
                        className="w-full text-left flex items-center justify-between py-1 text-sm text-gray-900"
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
                        <ChevronDown className={cn("h-4 w-4 text-gray-400 shrink-0 transition-transform", isSenderDropdownOpen && "rotate-180")} />
                      </button>

                      {isSenderDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="py-1 max-h-64 overflow-y-auto">
                            {senders.map(s => (
                              <label key={s.id} className={cn(
                                "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50",
                                data.selectedSenderIds.includes(s.id) && "bg-blue-50/50"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={data.selectedSenderIds.includes(s.id)}
                                  onChange={() => toggleSender(s.id)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">{s.email}</p>
                                  {s.name && <p className="text-xs text-gray-400 truncate">{s.name}</p>}
                                </div>
                                {s.isVerified ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
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
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* To */}
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-16 shrink-0">To</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 min-h-[28px] cursor-text" onClick={() => inputRef.current?.focus()}>
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
                              "inline-flex items-center gap-1 rounded-md text-xs font-medium px-2 py-1 cursor-pointer transition-colors",
                              data.selectedRecipients.has(email)
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button
                              type="button"
                              className={cn("ml-0.5 hover:scale-110 transition-transform", data.selectedRecipients.has(email) ? "text-blue-100" : "text-gray-400")}
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
                          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
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
                      {errors.to && <p className="text-xs text-red-500 mt-1">{errors.to}</p>}
                      {csvMessage && <p className="text-xs text-green-600 mt-1">{csvMessage}</p>}
                      {csvError && <p className="text-xs text-red-500 mt-1">{csvError}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {data.to.length > 0 && (
                        <EmailValidator
                          emails={data.to}
                          onRemoveEmail={(email) => setData(prev => ({ ...prev, to: prev.to.filter(e => e !== email) }))}
                          onValidationComplete={() => { }}
                        />
                      )}
                      <button
                        onClick={() => setShowCc(!showCc)}
                        className={cn("text-xs font-bold h-8 px-2 rounded-lg transition-colors", showCc ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
                      >
                        CC
                      </button>
                      <button
                        onClick={() => setShowBcc(!showBcc)}
                        className={cn("text-xs font-bold h-8 px-2 rounded-lg transition-colors", showBcc ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50")}
                      >
                        BCC
                      </button>
                    </div>
                  </div>

                  {/* CC */}
                  {showCc && (
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Cc</span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 items-center">
                        {data.cc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1">
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setData({ ...data, cc: data.cc.filter(e => e !== email) })}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BCC */}
                  {showBcc && (
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Bcc</span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 items-center">
                        {data.bcc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1">
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setData({ ...data, bcc: data.bcc.filter(e => e !== email) })}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Subject</span>
                    <input
                      type="text"
                      placeholder="Add a subject"
                      value={data.subject}
                      onChange={(e) => { setData({ ...data, subject: e.target.value }); setErrors(p => ({ ...p, subject: "" })); }}
                      className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* Body */}
                  <div className="min-h-[350px]">
                    <Editor value={data.body} onChange={(html) => setData({ ...data, body: html })} />
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                      <button
                        onClick={() => csvInputRef.current?.click()}
                        className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-gray-400" />
                        Import CSV
                      </button>

                      {/* Bulk actions dropdown */}
                      <div className="relative" ref={bulkMenuRef}>
                        <button
                          onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                          className={cn(
                            "h-10 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all",
                            data.selectedRecipients.size > 0
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          {data.selectedRecipients.size > 0 ? `${data.selectedRecipients.size} selected` : "Bulk Actions"}
                          <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", isBulkMenuOpen && "rotate-180")} />
                        </button>
                        {isBulkMenuOpen && (
                          <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-sm py-2 min-w-[200px] z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                            <div className="px-3 py-1.5 border-b border-gray-50 mb-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selection</p>
                            </div>
                            <button
                              onClick={() => {
                                setData(prev => ({ ...prev, selectedRecipients: new Set(prev.to) }));
                                setIsBulkMenuOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <CheckSquare className="h-4 w-4 text-gray-400" /> Select all ({data.to.length})
                            </button>
                            <button
                              onClick={() => {
                                setData(prev => ({ ...prev, selectedRecipients: new Set() }));
                                setIsBulkMenuOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Square className="h-4 w-4 text-gray-400" /> Deselect all
                            </button>

                            <div className="px-3 py-1.5 border-b border-gray-50 my-1 mt-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</p>
                            </div>
                            <button
                              onClick={copyAllEmails}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Copy className="h-4 w-4 text-gray-400" /> Copy all emails
                            </button>
                            <button
                              onClick={exportSelectedToCsv}
                              disabled={data.selectedRecipients.size === 0}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FileText className="h-4 w-4 text-gray-400" /> Export selected
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={removeSelectedRecipients}
                              disabled={data.selectedRecipients.size === 0}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" /> Remove selected
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => window.history.back()}
                      className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Discard draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Sequence Builder */}
                <SequenceBuilder steps={sequenceSteps} onChange={setSequenceSteps} />
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-4">
                {/* Settings Toggle */}
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-gray-400" />
                    Settings
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isSettingsOpen && "rotate-180")} />
                </button>

                {isSettingsOpen && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Sending Rate */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sending Strategy</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <label className="text-xs font-bold text-gray-600 mb-1.5 block">Minimum Delay</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={data.delayBetweenEmails}
                              onChange={(e) => setData({ ...data, delayBetweenEmails: Number(e.target.value) })}
                              className="w-full bg-white px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                              min={5}
                              max={300}
                            />
                            <span className="text-xs text-gray-400 font-bold whitespace-nowrap">sec / email</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <label className="text-xs font-bold text-gray-600 mb-1.5 block">Hourly Limit</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={data.hourlyLimit}
                              onChange={(e) => setData({ ...data, hourlyLimit: Number(e.target.value) })}
                              className="w-full bg-white px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                              min={1}
                              max={500}
                            />
                            <span className="text-xs text-gray-400 font-bold whitespace-nowrap">emails / hr</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tracking */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Engagement Tracking</p>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[#00A63E]/50 flex items-center justify-center">
                              <Eye className="h-4 w-4 text-[#00A63E]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">Track Opens</p>
                              <p className="text-[10px] text-gray-400">Know when recipients open</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackOpens}
                            onChange={(e) => setTrackOpens(e.target.checked)}
                            className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500/20 transition-all"
                          />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <MousePointer2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">Track Clicks</p>
                              <p className="text-[10px] text-gray-400">Monitor link interactions</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={trackClicks}
                            onChange={(e) => setTrackClicks(e.target.checked)}
                            className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500/20 transition-all"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Sending Options */}
                    <div className="px-4 py-3.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Priority</p>
                      <div className="space-y-2">

                        {/* Priority Email Sending */}
                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#00A63E]/10">
                              <Zap className="h-4 w-4 text-[#00A63E]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">Priority Sending</p>
                              <p className="text-[10px] text-gray-400">Skip the queue</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={priorityEnabled}
                            onChange={(e) => setPriorityEnabled(e.target.checked)}
                            className="h-5 w-5 rounded-md border-gray-300 text-[#00A63E] focus:ring-[#00A63E]/20 transition-all"
                          />
                        </label>

                        <div className="p-3 bg-brand-light/30 rounded-xl border border-brand-light border-dashed">
                          <p className="text-[10px] font-bold text-[#00A63E] uppercase tracking-wider mb-2">Priority Rules</p>
                          <ul className="space-y-1.5">
                            {[
                              "Limit: 50 priority emails / day",
                              "Gap: 30s minimum between sends",
                              "Gmail rate: 100/hr, Others: 300/hr",
                              "Requires 20+ normal emails warmup"
                            ].map((text, i) => (
                              <li key={i} className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                <div className="h-1 w-1 rounded-full bg-[#00A63E]" />
                                {text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="px-4 py-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signature</p>
                        <button
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="text-xs text-blue-600 hover:underline"
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
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No signature</option>
                        {signatures.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {selectedSignature?.content && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
                          <div dangerouslySetInnerHTML={{ __html: selectedSignature.content }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Templates */}
                <div className="bg-white rounded-xl border border-gray-200 relative z-30">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Templates</p>
                    <span className="text-[10px] text-gray-300 font-bold">Select to Apply</span>
                  </div>
                  <div className="p-4">
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
          <div className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Use this template?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will replace your current subject and body.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPendingTemplate(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => applyTemplate(pendingTemplate!)}>Apply</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Signature Modal */}
      <Modal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)}>
        <div className="p-0 max-w-lg w-full overflow-hidden rounded-xl bg-white border border-gray-200">
          <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Email Signatures</h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Manage your professional sign-offs</p>
            </div>
            <button
              onClick={() => setIsSignatureModalOpen(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6">
            {editingSignature ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Signature Name</label>
                  <input
                    type="text"
                    value={editingSignature.name}
                    onChange={(e) => setEditingSignature({ ...editingSignature!, name: e.target.value })}
                    placeholder="e.g. Professional, Informal, Sales"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Content (HTML supported)</label>
                  <textarea
                    value={editingSignature.content}
                    onChange={(e) => setEditingSignature({ ...editingSignature!, content: e.target.value })}
                    placeholder="Best regards,&#10;John Doe"
                    rows={6}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none leading-relaxed"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1 h-11 font-bold" onClick={() => setEditingSignature(null)}>Cancel</Button>
                  <Button variant="primary" className="flex-1 h-11 font-bold" onClick={() => handleSaveSignature(editingSignature!)}>Save Signature</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-1 gap-3">
                  {signatures.map(sig => (
                    <div
                      key={sig.id}
                      className={cn(
                        "group flex items-start justify-between p-4 rounded-2xl border transition-all cursor-default",
                        sig.isDefault ? "bg-blue-50/30 border-blue-100 shadow-sm" : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 truncate">{sig.name}</p>
                          {sig.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-tighter">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1 italic">{sig.content || "No content"}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingSignature({ ...sig, content: sig.content || "" })}
                          className="h-8 px-3 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
                            className="h-8 px-3 rounded-lg text-xs font-bold text-gray-500 hover:text-[#00A63E] hover:bg-[#00A63E]/50 transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {signatures.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                      <p className="text-sm text-gray-400 font-medium">No signatures created yet</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  className="w-full h-12 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 font-bold transition-all text-gray-500 hover:text-blue-600 rounded-2xl"
                  onClick={() => setEditingSignature({ id: Date.now().toString(), name: "", content: "", isDefault: false })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Brand New Signature
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

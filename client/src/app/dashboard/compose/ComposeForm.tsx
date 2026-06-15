"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { ComposeFormProps, SenderResponse } from "@/types";
import { getSenders } from "@/lib/apis";
import { SenderModal } from "./SenderModal";
import { Editor } from "./Editor";
import { X, AlertCircle, FileText, Trash2 } from "lucide-react";
import TemplateSelector from "./TemplateSelector";
import type { EmailTemplate } from "@/types";
import VariablePreview from "./VariablePreview";
import SequenceBuilder from "./SequenceBuilder";
import { getFollowUpTemplateById } from "@/lib/followUpTemplates";
import type { FollowUpTemplate } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EmailValidator } from "./EmailValidator";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { SenderField } from "./SenderField";
import { BulkActionsDropdown } from "./BulkActionsDropdown";
import { ComposeSettings } from "./ComposeSettings";
import { ScheduleModal } from "./ScheduleModal";
import { SignatureModal } from "./SignatureModal";
import Papa from "papaparse";
import { useComposeStore } from "@/stores/composeStore";

export interface ComposeFormHandle {
  openSchedule: () => void;
  submit: () => void;
}

export const ComposeForm = forwardRef<ComposeFormHandle, ComposeFormProps & {
  setScheduledAt: (date: Date | null) => void;
  onFilesSelected: (files: File[]) => void;
  onRemoveAttachment: (url: string) => void;
  isUploading: boolean;
  isSubmitting?: boolean;
  initialEmails?: string[];
  followUpTemplateId?: string | null;
}>(({
  scheduledAt,
  setScheduledAt,
  uploadedAttachments,
  onSubmit,
  isSubmitting,
  initialEmails,
  followUpTemplateId,
}, ref) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { addToast } = useToast();

  const data = useComposeStore((s) => s.data);
  const patchData = useComposeStore((s) => s.patchData);
  const updateData = useComposeStore((s) => s.updateData);
  const signatures = useComposeStore((s) => s.signatures);
  const selectedSignatureId = useComposeStore((s) => s.selectedSignatureId);
  const editingSignature = useComposeStore((s) => s.editingSignature);
  const trackOpens = useComposeStore((s) => s.trackOpens);
  const trackClicks = useComposeStore((s) => s.trackClicks);
  const priorityEnabled = useComposeStore((s) => s.priorityEnabled);
  const errors = useComposeStore((s) => s.errors);
  const submitError = useComposeStore((s) => s.submitError);
  const csvMessage = useComposeStore((s) => s.csvMessage);
  const csvError = useComposeStore((s) => s.csvError);
  const recipientColumnData = useComposeStore((s) => s.recipientColumnData);
  const sequenceSteps = useComposeStore((s) => s.sequenceSteps);
  const sequenceSchedule = useComposeStore((s) => s.sequenceSchedule);
  const frequencyCaps = useComposeStore((s) => s.frequencyCaps);
  const setSignatures = useComposeStore((s) => s.setSignatures);
  const setEditingSignature = useComposeStore((s) => s.setEditingSignature);
  const setSelectedSignatureId = useComposeStore((s) => s.setSelectedSignatureId);
  const setTrackOpens = useComposeStore((s) => s.setTrackOpens);
  const setTrackClicks = useComposeStore((s) => s.setTrackClicks);
  const setPriorityEnabled = useComposeStore((s) => s.setPriorityEnabled);
  const setErrors = useComposeStore((s) => s.setErrors);
  const updateErrors = useComposeStore((s) => s.updateErrors);
  const setSubmitError = useComposeStore((s) => s.setSubmitError);
  const setCsvMessage = useComposeStore((s) => s.setCsvMessage);
  const setCsvError = useComposeStore((s) => s.setCsvError);
  const setRecipientColumnData = useComposeStore((s) => s.setRecipientColumnData);
  const setSequenceSteps = useComposeStore((s) => s.setSequenceSteps);
  const setSequenceSchedule = useComposeStore((s) => s.setSequenceSchedule);
  const setFrequencyCaps = useComposeStore((s) => s.setFrequencyCaps);
  const resetStore = useComposeStore((s) => s.reset);

  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [isSenderLoading, setIsSenderLoading] = useState(true);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);
  const [isSenderDropdownOpen, setIsSenderDropdownOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const senderDropdownRef = useRef<HTMLDivElement>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [tempDate, setTempDate] = useState("");
  const [tempTime, setTempTime] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [showReplyTo, setShowReplyTo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [pendingTemplate, setPendingTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FollowUpTemplate | null>(null);

  const selectedSignature = signatures.find((s) => s.id === selectedSignatureId) || null;
  const availableVariables = Object.keys(recipientColumnData)[0]
    ? Object.keys(recipientColumnData[Object.keys(recipientColumnData)[0]])
    : [];

  const selectedSenders = senders.filter(s => data.selectedSenderIds.includes(s.id));
  const selectedSender = selectedSenders[0] || null;

  useEffect(() => {
    if (initialEmails && initialEmails.length > 0) {
      updateData(prev => ({
        ...prev,
        to: Array.from(new Set([...prev.to, ...initialEmails]))
      }));
    }
  }, [initialEmails, updateData]);

  useEffect(() => {
    if (!followUpTemplateId) return;
    (async () => {
      try {
        const template = await getFollowUpTemplateById(followUpTemplateId);
        setEditingTemplate(template);
        setSequenceSteps(template.steps.map((s) => ({
          subject: s.subject || "",
          body: s.body || "",
          waitDays: s.waitDays || 3,
          condition: s.condition,
          altSubjects: s.altSubjects,
          sendHour: s.sendHour,
          waitHours: s.waitHours,
        })));
        addToast("info", `Editing follow-up template: ${template.name}`);
      } catch {
        addToast("error", "Failed to load follow-up template");
      }
    })();
  }, [followUpTemplateId, setSequenceSteps, addToast]);

  useEffect(() => {
    const saved = localStorage.getItem("email_signatures");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSignatures(parsed);
        const defaultSig = parsed.find((s: { isDefault: boolean }) => s.isDefault) || parsed[0];
        setSelectedSignatureId(defaultSig?.id || "");
      } catch { }
    }
  }, [setSignatures, setSelectedSignatureId]);

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
          patchData({ from: firstVerified.email, selectedSenderIds: [firstVerified.id] });
        } else if (list.length > 0) {
          patchData({ from: list[0].email, selectedSenderIds: [list[0].id] });
        }
      } catch { } finally { setIsSenderLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSender = (senderId: string) => {
    updateData(prev => {
      const isSelected = prev.selectedSenderIds.includes(senderId);
      const newIds = isSelected
        ? prev.selectedSenderIds.filter(id => id !== senderId)
        : [...prev.selectedSenderIds, senderId];
      const firstSender = senders.find(s => newIds.includes(s.id));
      return { ...prev, selectedSenderIds: newIds, from: firstSender?.email || "" };
    });
    updateErrors(p => ({ ...p, from: "" }));
  };

  const removeSelectedRecipients = () => {
    updateData(prev => ({
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

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        try {
          const { data: rows } = results;
          if (rows.length < 2) {
            setCsvError("CSV needs header + data");
            addToast("error", "Invalid CSV");
            return;
          }

          const headers = rows[0];
          const emails: string[] = [];
          const colData: Record<string, Record<string, string>> = {};

          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            const email = cols[0]?.trim();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
            emails.push(email);
            const row: Record<string, string> = {};
            for (let j = 1; j < Math.min(headers.length, cols.length); j++) {
              if (headers[j]) row[headers[j]] = cols[j]?.trim();
            }
            colData[email.toLowerCase()] = row;
          }

          if (!emails.length) {
            setCsvError("No valid emails");
            addToast("error", "No valid emails in CSV");
            return;
          }
          updateData(prev => ({ ...prev, to: Array.from(new Set([...prev.to, ...emails])) }));
          setRecipientColumnData({ ...recipientColumnData, ...colData });
          setCsvMessage(`${emails.length} imported`);
          addToast("success", `${emails.length} contacts imported`);
          setTimeout(() => setCsvMessage(null), 3000);
        } catch {
          setCsvError("Invalid CSV format");
          addToast("error", "Invalid CSV");
        }
      },
      error: () => {
        setCsvError("Failed to parse CSV");
        addToast("error", "Failed to parse CSV");
      }
    });
    e.target.value = "";
  };

  const applyTemplate = (template: EmailTemplate) => {
    patchData({ subject: template.subject, body: template.body });
    setPendingTemplate(null);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    const isDirty = data.subject.trim() !== "" || (data.body.trim() !== "" && data.body !== "<p></p>");
    if (isDirty) setPendingTemplate(template);
    else applyTemplate(template);
  };

  const handleSaveSignature = (sig: { id: string; name: string; content: string; isDefault: boolean }) => {
    const updated = signatures.map(s => s.id === sig.id ? sig : s);
    setSignatures(updated);
    localStorage.setItem("email_signatures", JSON.stringify(updated));
    if (sig.isDefault) setSelectedSignatureId(sig.id);
    setEditingSignature(null);
    addToast("success", "Signature saved");
  };

  const addRecipientToField = (field: "cc" | "bcc", rawValue: string) => {
    const value = rawValue.trim().replace(/,$/, "");
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      addToast("error", "Invalid email address");
      return;
    }

    updateData(prev => {
      const current = field === "cc" ? prev.cc : prev.bcc;
      if (current.includes(value)) return prev;
      return field === "cc"
        ? { ...prev, cc: [...prev.cc, value] }
        : { ...prev, bcc: [...prev.bcc, value] };
    });
  };

  const openSchedule = () => {
    if (scheduledAt) {
      const d = scheduledAt;
      setTempDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      setTempTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    } else {
      setTempDate("");
      setTempTime("");
    }
    setIsScheduleOpen(true);
  };

  const confirmSchedule = () => {
    if (tempDate && tempTime) {
      const [year, month, day] = tempDate.split("-").map(Number);
      const [hours, minutes] = tempTime.split(":").map(Number);
      const selectedDate = new Date(year, month - 1, day, hours, minutes);

      if (selectedDate <= new Date()) {
        addToast("error", "Please select a future time");
        return;
      }

      setScheduledAt(selectedDate);
      setIsScheduleOpen(false);
      addToast("success", `Campaign scheduled for ${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(selectedDate)}`);
    }
  };

  const quickPick = (daysFromNow: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    setScheduledAt(d);
    setIsScheduleOpen(false);
    addToast("success", `Campaign scheduled for ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d)}`);
  };

  const handleFormSubmit = async () => {
    const e: Record<string, string> = {};
    if (!data.selectedSenderIds.length) e.from = "Select a sender";
    const hasUnverified = selectedSenders.some(s => !s.isVerified);
    if (hasUnverified) e.from = "Sender not verified";
    if (!data.to.length) e.to = "Add at least one recipient";
    if (!data.subject.trim()) e.subject = "Add a subject";
    const bodyContent = data.body + (selectedSignature?.content || "");
    if (!bodyContent.replace(/<[^>]+>/g, "").trim()) e.body = "Add email content or select a signature";
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
        body: data.body + (selectedSignature?.content || ""),
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
        steps: sequenceSteps.length > 0 ? sequenceSteps.map(s => ({
          subject: s.subject,
          body: s.body,
          waitDays: s.waitDays,
          condition: s.condition?.type,
          altSubjects: s.altSubjects?.filter(Boolean),
          sendHour: s.sendHour,
          waitHours: s.waitHours,
        })) : undefined,
        sequenceGraph: sequenceSteps.length > 0 ? {
          startNodeId: "n1",
          nodes: sequenceSteps.map((s, i) => ({
            id: `n${i + 1}`,
            subject: s.subject,
            body: s.body,
            waitDays: s.waitDays,
            rules: s.condition?.rules || (s.condition?.type && s.condition.type !== "none"
              ? { operator: "AND" as const, operands: [{ type: s.condition.type as "opened" | "clicked" | "replied" }] }
              : undefined),
          })),
          edges: Object.fromEntries(sequenceSteps.map((s, i) => {
            const from = `n${i + 1}`;
            const matchNode = s.condition?.onMatchNodeId ?? (i + 2 <= sequenceSteps.length ? `n${i + 2}` : null);
            return [from, { onMatch: matchNode, onNoMatch: s.condition?.onNoMatchNodeId ?? null }];
          })),
        } : undefined,
        sequenceSchedule: sequenceSteps.length > 0 ? sequenceSchedule : undefined,
        frequencyCaps: sequenceSteps.length > 0 && (frequencyCaps.maxPerRecipient > 0 || frequencyCaps.maxPerDay > 0 || frequencyCaps.maxPerWeek > 0)
          ? frequencyCaps : undefined,
        trackOpens,
        trackClicks,
        replyTo: showReplyTo ? data.replyTo : undefined,
        isPriority: priorityEnabled,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create campaign";
      setSubmitError(message);
    }
  };

  useImperativeHandle(ref, () => ({
    openSchedule,
    submit: handleFormSubmit,
  }));

  const handleSenderUpdated = (s: SenderResponse) => {
    setSenders(prev => prev.find(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]);
    if (s.isVerified) {
      updateData(prev => ({
        ...prev,
        selectedSenderIds: prev.selectedSenderIds.includes(s.id) ? prev.selectedSenderIds : [...prev.selectedSenderIds, s.id],
        from: prev.from || s.email,
      }));
    }
  };

  return (
    <>
      <div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          {submitError && (
            <div className="mb-4 p-3.5 rounded-lg bg-error-bg border border-error-bg text-sm text-error-text flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="font-medium">{submitError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Main Compose Area */}
              <div className="lg:col-span-8 space-y-4">
                {/* Email Card */}
                <div className="bg-white rounded-lg border border-border-light shadow-sm overflow-hidden">
                  <SenderField
                    senders={senders}
                    selectedSenderIds={data.selectedSenderIds}
                    isSenderLoading={isSenderLoading}
                    isSenderDropdownOpen={isSenderDropdownOpen}
                    onToggleSender={toggleSender}
                    onToggleDropdown={() => setIsSenderDropdownOpen(prev => !prev)}
                    onOpenModal={() => setIsSenderModalOpen(true)}
                    dropdownRef={senderDropdownRef}
                  />

                  {/* To */}
                  <div className="px-4 py-3.5 border-b border-border-light flex items-center gap-3">
                    <span className="text-xs font-medium text-text-muted w-16 shrink-0">To</span>
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
                              patchData({ selectedRecipients: newSelected });
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md text-xs font-medium px-2 py-1 cursor-pointer transition-colors",
                              data.selectedRecipients.has(email)
                                ? "bg-brand text-white shadow-sm"
                                : "bg-[#F0F1F3] text-text-secondary hover:bg-[#E2E4E9]"
                            )}
                          >
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button
                              type="button"
                              className={cn("ml-0.5 hover:scale-110 transition-transform", data.selectedRecipients.has(email) ? "text-white/80" : "text-text-muted")}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateData(prev => ({ ...prev, to: prev.to.filter(e => e !== email) }));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          ref={inputRef}
                          placeholder={data.to.length === 0 ? "recipient@example.com" : ""}
                          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              const v = (e.target as HTMLInputElement).value.trim().replace(/,/g, "");
                              if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                                if (!data.to.includes(v)) updateData(prev => ({ ...prev, to: [...prev.to, v] }));
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                            if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && data.to.length)
                              updateData(prev => ({ ...prev, to: prev.to.slice(0, -1) }));
                          }}
                        />
                      </div>
                      {errors.to && <p className="text-xs text-error-text mt-1">{errors.to}</p>}
                      {csvMessage && <p className="text-xs text-brand mt-1">{csvMessage}</p>}
                      {csvError && <p className="text-xs text-error-text mt-1">{csvError}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {data.to.length > 0 && (
                        <EmailValidator
                          emails={data.to}
                          onRemoveEmail={(email) => updateData(prev => ({ ...prev, to: prev.to.filter(e => e !== email) }))}
                          onValidationComplete={() => { }}
                        />
                      )}
                      <button
                        onClick={() => setShowCc(!showCc)}
                        className={cn("text-xs font-bold h-8 px-2 rounded-lg transition-colors", showCc ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F8F9FA]")}
                      >
                        CC
                      </button>
                      <button
                        onClick={() => setShowBcc(!showBcc)}
                        className={cn("text-xs font-bold h-8 px-2 rounded-lg transition-colors", showBcc ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F8F9FA]")}
                      >
                        BCC
                      </button>
                      <button
                        onClick={() => setShowReplyTo(!showReplyTo)}
                        className={cn("text-xs font-bold h-8 px-2 rounded-lg transition-colors", showReplyTo ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F8F9FA]")}
                      >
                        Reply-To
                      </button>
                    </div>
                  </div>

                  {/* CC */}
                  {showCc && (
                    <div className="px-4 py-3 border-b border-border-light flex items-center gap-3">
                      <span className="text-xs font-medium text-text-muted w-16 shrink-0">Cc</span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 items-center">
                        {data.cc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1 rounded-md text-xs font-medium bg-[#F0F1F3] text-text-secondary px-2 py-1">
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button type="button" className="text-text-muted hover:text-text-secondary" onClick={() => updateData(prev => ({ ...prev, cc: prev.cc.filter(e => e !== email) }))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          value={ccInput}
                          onChange={(e) => setCcInput(e.target.value)}
                          placeholder={data.cc.length ? "" : "cc@example.com"}
                          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addRecipientToField("cc", ccInput);
                              setCcInput("");
                            }
                            if (e.key === "Backspace" && !ccInput && data.cc.length) {
                              updateData(prev => ({ ...prev, cc: prev.cc.slice(0, -1) }));
                            }
                          }}
                          onBlur={() => {
                            if (ccInput.trim()) {
                              addRecipientToField("cc", ccInput);
                              setCcInput("");
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* BCC */}
                  {showBcc && (
                    <div className="px-4 py-3 border-b border-border-light flex items-center gap-3">
                      <span className="text-xs font-medium text-text-muted w-16 shrink-0">Bcc</span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 items-center">
                        {data.bcc.map(email => (
                          <span key={email} className="inline-flex items-center gap-1 rounded-md text-xs font-medium bg-[#F0F1F3] text-text-secondary px-2 py-1">
                            <span className="truncate max-w-[150px]">{email}</span>
                            <button type="button" className="text-text-muted hover:text-text-secondary" onClick={() => updateData(prev => ({ ...prev, bcc: prev.bcc.filter(e => e !== email) }))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          value={bccInput}
                          onChange={(e) => setBccInput(e.target.value)}
                          placeholder={data.bcc.length ? "" : "bcc@example.com"}
                          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addRecipientToField("bcc", bccInput);
                              setBccInput("");
                            }
                            if (e.key === "Backspace" && !bccInput && data.bcc.length) {
                              updateData(prev => ({ ...prev, bcc: prev.bcc.slice(0, -1) }));
                            }
                          }}
                          onBlur={() => {
                            if (bccInput.trim()) {
                              addRecipientToField("bcc", bccInput);
                              setBccInput("");
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reply-To */}
                  {showReplyTo && (
                    <div className="px-4 py-3 border-b border-border-light flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                      <span className="text-xs font-medium text-text-muted w-16 shrink-0">Reply-To</span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="email"
                          value={data.replyTo || ""}
                          onChange={(e) => patchData({ replyTo: e.target.value })}
                          placeholder="Routing replies to... (e.g. primary@company.com)"
                          className="w-full text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                        />
                      </div>
                      <button type="button" className="text-text-muted hover:text-text-secondary transition-colors" onClick={() => { setShowReplyTo(false); patchData({ replyTo: "" }); }}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="px-4 py-3.5 border-b border-border-light flex items-center gap-3">
                    <span className="text-xs font-medium text-text-muted w-16 shrink-0">Subject</span>
                    <input
                      type="text"
                      placeholder="Add a subject"
                      value={data.subject}
                      onChange={(e) => { patchData({ subject: e.target.value }); updateErrors(p => ({ ...p, subject: "" })); }}
                      className="flex-1 text-sm text-text-primary outline-none placeholder:text-text-muted"
                    />
                  </div>

                  {/* Body */}
                  <div className="min-h-[350px]">
                    <Editor
                      value={data.body}
                      onChange={(html) => patchData({ body: html })}
                      availableVariables={availableVariables}
                    />
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-border-light bg-[#F8F9FA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                      <button
                        onClick={() => csvInputRef.current?.click()}
                        className="h-10 px-4 rounded-lg border border-border-light text-text-secondary text-sm font-semibold hover:bg-[#F8F9FA] flex items-center gap-2 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-text-muted" />
                        Import CSV
                      </button>

                      <BulkActionsDropdown
                        selectedCount={data.selectedRecipients.size}
                        totalCount={data.to.length}
                        isOpen={isBulkMenuOpen}
                        onToggle={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                        onSelectAll={() => {
                          updateData(prev => ({ ...prev, selectedRecipients: new Set(prev.to) }));
                          setIsBulkMenuOpen(false);
                        }}
                        onDeselectAll={() => {
                          patchData({ selectedRecipients: new Set() });
                          setIsBulkMenuOpen(false);
                        }}
                        onCopyAll={copyAllEmails}
                        onExportSelected={exportSelectedToCsv}
                        onRemoveSelected={removeSelectedRecipients}
                        menuRef={bulkMenuRef}
                      />
                    </div>
                    <button
                      onClick={() => { resetStore(); window.history.back(); }}
                      className="h-10 w-10 flex items-center justify-center text-text-muted hover:text-error-text hover:bg-error-bg rounded-lg transition-all"
                      title="Discard draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Sequence Builder */}
                <SequenceBuilder
                  steps={sequenceSteps}
                  onChange={setSequenceSteps}
                  subject={data.subject}
                  body={data.body}
                  scheduleConfig={sequenceSchedule}
                  onScheduleConfigChange={setSequenceSchedule}
                  frequencyCaps={frequencyCaps}
                  onFrequencyCapsChange={setFrequencyCaps}
                  editingTemplate={editingTemplate}
                />
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-4">
                <ComposeSettings
                  isOpen={isSettingsOpen}
                  onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
                  delayBetweenEmails={data.delayBetweenEmails}
                  onDelayChange={(v) => patchData({ delayBetweenEmails: Math.min(300, Math.max(30, v || 30)) })}
                  hourlyLimit={data.hourlyLimit}
                  onHourlyLimitChange={(v) => patchData({ hourlyLimit: Math.min(40, Math.max(1, v || 1)) })}
                  trackOpens={trackOpens}
                  onTrackOpensChange={setTrackOpens}
                  trackClicks={trackClicks}
                  onTrackClicksChange={setTrackClicks}
                  priorityEnabled={priorityEnabled}
                  onPriorityChange={setPriorityEnabled}
                  signatures={signatures}
                  selectedSignatureId={selectedSignatureId}
                  onSignatureChange={(id) => setSelectedSignatureId(id)}
                  onManageSignatures={() => setIsSignatureModalOpen(true)}
                />

                {/* Templates */}
                <div className="bg-white rounded-lg border border-border-light relative z-30">
                  <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Templates</p>
                    <span className="text-[10px] text-text-muted font-bold">Select to Apply</span>
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

      {/* Modals outside main layout */}
      {isSenderModalOpen && (
        <SenderModal
          isOpen={isSenderModalOpen}
          onClose={() => setIsSenderModalOpen(false)}
          onSuccess={handleSenderUpdated}
          existingSender={selectedSender && !selectedSender.isVerified ? selectedSender : null}
        />
      )}

      {/* Template confirmation */}
      {pendingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm" onClick={() => setPendingTemplate(null)}>
          <div className="w-full max-w-sm mx-4 rounded-lg bg-white p-6 shadow-premium-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary mb-2">Use this template?</h3>
            <p className="text-sm text-text-muted mb-5">
              This will replace your current subject and body.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingTemplate(null)} className="flex flex-1 h-8 items-center justify-center rounded-md border border-border-light bg-white px-4 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
              <button onClick={() => applyTemplate(pendingTemplate!)} className="flex flex-1 h-8 items-center justify-center rounded-md bg-brand px-4 text-xs font-medium text-white transition-all hover:bg-brand/90">Apply</button>
            </div>
          </div>
        </div>
      )}

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        signatures={signatures}
        editingSignature={editingSignature}
        onEdit={setEditingSignature}
        onSave={handleSaveSignature}
        onCancelEdit={() => setEditingSignature(null)}
        onSetDefault={(id) => {
          const updated = signatures.map(s => ({ ...s, isDefault: s.id === id }));
          setSignatures(updated);
          localStorage.setItem("email_signatures", JSON.stringify(updated));
          addToast("info", "Default signature updated");
        }}
        onCreateNew={() => setEditingSignature({ id: Date.now().toString(), name: "", content: "", isDefault: false })}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        scheduledAt={scheduledAt}
        tempDate={tempDate}
        tempTime={tempTime}
        onTempDateChange={setTempDate}
        onTempTimeChange={setTempTime}
        onConfirm={confirmSchedule}
        onQuickPick={quickPick}
        onClear={() => { setScheduledAt(null); setIsScheduleOpen(false); }}
        isMobile={isMobile}
      />
    </>
  );
});

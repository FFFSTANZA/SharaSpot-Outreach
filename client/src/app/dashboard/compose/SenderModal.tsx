"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { createSender, verifySender } from "@/lib/apis";
import { SenderModalProps, SenderResponse } from "@/types";
import { AlertCircle, CheckCircle2, Mail, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import {
  getConnectionSecurityHint,
  getProviderConfig,
  inferProviderFromHost,
  InstructionItem,
  SENDER_PROVIDERS,
  SenderProviderConfig,
  SenderProviderKey,
} from "@/lib/senderProviders";

function deriveSenderName(rawEmail: string): string {
  const localPart = rawEmail.split("@")[0]?.trim();
  if (!localPart) return "Sender";
  const normalized = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function SenderModal({ isOpen, onClose, onSuccess, existingSender }: SenderModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [providerKey, setProviderKey] = useState<SenderProviderKey>("gmail");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [replyTo, setReplyTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skipWarmup, setSkipWarmup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<"idle" | "passed">("idle");
  const [connectedSender, setConnectedSender] = useState<{ email: string; provider: SenderProviderConfig } | null>(null);
  const [savedSender, setSavedSender] = useState<SenderResponse | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { addToast } = useToast();

  const isVerifyMode = !!existingSender;
  const selectedProvider = getProviderConfig(providerKey);

  useEffect(() => {
    if (!isOpen) return;

    if (existingSender) {
      const inferredProvider = inferProviderFromHost(existingSender.smtpHost);
      setStep(2);
      setName(existingSender.name || "");
      setEmail(existingSender.email);
      setProviderKey(inferredProvider);
      setSmtpHost(existingSender.smtpHost || "");
      setSmtpPort(existingSender.smtpPort?.toString() || "465");
      setReplyTo(existingSender.replyTo || "");
      setAppPassword("");
      setSkipWarmup(false);
      setShowAdvanced(inferredProvider === "custom");
      setError(null);
      setTestResult("idle");
      setConnectedSender(null);
      setSavedSender(null);
      return;
    }

    setStep(1);
    setName("");
    setEmail("");
    setProviderKey("gmail");
    setSmtpHost("");
    setSmtpPort("465");
    setReplyTo("");
    setAppPassword("");
    setSkipWarmup(false);
    setShowAdvanced(false);
    setError(null);
    setTestResult("idle");
    setConnectedSender(null);
    setSavedSender(null);
  }, [existingSender, isOpen]);

  useEffect(() => {
    const provider = getProviderConfig(providerKey);
    if (providerKey !== "custom") {
      setSmtpHost(provider.smtpHost);
      setSmtpPort(String(provider.smtpPort));
    } else if (!smtpHost) {
      setSmtpPort("587");
    }
    if (providerKey === "custom") {
      setShowAdvanced(true);
    }
  }, [providerKey, smtpHost]);

  const isStep2Valid = useMemo(() => {
    const hasRequired = appPassword.trim() !== "" && email.trim() !== "";
    if (providerKey !== "custom" && !showAdvanced) return hasRequired;
    return hasRequired && smtpHost.trim() !== "" && smtpPort.trim() !== "";
  }, [appPassword, email, providerKey, showAdvanced, smtpHost, smtpPort]);

  const handleSubmit = async () => {
    if (!isStep2Valid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setTestResult("idle");

    try {
      const parsedPort = smtpPort ? parseInt(smtpPort, 10) : undefined;
      const resolvedName = name.trim() || deriveSenderName(email);

      let sender;
      if (isVerifyMode) {
        sender = await verifySender(existingSender.id, {
          name: resolvedName,
          appPassword,
          providerKey,
          smtpHost: showAdvanced || providerKey === "custom" ? smtpHost.trim() || undefined : undefined,
          smtpPort: showAdvanced || providerKey === "custom" ? parsedPort : undefined,
          replyTo: replyTo.trim() || undefined,
          skipWarmup: skipWarmup || undefined,
        });
      } else {
        sender = await createSender({
          name: resolvedName,
          email,
          appPassword,
          providerKey,
          smtpHost: showAdvanced || providerKey === "custom" ? smtpHost.trim() || undefined : undefined,
          smtpPort: showAdvanced || providerKey === "custom" ? parsedPort : undefined,
          replyTo: replyTo.trim() || undefined,
          skipWarmup: skipWarmup || undefined,
        });
      }

      setStep(3);
      setTestResult("passed");
      setSavedSender(sender);
      setConnectedSender({
        email: sender.email,
        provider: getProviderConfig(sender.providerKey || providerKey),
      });
      addToast("success", isVerifyMode ? "Connection verified and sender updated" : `Sender connected: ${email}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const message = apiErr.response?.data?.message || "Connection failed. Please check settings and try again.";
      setError(message);
      addToast("error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  const securityHint = getConnectionSecurityHint(Number(smtpPort || 0));
  const handleFinish = () => {
    if (!connectedSender || !savedSender) return;
    onSuccess(savedSender);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant={isMobile ? "bottom-sheet" : "center"}>
      <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar bg-white">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">{isVerifyMode ? "Verify Sender" : "Connect Sender"}</h2>
          <p className="text-sm font-medium text-text-secondary mt-1">Step {step} of 3: Provider, credentials, then test connection.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-error-bg border border-error-border/30 px-4 py-3 text-sm text-error-text font-medium">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isVerifyMode && step === 1 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">Choose Email Provider</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SENDER_PROVIDERS.map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  onClick={() => {
                    setProviderKey(provider.key);
                    setStep(2);
                  }}
                  className="text-left rounded-lg border border-border-light p-4 hover:border-brand hover:bg-interactive-hover transition-colors"
                >
                  <p className="font-bold text-sm text-text-primary">{provider.label}</p>
                  <p className="text-xs text-text-secondary mt-1">{provider.smtpHost || "Use your own SMTP host/port"}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {(isVerifyMode || step >= 2) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border-light bg-interactive-hover/30 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Provider</p>
                <p className="text-sm font-bold text-text-primary">{selectedProvider.label}</p>
              </div>
              {!isVerifyMode && (
                <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-brand">
                  Change
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Sender Name (Optional)</label>
                <Input
                  type="text"
                  placeholder={email ? deriveSenderName(email) : "e.g. Sales Team"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. sales@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isVerifyMode}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">App Password / SMTP Password</label>
              <Input
                type="password"
                placeholder="Your app password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-lg border border-border-light bg-interactive-hover/30 p-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-2">Setup Checklist</p>
              <ul className="space-y-1.5">
                {selectedProvider.instructions.map((instruction: InstructionItem) => (
                  <li key={instruction.text} className="text-xs text-text-secondary flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-text-muted" />
                    {instruction.href ? (
                      <a
                        href={instruction.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline font-bold"
                      >
                        {instruction.text}
                      </a>
                    ) : (
                      <span>{instruction.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border-light bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">Manual SMTP settings</p>
                  <p className="mt-1 text-[11px] font-medium leading-5 text-text-secondary">
                    Keep this closed unless your provider gave you a custom SMTP host or port. Standard Google and Outlook setups usually work with the default values.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-border-light bg-interactive-hover/40 px-3 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-interactive-hover"
                >
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showAdvanced ? "Hide manual settings" : "Show manual settings"}
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-4 rounded-lg border border-border-light bg-interactive-hover/20 p-4 animate-in">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Advanced SMTP</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                    Override the default mailbox connection only if you know the exact SMTP values your provider expects.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">SMTP Host</label>
                    <Input type="text" placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] text-center">Port</label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="text-center"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-text-muted font-semibold">{securityHint}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
                <Reply className="inline h-3 w-3 mr-1.5" /> Default Reply-To
              </label>
              <Input type="email" placeholder="e.g. founders@company.com" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} disabled={isSubmitting} />
            </div>

            <label className="flex items-start gap-4 cursor-pointer p-4 rounded-lg border border-border-light bg-interactive-hover/30 hover:bg-interactive-hover transition-colors">
              <input
                type="checkbox"
                checked={skipWarmup}
                onChange={(e) => setSkipWarmup(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border-medium text-brand focus:ring-brand/20 transition-all"
                disabled={isSubmitting}
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-text-primary">Skip Provider Warmup</span>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed">Send at full volume immediately. Recommended only for trusted mailboxes.</p>
              </div>
            </label>
          </div>
        )}

        {step === 3 && testResult === "passed" && connectedSender && (
          <div className="rounded-lg border border-brand/20 bg-brand-light p-4 space-y-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-brand" />
              <p className="text-sm font-semibold text-brand">Connection test passed. Sender is ready.</p>
            </div>
            <p className="text-xs text-brand/90 font-medium">
              Connected: {connectedSender.email} ({connectedSender.provider.label})
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-light">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="px-6">
            Cancel
          </Button>
          {(isVerifyMode || step >= 2) && step < 3 && (
            <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!isStep2Valid} className="px-8">
              Test Connection & Save
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleFinish} className="px-8">
              Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

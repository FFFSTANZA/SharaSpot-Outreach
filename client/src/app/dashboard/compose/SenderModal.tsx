"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { createSender, verifySender } from "@/lib/apis";
import { SenderModalProps } from "@/types";
import { AlertCircle, ExternalLink, Settings, Globe, Reply } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * SenderModal - Add a new sender or verify an existing unverified sender.
 * Supports custom SMTP (Host/Port) and default Reply-To.
 */
export function SenderModal({ isOpen, onClose, onSuccess, existingSender }: SenderModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [replyTo, setReplyTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skipWarmup, setSkipWarmup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { addToast } = useToast();

  const isVerifyMode = !!existingSender;

  // Pre-fill fields
  useEffect(() => {
    if (existingSender && isOpen) {
      setName(existingSender.name || "");
      setEmail(existingSender.email);
      setSmtpHost(existingSender.smtpHost || "");
      setSmtpPort(existingSender.smtpPort?.toString() || "465");
      setReplyTo(existingSender.replyTo || "");
      setAppPassword("");
      setSkipWarmup(false);
      setError(null);
    } else if (!existingSender && isOpen) {
      setName("");
      setEmail("");
      setSmtpHost("");
      setSmtpPort("465");
      setReplyTo("");
      setAppPassword("");
      setSkipWarmup(false);
      setError(null);
    }
  }, [existingSender, isOpen]);

  const isFormValid = isVerifyMode
    ? appPassword.trim() !== ""
    : name.trim() !== "" && email.trim() !== "" && appPassword.trim() !== "";

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let sender;
      const payload = {
        name,
        email,
        appPassword,
        smtpHost: smtpHost.trim() || undefined,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        replyTo: replyTo.trim() || undefined,
        skipWarmup: skipWarmup || undefined,
      };

      if (isVerifyMode) {
        sender = await verifySender(existingSender.id, {
          name: name.trim() || undefined,
          appPassword,
          skipWarmup: skipWarmup || undefined,
        });
      } else {
        sender = await createSender(payload);
      }

      addToast("success", isVerifyMode ? `Sender updated` : `Sender added: ${email}`);
      onSuccess(sender);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const message = apiErr.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
      addToast("error", `Failed: ${message}`);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      variant={isMobile ? "bottom-sheet" : "center"}
    >
      <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar bg-white">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            {isVerifyMode ? "Configure Sender" : "Add Sender Account"}
          </h2>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Connect any SMTP provider or Google account.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-error-bg border border-error-border/30 px-4 py-3 text-sm text-error-text font-medium">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Sender Name</label>
              <Input
                type="text"
                placeholder="e.g. Sales Team"
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
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
              App Password / SMTP Password
            </label>
            <Input
              type="password"
              placeholder="Your 16-character app password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="mt-2 text-[10px] font-semibold text-text-muted leading-relaxed flex items-center gap-1.5">
              <ExternalLink className="h-3 w-3" />
              For Gmail, use a Google App Password.{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-brand hover:underline">Generate here</a>
            </p>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
            >
              <Settings className={cn("h-3.5 w-3.5 transition-transform duration-300", showAdvanced && "rotate-90")} />
              {showAdvanced ? "Hide SMTP Settings" : "Configure Custom SMTP"}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-border-light animate-in">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
                    <Globe className="inline h-3 w-3 mr-1.5" /> SMTP Host
                  </label>
                  <Input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] text-center">Port</label>
                  <Input
                    type="number"
                    placeholder="465"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
                  <Reply className="inline h-3 w-3 mr-1.5" /> Default Reply-To
                </label>
                <Input
                  type="email"
                  placeholder="e.g. founders@company.com"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                />
                <p className="mt-1.5 text-[10px] text-text-muted font-semibold">
                  Replies will be routed here instead of the sender address.
                </p>
              </div>
            </div>
          )}

          <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl border border-border-light bg-interactive-hover/30 hover:bg-interactive-hover transition-colors">
            <input
              type="checkbox"
              checked={skipWarmup}
              onChange={(e) => setSkipWarmup(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border-medium text-brand focus:ring-brand/20 transition-all"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-text-primary">Skip Provider Warmup</span>
              <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
                Send at full volume immediately. Only recommended for established accounts with good reputation.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-light">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!isFormValid}
            className="px-8"
          >
            {isVerifyMode ? "Update Account" : "Connect Account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState, useCallback, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComposeForm, ComposeFormHandle } from "./ComposeForm";
import { ComposeHeader } from "./ComposeHeader";
import { createCampaign, uploadAttachments, deleteAttachment, getContacts } from "@/lib/apis";
import type { CreateCampaignPayload, UploadedAttachment } from "@/types";
import { useSidebar } from "@/hooks/useSidebar";
import { Menu } from "lucide-react";

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { toggle } = useSidebar();

  const formRef = useRef<ComposeFormHandle>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialEmails, setInitialEmails] = useState<string[]>([]);
  const [followUpTemplateId, setFollowUpTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const resolveRecipients = async () => {
      const emails = searchParams.get("emails");
      if (emails) {
        setInitialEmails(emails.split(","));
        return;
      }

      const segmentId = searchParams.get("segmentId");
      if (!segmentId) return;
      try {
        const contacts = await getContacts({ segmentId });
        setInitialEmails(contacts.contacts.map((c) => c.email));
      } catch {
        addToast("error", "Failed to load segment recipients");
      }
    };
    resolveRecipients();
    setFollowUpTemplateId(searchParams.get("followUpTemplateId") || null);
  }, [searchParams, addToast]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsUploading(true);
    try {
      const results = await uploadAttachments(files);
      setUploadedAttachments(prev => [...prev, ...results]);
      results.forEach((r) => addToast("success", `Attachment uploaded: ${r.filename}`));
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      addToast("error", "Attachment upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [addToast]);

  const handleRemoveAttachment = useCallback(async (url: string) => {
    setUploadedAttachments(prev => prev.filter(a => a.url !== url));
    try {
      await deleteAttachment(url);
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      addToast("error", "Failed to remove attachment");
    }
  }, [addToast]);

  const handleSubmit = useCallback(
    async (data: CreateCampaignPayload) => {
      setIsSubmitting(true);
      try {
        await createCampaign(data);
        addToast("success", `Campaign created: ${data.subject}`);
        router.push("/dashboard");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        addToast("error", `Failed to create campaign: ${message}`);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, addToast],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] flex flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-border-light px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Open sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
            >
              <Menu size={14} />
            </button>
            <button
              onClick={() => router.back()}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3]"
            >
              <span className="text-base">&larr;</span>
              Back
            </button>
            <div className="h-5 w-px bg-border-light" />
            <h1 className="text-base font-semibold text-text-primary">Compose</h1>
          </div>
          <ComposeHeader
            scheduledAt={scheduledAt}
            onClearSchedule={() => setScheduledAt(null)}
            onOpenSchedule={() => formRef.current?.openSchedule()}
            isSubmitting={isSubmitting}
            onSend={() => formRef.current?.submit()}
          />
        </div>
      </div>
      <ErrorBoundary>
        <ComposeForm
          ref={formRef}
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          uploadedAttachments={uploadedAttachments}
          onFilesSelected={handleFilesSelected}
          onRemoveAttachment={handleRemoveAttachment}
          isUploading={isUploading}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialEmails={initialEmails}
          followUpTemplateId={followUpTemplateId}
        />
      </ErrorBoundary>
    </div>
  );
}

export default function ComposePage() {
  return (
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><span className="text-sm text-text-muted">Loading...</span></div>}>
          <ComposeContent />
        </Suspense>
      </ErrorBoundary>
    </AuthGuard>
  );
}

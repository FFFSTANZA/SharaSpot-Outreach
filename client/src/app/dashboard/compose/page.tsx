"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ComposeForm } from "./ComposeForm";
import { createCampaign, uploadAttachments, deleteAttachment } from "@/lib/apis";
import type { CreateCampaignPayload, UploadedAttachment } from "@/types";

export default function ComposePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitTrigger, setSubmitTrigger] = useState(0);

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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <ComposeForm
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          uploadedAttachments={uploadedAttachments}
          onFilesSelected={handleFilesSelected}
          onRemoveAttachment={handleRemoveAttachment}
          isUploading={isUploading}
          onSubmit={handleSubmit}
          submitTrigger={submitTrigger}
          isSubmitting={isSubmitting}
        />
      </div>
    </AuthGuard>
  );
}

"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Editor } from "@/app/dashboard/compose/Editor";
import { createTemplate, updateTemplate } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";
import type { EmailTemplate } from "@/types";
import { Loader2 } from "lucide-react";

interface TemplateFormModalProps {
  template: EmailTemplate | null; // null = create mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function TemplateFormModal({
  template,
  onClose,
  onSuccess,
}: TemplateFormModalProps) {
  const isEditing = !!template;
  const { addToast } = useToast();

  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError("Template name is required");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setSubmitError("");

    try {
      if (isEditing) {
        await updateTemplate(template.id, { name: name.trim(), subject, body });
        addToast("success", `Template updated: ${name.trim()}`);
      } else {
        await createTemplate({ name: name.trim(), subject, body });
        addToast("success", `Template created: ${name.trim()}`);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong";
      if (msg.includes("already exists")) {
        setNameError(msg);
      } else {
        setSubmitError(msg);
      }
      const action = isEditing ? "update" : "create";
      addToast("error", `Failed to ${action} template: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="max-w-[640px] w-[90vw] sm:w-full">
      <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary pr-8">
          {isEditing ? "Edit Template" : "New Template"}
        </h2>

        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs sm:text-sm font-medium text-text-secondary">
            Template Name
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="e.g. Cold Outreach v1"
            className={nameError ? "ring-2 ring-error-bg" : ""}
          />
          {nameError && (
            <p className="mt-1 text-xs text-error-text">{nameError}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-xs sm:text-sm font-medium text-text-secondary">
            Subject Line
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quick question about {{company}}"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            Use {"{{variable}}"} for personalization
          </p>
        </div>

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-xs sm:text-sm font-medium text-text-secondary">
            Email Body
          </label>
          <div className="rounded-lg border border-border-light overflow-hidden min-h-[300px] bg-white">
            <Editor value={body} onChange={setBody} />
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-error-text text-center">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            className="flex-1 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-lg gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

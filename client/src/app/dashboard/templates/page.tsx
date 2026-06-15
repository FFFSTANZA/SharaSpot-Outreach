"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTemplates, deleteTemplate as deleteTemplateApi } from "@/lib/apis";
import type { EmailTemplate } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import TemplateFormModal from "./TemplateFormModal";
import { cn } from "@/lib/utils";
import type { FollowUpTemplate } from "@/types";
import { deleteFollowUpTemplate, listFollowUpTemplates } from "@/lib/followUpTemplates";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Search,
  Route,
  Menu,
  Clock,
} from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";

type Tab = "email" | "followup";

export default function TemplatesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><span className="text-sm text-text-muted">Loading templates...</span></div>}>
      <TemplatesPage />
    </Suspense>
  );
}

function TemplatesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { toggle } = useSidebar();
  const [activeTab, setActiveTab] = useState<Tab>("email");
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [followUpTemplates, setFollowUpTemplates] = useState<FollowUpTemplate[]>([]);
  const [followUpSearchQuery, setFollowUpSearchQuery] = useState("");
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [deleteFollowUpTarget, setDeleteFollowUpTarget] = useState<FollowUpTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {
      setError("Failed to load templates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFollowUpTemplates = useCallback(async () => {
    setFollowUpError(null);
    try {
      const data = await listFollowUpTemplates();
      setFollowUpTemplates(data);
    } catch {
      setFollowUpError("Failed to load follow-up templates. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchFollowUpTemplates();
  }, [fetchTemplates, fetchFollowUpTemplates]);

  const refreshFollowUps = () => {
    fetchFollowUpTemplates();
  };

  const openNewFollowUp = () => {
    router.push("/dashboard/compose");
  };

  const openEditFollowUp = (template: FollowUpTemplate) => {
    router.push(`/dashboard/compose?followUpTemplateId=${template.id}`);
  };

  const handleDeleteFollowUpConfirm = async () => {
    if (!deleteFollowUpTarget) return;
    const template = deleteFollowUpTarget;
    setDeleteFollowUpTarget(null);
    try {
      await deleteFollowUpTemplate(template.id);
      refreshFollowUps();
      addToast("success", `Follow-up template deleted: ${template.name}`);
    } catch {
      addToast("error", "Failed to delete follow-up template");
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTemplateApi(deleteTarget.id);
      addToast("success", `Template deleted: ${deleteTarget.name}`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch {
      addToast("error", "Failed to delete template. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const filteredTemplates = templates?.filter((template) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(lowerQuery) ||
      template.subject.toLowerCase().includes(lowerQuery)
    );
  });

  const filteredFollowUps = followUpTemplates.filter((template) => {
    if (!followUpSearchQuery) return true;
    const q = followUpSearchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(q) ||
      (template.description || "").toLowerCase().includes(q) ||
      template.steps.some((s) => (s.subject || "").toLowerCase().includes(q))
    );
  });

  return (
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
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
                    <h1 className="text-base font-semibold text-text-primary">Templates</h1>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={activeTab === "email" ? handleCreate : openNewFollowUp}
                      className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90"
                    >
                      <Plus size={12} />
                      {activeTab === "email" ? "New Template" : "New Follow-up"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-border-light bg-[#F8F9FA] px-4 sm:px-6">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab("email")}
                    className={cn(
                      "relative h-8 text-xs font-medium transition-all border-b-2 -mb-px",
                      activeTab === "email"
                        ? "border-brand text-brand"
                        : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-medium"
                    )}
                  >
                    <span className="flex h-full items-center px-2">
                      Email Templates
                      {templates && (
                        <span className="ml-1.5 text-xs text-text-muted">({templates.length})</span>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("followup")}
                    className={cn(
                      "relative h-8 text-xs font-medium transition-all border-b-2 -mb-px",
                      activeTab === "followup"
                        ? "border-brand text-brand"
                        : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-medium"
                    )}
                  >
                    <span className="flex h-full items-center px-2">
                      Follow-up Templates
                      <span className="ml-1.5 text-xs text-text-muted">({followUpTemplates.length})</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="border-b border-border-light px-4 py-2.5 sm:px-6">
                <div className="relative min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    type="text"
                    placeholder={activeTab === "email" ? "Search email templates..." : "Search follow-up templates..."}
                    value={activeTab === "email" ? searchQuery : followUpSearchQuery}
                    onChange={(e) => activeTab === "email" ? setSearchQuery(e.target.value) : setFollowUpSearchQuery(e.target.value)}
                    aria-label="Search templates"
                    className="w-full rounded-lg border border-border-light bg-[#F8F9FA] py-1.5 pl-8 pr-2.5 text-sm outline-none transition-all focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-brand/10"
                  />
                </div>
              </div>

              {activeTab === "email" && (
                <>
                  {isLoading ? (
                    <div className="px-4 py-4 sm:px-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="rounded-lg border border-border-light bg-white p-5">
                            <div className="h-4 w-2/3 bg-[#F0F1F3] rounded mb-3" />
                            <div className="h-3 w-full bg-[#F8F9FA] rounded mb-2" />
                            <div className="h-3 w-1/2 bg-[#F8F9FA] rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-text-muted" />
                      <p className="text-sm text-text-secondary">{error}</p>
                      <button onClick={fetchTemplates} className="text-sm font-medium text-brand hover:underline">Retry</button>
                    </div>
                  ) : !templates || templates.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light">
                        <FileText className="h-8 w-8 text-brand" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-text-primary">No email templates yet</h3>
                      <p className="mt-1 text-sm text-text-secondary max-w-xs">
                        Create your first email template to speed up your outreach campaigns.
                      </p>
                      <button
                        onClick={handleCreate}
                        className="mt-4 flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90"
                      >
                        <Plus size={12} />
                        Create Template
                      </button>
                    </div>
                  ) : (filteredTemplates || []).length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light">
                        <FileText className="h-8 w-8 text-brand" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-text-primary">No matching templates</h3>
                      <p className="mt-1 text-sm text-text-secondary max-w-xs">Try adjusting your search query.</p>
                    </div>
                  ) : (
                    <div className="px-4 py-4 sm:px-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(filteredTemplates || []).map((template) => (
                          <div
                            key={template.id}
                            className="group relative rounded-lg border border-border-light bg-white p-5 transition-all hover:shadow-premium-sm hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-text-primary truncate">{template.name}</h3>
                                {template.isSystem && (
                                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[9px] font-semibold text-brand">
                                    Default
                                  </span>
                                )}
                              </div>
                              {!template.isSystem && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                  <button
                                    onClick={() => handleEdit(template)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-brand"
                                    aria-label={`Edit ${template.name}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(template)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-error-bg hover:text-error-text"
                                    aria-label={`Delete ${template.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary truncate mb-3">{template.subject || "No subject"}</p>
                            <p className="text-[11px] text-text-muted truncate mb-3">{stripHtml(template.body).slice(0, 80) || "No content"}</p>
                            <p className="text-[11px] text-text-muted">
                              {template.isSystem ? "Default template" : `Updated ${formatDate(template.updatedAt)}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "followup" && (
                <div className="px-4 py-4 sm:px-6">
                  {followUpError ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <Route className="h-8 w-8 text-text-muted" />
                      <p className="text-sm text-text-secondary">{followUpError}</p>
                      <button onClick={() => { setFollowUpError(null); fetchFollowUpTemplates(); }} className="text-sm font-medium text-brand hover:underline">Retry</button>
                    </div>
                  ) : followUpTemplates.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light">
                        <Route className="h-8 w-8 text-brand" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-text-primary">No follow-up templates yet</h3>
                      <p className="mt-1 text-sm text-text-secondary max-w-xs">
                        Build reusable sequence structures to import in your campaigns.
                      </p>
                      <button
                        onClick={openNewFollowUp}
                        className="mt-4 flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90"
                      >
                        <Plus size={12} />
                        Create Follow-up Template
                      </button>
                    </div>
                  ) : filteredFollowUps.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light">
                        <Route className="h-8 w-8 text-brand" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-text-primary">No matching follow-up templates</h3>
                      <p className="mt-1 text-sm text-text-secondary max-w-xs">Try adjusting your search query.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredFollowUps.map((template) => (
                        <div key={template.id} className="group relative rounded-lg border border-border-light bg-white p-5 transition-all hover:shadow-premium-sm hover:-translate-y-0.5">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-text-primary truncate">{template.name}</h3>
                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[9px] font-semibold text-brand">
                                  <Clock className="h-2.5 w-2.5" />{template.steps.length} steps
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                              <button
                                onClick={() => openEditFollowUp(template)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-brand"
                                aria-label={`Edit ${template.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteFollowUpTarget(template)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-error-bg hover:text-error-text"
                                aria-label={`Delete ${template.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {template.description && (
                            <p className="text-[11px] text-text-muted mt-2 line-clamp-2">{template.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

        {formOpen && (
          <TemplateFormModal
            template={editingTemplate}
            onClose={() => {
              setFormOpen(false);
              setEditingTemplate(null);
            }}
            onSuccess={handleFormSuccess}
          />
        )}

        {deleteTarget && (
          <Modal isOpen onClose={() => setDeleteTarget(null)}>
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg">
                <Trash2 className="h-5 w-5 text-error-text" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Delete template?</h3>
              <p className="text-sm text-text-secondary mb-5">
                &ldquo;{deleteTarget.name}&rdquo; will be permanently removed. This
                won&apos;t affect any campaigns already sent.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-lg border border-border-light bg-white px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-error-text px-4 py-2 text-xs font-medium text-white transition-all hover:bg-error-text/90 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {deleteFollowUpTarget && (
          <Modal isOpen onClose={() => setDeleteFollowUpTarget(null)}>
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg">
                <Trash2 className="h-5 w-5 text-error-text" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Delete follow-up template?</h3>
              <p className="text-sm text-text-secondary mb-5">
                &ldquo;{deleteFollowUpTarget.name}&rdquo; will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteFollowUpTarget(null)}
                  className="flex-1 rounded-lg border border-border-light bg-white px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFollowUpConfirm}
                  className="flex-1 rounded-lg bg-error-text px-4 py-2 text-xs font-medium text-white transition-all hover:bg-error-text/90"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </ErrorBoundary>
    </AuthGuard>
  );
}

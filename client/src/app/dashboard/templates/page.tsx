"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getTemplates, deleteTemplate as deleteTemplateApi } from "@/lib/apis";
import type { EmailTemplate } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { SidebarProvider } from "@/context/SidebarContext";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import TemplateFormModal from "./TemplateFormModal";
import { cn } from "@/lib/utils";
import type { FollowUpTemplate } from "@/types";
import { deleteFollowUpTemplate, listFollowUpTemplates } from "@/lib/followUpTemplates";
import {
  AlertCircle,
  Inbox,
  Clock,
  Send,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Star,
  Search,
  X,
  Route,
} from "lucide-react";

type Tab = "email" | "followup";

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("email");
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("Templates");
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [followUpTemplates, setFollowUpTemplates] = useState<FollowUpTemplate[]>([]);
  const [followUpSearchQuery, setFollowUpSearchQuery] = useState("");

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
    try {
      const data = await listFollowUpTemplates();
      setFollowUpTemplates(data);
    } catch {
      addToast("error", "Failed to load follow-up templates");
    }
  }, [addToast]);

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

  const removeFollowUp = async (template: FollowUpTemplate) => {
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
      (template.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <AuthGuard requirePremium={true}>
      <SidebarProvider>
        <div className="flex h-screen bg-[#f9fafb]">
          <Sidebar
            setLabel={setLabel}
            profile={{
              name: user?.name ?? "",
              email: user?.email ?? "",
              avatarUrl: user?.avatarUrl ?? "",
            }}
            items={[
              { label: "All", icon: <Inbox className="h-4 w-4" /> },
              { label: "Scheduled", icon: <Clock className="h-4 w-4" /> },
              { label: "Sent", icon: <Send className="h-4 w-4" /> },
            ]}
          />

          <main className="flex flex-1 flex-col min-w-0">
            <TopBar
              placeholder={activeTab === "email" ? "Search email templates..." : "Search follow-up templates..."}
              initialValue={activeTab === "email" ? searchQuery : followUpSearchQuery}
              onSearch={(q) => activeTab === "email" ? setSearchQuery(q) : setFollowUpSearchQuery(q)}
            />

            <div className="px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Templates</h1>
              </div>
              <Button
                className="w-auto px-4 py-2 rounded-lg text-xs gap-1.5"
                onClick={activeTab === "email" ? handleCreate : openNewFollowUp}
              >
                <Plus className="h-3.5 w-3.5" />
                {activeTab === "email" ? "New Template" : "New Follow-up Template"}
              </Button>
            </div>

            <div className="px-3 md:px-6 pb-3">
              <div className="flex gap-1 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("email")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    activeTab === "email"
                      ? "border-[#00A63E] text-[#00A63E]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  Email Templates
                  {templates && (
                    <span className="ml-1.5 text-xs text-gray-400">({templates.length})</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("followup")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    activeTab === "followup"
                      ? "border-[#00A63E] text-[#00A63E]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  Follow-up Templates
                  <span className="ml-1.5 text-xs text-gray-400">({followUpTemplates.length})</span>
                </button>
              </div>
            </div>

            {activeTab === "email" && (
              <>
                {isLoading ? (
                  <div className="flex-1 px-3 md:px-6 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-xl bg-white border border-gray-100 p-5">
                          <div className="h-4 w-2/3 bg-gray-100 rounded mb-3" />
                          <div className="h-3 w-full bg-gray-50 rounded mb-2" />
                          <div className="h-3 w-1/2 bg-gray-50 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="h-8 w-8 text-red-300" />
                    <p className="text-sm text-gray-500">{error}</p>
                    <button onClick={fetchTemplates} className="text-sm text-[#00A63E] hover:underline">Retry</button>
                  </div>
                ) : !templates || templates.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No email templates yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-4">
                      Create your first email template to speed up your outreach campaigns.
                    </p>
                    <Button className="w-auto px-5 py-2 rounded-lg text-xs" onClick={handleCreate}>
                      Create Template
                    </Button>
                  </div>
                ) : (filteredTemplates || []).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No matching templates</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-4">Try adjusting your search query.</p>
                  </div>
                ) : (
                  <div className="flex-1 px-3 md:px-6 pb-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(filteredTemplates || []).map((template) => (
                        <div key={template.id}
                          className={cn(
                            "group rounded-xl bg-white border p-5 shadow-sm transition-all duration-200",
                            template.isSystem ? "border-amber-100 hover:border-amber-200" : "border-gray-100 hover:shadow-md hover:-translate-y-0.5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h3>
                              {template.isSystem && (
                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-600">
                                  <Star className="h-2.5 w-2.5" /> Default
                                </span>
                              )}
                            </div>
                            {!template.isSystem && (
                              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                                <button onClick={() => handleEdit(template)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-[#00A63E] hover:bg-[#E8F8ED] transition-colors"
                                  aria-label={`Edit ${template.name}`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeleteTarget(template)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  aria-label={`Delete ${template.name}`}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-3">{template.subject || "No subject"}</p>
                          <p className="text-[11px] text-gray-500 truncate mb-3">{stripHtml(template.body).slice(0, 80) || "No content"}</p>
                          <p className="text-[11px] text-gray-500">{template.isSystem ? "Default template" : `Updated ${formatDate(template.updatedAt)}`}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "followup" && (
              <div className="flex-1 px-3 md:px-6 pb-4 overflow-y-auto">
                {followUpTemplates.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-gray-50 border border-gray-200 flex-1 max-w-xs">
                      <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <input value={followUpSearchQuery} onChange={(e) => setFollowUpSearchQuery(e.target.value)}
                        placeholder="Search follow-up templates..."
                        className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder:text-gray-400" />
                      {followUpSearchQuery && (
                        <button onClick={() => setFollowUpSearchQuery("")} className="p-0.5 text-gray-400 hover:text-gray-600">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {followUpTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center px-6 h-full">
                    <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <Route className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No follow-up templates yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-4">
                      Build reusable sequence structures to import in your campaigns.
                    </p>
                    <Button className="w-auto px-5 py-2 rounded-lg text-xs" onClick={openNewFollowUp}>
                      Create Follow-up Template
                    </Button>
                  </div>
                ) : filteredFollowUps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center px-6 h-full">
                    <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <Route className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No matching follow-up templates</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-4">Try adjusting your search query.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredFollowUps.map((template) => (
                      <div key={template.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                            <p className="text-[11px] text-gray-500">{template.steps.length} steps</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditFollowUp(template)} className="p-1.5 rounded text-gray-500 hover:text-[#00A63E] hover:bg-[#E8F8ED]">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => removeFollowUp(template)} className="p-1.5 rounded text-gray-500 hover:text-red-500 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {template.description && (
                          <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
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
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Delete template?</h3>
              <p className="text-sm text-gray-500 mb-5">
                &ldquo;{deleteTarget.name}&rdquo; will be permanently removed. This
                won&apos;t affect any campaigns already sent.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 rounded-lg" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1 rounded-lg" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </SidebarProvider>
    </AuthGuard>
  );
}

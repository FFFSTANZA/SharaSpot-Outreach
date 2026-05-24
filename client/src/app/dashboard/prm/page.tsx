"use client";

import { Suspense } from "react";
import { Sidebar } from "../Sidebar";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getContacts,
  deleteContact,
  bulkDeleteContacts,
  getTags,
  removeContactsFromList,
  runPrmBulkAction,
  undoPrmBulkAction,
  getContactLists,
  exportContacts,
} from "@/lib/apis";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { ContactList } from "./ContactList";
import { ContactDetails } from "./ContactDetails";
import { ContactModal } from "./ContactModal";
import ImportModal from "./ImportModal";
import ContactListsSidebar from "./ContactListsSidebar";
import AddToListModal from "./AddToListModal";
import type { Contact, Tag, PaginatedContacts } from "@/types";
import {
  Search,
  FileText,
  Download,
  Inbox,
  Star,
  Clock,
  Send,
  Trash2,
  UserPlus,
  FolderPlus,
  X,
  Wand2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: unknown } }).response?.data &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message: string } } }).response!.data!.message;
  }
  return fallback;
};

export default function PRMPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><InlineLoader message="Loading contacts..." /></div>}>
      <PRMPage />
    </Suspense>
  );
}

function PRMPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentStageFilter, setCurrentStageFilter] = useState<string>("ALL");
  const [refreshListsTrigger, setRefreshListsTrigger] = useState(0);
  const [undoToken, setUndoToken] = useState<string | null>(null);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  const STAGES = ["ALL", "COLD", "WARM", "HOT", "REPLIED", "CONVERTED", "BOUNCED"];

  const fetchContacts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data: PaginatedContacts = await getContacts({
        search: searchQuery,
        stage: currentStageFilter === "ALL" ? undefined : currentStageFilter,
        listId: selectedListId,
        page,
      });
      setContacts(data.contacts);
      setTotalPages(data.totalPages);
      setTotalContacts(data.total);
      setCurrentPage(data.page);
    } catch {
      addToast("error", "Failed to fetch contacts");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentStageFilter, selectedListId, addToast]);

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch {}
  }, []);
  const fetchLists = useCallback(async () => {
    try {
      const data = await getContactLists();
      setLists(data);
    } catch {}
  }, []);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    void fetchContacts(page);
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSelectedContactId(null);
    void fetchContacts(1);
  }, [searchQuery, currentStageFilter, selectedListId, fetchContacts]);

  useEffect(() => {
    fetchTags();
    fetchLists();
  }, [fetchTags, fetchLists]);

  const handleCreateContact = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContact(id);
      addToast("success", "Contact deleted");
      void fetchContacts(currentPage);
      if (selectedContactId === id) setSelectedContactId(null);
    } catch {
      addToast("error", "Failed to delete contact");
    }
  };

  const runBulkAndTrackUndo = async (payload: Parameters<typeof runPrmBulkAction>[0], success: string) => {
    try {
      const result = await runPrmBulkAction(payload);
      setUndoToken(result.undoToken);
      setSelectedIds(new Set());
      addToast("success", success);
      await fetchContacts(currentPage);
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Bulk action failed"));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;
    try {
      await bulkDeleteContacts(Array.from(selectedIds));
      addToast("success", "Contacts deleted");
      setSelectedIds(new Set());
      void fetchContacts(currentPage);
    } catch {
      addToast("error", "Failed to delete contacts");
    }
  };

  return (
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-[#F8FAFC] font-sans">
            <Sidebar
              currentLabel="Contacts"
              setLabel={() => {}}
              profile={{
                name: user?.name ?? "Outreach Pro",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
              items={[
                { label: "All", icon: <Inbox size={18} /> },
                { label: "Starred", icon: <Star size={18} /> },
                { label: "Scheduled", icon: <Clock size={18} /> },
                { label: "Sent", icon: <Send size={18} /> },
              ]}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-4 px-4">
              <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
                  <div className="px-6 py-4 border-b border-border-light bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Contacts</h1>
                      <p className="text-sm text-text-muted font-medium">Manage your contacts and relationships.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await exportContacts({
                              search: searchQuery,
                              stage: currentStageFilter === "ALL" ? undefined : currentStageFilter,
                              listId: selectedListId,
                            });
                            addToast("success", "Contacts exported");
                          } catch {
                            addToast("error", "Failed to export contacts");
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-border-light text-text-secondary rounded-xl text-sm font-semibold hover:bg-background transition-all"
                      >
                        <Download size={16} />
                        <span>Export</span>
                      </button>
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-border-light text-text-secondary rounded-xl text-sm font-semibold hover:bg-background transition-all"
                      >
                        <FileText size={16} />
                        <span>Import</span>
                      </button>
                      <button
                        onClick={handleCreateContact}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-all"
                      >
                        <UserPlus size={16} />
                        <span>Add Contact</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input
                        type="text"
                        placeholder="Search by name, email, company, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search contacts"
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border-light rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                      />
                    </div>
                    <div className="flex items-center bg-background p-1 rounded-xl border border-border-light">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setCurrentStageFilter(s)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                            currentStageFilter === s
                              ? "bg-white text-brand shadow-sm border border-border-light"
                              : "text-text-muted hover:text-text-secondary"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <aside className="w-64 border-r border-border-light bg-white flex flex-col shrink-0 hidden md:flex">
                    <ContactListsSidebar
                      selectedListId={selectedListId}
                      onSelectList={setSelectedListId}
                      refreshKey={refreshListsTrigger}
                    />
                  </aside>

                  <div className={`flex-1 flex flex-col min-w-0 ${selectedContactId ? "hidden lg:flex" : "flex"}`}>
                    {isLoading && contacts.length === 0 ? (
                      <InlineLoader message="Loading your relationships..." />
                    ) : (
                      <>
                        <ContactList
                          contacts={contacts}
                          selectedId={selectedContactId}
                          onSelect={setSelectedContactId}
                          onEdit={(contact) => {
                            setEditingContact(contact);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDeleteContact}
                          selectedIds={selectedIds}
                          setSelectedIds={setSelectedIds}
                        />
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-6 py-3 border-t border-border-light bg-white shrink-0">
                            <span className="text-xs text-text-muted">
                              {totalContacts} contact{totalContacts !== 1 ? "s" : ""} — Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage <= 1}
                                className="p-1.5 rounded-lg hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronsLeft size={16} />
                              </button>
                              <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="p-1.5 rounded-lg hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                                const p = start + i;
                                if (p > totalPages) return null;
                                return (
                                  <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                                      p === currentPage
                                        ? "bg-brand text-white"
                                        : "hover:bg-background text-text-secondary"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="p-1.5 rounded-lg hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronRight size={16} />
                              </button>
                              <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="p-1.5 rounded-lg hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronsRight size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {selectedContactId && (
                    <div className="w-full lg:w-[500px] border-l border-border-light bg-white flex flex-col animate-in slide-in-from-right duration-300">
                      <ContactDetails
                        contactId={selectedContactId}
                        onClose={() => setSelectedContactId(null)}
                        onUpdate={() => {
                          void fetchContacts(currentPage);
                        }}
                      />
                    </div>
                  )}
                </div>

                {selectedIds.size > 0 && (
                  <div className="sticky bottom-0 bg-white border-t border-border-light p-3 flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-widest mr-2">{selectedIds.size} selected</span>
                    {STAGES.filter((s) => s !== "ALL").map((s) => (
                      <button key={s} className="text-xs px-2 py-1 rounded border" onClick={() => runBulkAndTrackUndo({ actionType: "update_stage", contactIds: Array.from(selectedIds), stage: s }, `Updated to ${s}`)}>{s}</button>
                    ))}
                    <select className="text-xs px-2 py-1 rounded border" value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)}>
                      <option value="">Select tag</option>
                      {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                    </select>
                    <button
                      onClick={() => selectedTagId && runBulkAndTrackUndo({ actionType: "add_tag", contactIds: Array.from(selectedIds), tagId: selectedTagId }, "Tag added")}
                      className="text-xs px-2 py-1 rounded border"
                    >
                      Add Tag
                    </button>
                    <button
                      onClick={() => selectedTagId && runBulkAndTrackUndo({ actionType: "remove_tag", contactIds: Array.from(selectedIds), tagId: selectedTagId }, "Tag removed")}
                      className="text-xs px-2 py-1 rounded border"
                    >
                      Remove Tag
                    </button>
                    <select className="text-xs px-2 py-1 rounded border" onChange={(e) => e.target.value && runBulkAndTrackUndo({ actionType: "add_to_list", contactIds: Array.from(selectedIds), listId: e.target.value }, "Added to list")} defaultValue="">
                      <option value="">Add to list...</option>
                      {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select>
                    <button onClick={() => setIsAddToListModalOpen(true)} className="flex items-center gap-1 text-xs px-2 py-1 rounded border"><FolderPlus size={12} /> Add to List</button>
                    <button onClick={() => {
                      const selectedEmails = contacts.filter((c) => selectedIds.has(c.id)).map((c) => c.email).join(",");
                      window.location.href = `/dashboard/compose?emails=${encodeURIComponent(selectedEmails)}`;
                    }} className="flex items-center gap-1 text-xs px-2 py-1 rounded border"><Send size={12} /> Compose</button>
                    {selectedListId && (
                      <button
                        onClick={async () => {
                          if (confirm(`Remove ${selectedIds.size} contacts from this list?`)) {
                            try {
                              await removeContactsFromList(selectedListId, Array.from(selectedIds));
                              setSelectedIds(new Set());
                              void fetchContacts(currentPage);
                              setRefreshListsTrigger((prev) => prev + 1);
                              addToast("success", "Contacts removed from list");
                            } catch {
                              addToast("error", "Failed to remove contacts");
                            }
                          }
                        }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border"
                      >
                        <X size={12} /> Remove
                      </button>
                    )}
                    <button onClick={handleBulkDelete} className="flex items-center gap-1 text-xs px-2 py-1 rounded border text-error-text"><Trash2 size={12} /> Delete</button>
                  </div>
                )}
                {undoToken && (
                  <div className="sticky bottom-0 bg-white border-t border-border-light p-3 flex items-center justify-end">
                    <button
                      onClick={async () => {
                        try {
                          await undoPrmBulkAction(undoToken);
                          setUndoToken(null);
                          await fetchContacts(currentPage);
                          addToast("success", "Last action undone");
                        } catch (error: unknown) {
                          addToast("error", getApiErrorMessage(error, "Failed to undo action"));
                        }
                      }}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700"
                    >
                      <Wand2 size={12} /> Undo Last Action
                    </button>
                  </div>
                )}
              </div>
            </main>
          </div>

          <ContactModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            contact={editingContact}
            tags={tags}
            onSuccess={() => {
              setIsModalOpen(false);
              void fetchContacts(currentPage);
            }}
          />

          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={() => {
              void fetchContacts(currentPage);
            }}
          />

          <AddToListModal
            isOpen={isAddToListModalOpen}
            onClose={() => setIsAddToListModalOpen(false)}
            selectedContactIds={Array.from(selectedIds)}
            onSuccess={async () => {
              setSelectedIds(new Set());
              void fetchContacts(currentPage);
              setRefreshListsTrigger((prev) => prev + 1);
            }}
          />
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}

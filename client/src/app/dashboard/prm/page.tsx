"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getContacts,
  bulkDeleteContacts,
  getTags,
  createTag,
  runPrmBulkAction,
  undoPrmBulkAction,
  getContactLists,
  exportContacts,
  getCompanies,
  createCompany,
  ContactList as ContactListType,
} from "@/lib/apis";
import { getCurrentOrganization } from "@/lib/apis/organizations";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { ContactList } from "./ContactList";
import { ContactDetails } from "./ContactDetails";
import { ContactModal } from "./ContactModal";
import ImportModal from "./ImportModal";
import AddToListModal from "./AddToListModal";
import ContactListsSidebar from "./ContactListsSidebar";

import CompanyCreateModal from "./CompanyCreateModal";
import { useSidebar } from "@/hooks/useSidebar";
import type { CompanyProfile, Contact, OrgMember, Tag, PaginatedContacts } from "@/types";
import {
  Menu,
  Search,
  FileText,
  Download,
  Send,
  Trash2,
  UserPlus,
  Folder,

  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowDownUp,
  PanelLeft,
  CircleDot,
  Building2,
  Plus,
  Check,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { RELATIONSHIP_STAGES, getStageLabel } from "./prmFields";
import { getSmartViewCount, matchesSmartView, sortContacts, type SmartView, type SortMode } from "./prmInsights";

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

const getCompanyName = (company?: string | null) => company?.trim() || "No company";

type CompanyRow = {
  name: string;
  count: number;
  profileId?: string;
  website?: string | null;
  domain?: string | null;
  email?: string | null;
};

export default function PRMPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><InlineLoader message="Loading contacts..." /></div>}>
      <PRMPage />
    </Suspense>
  );
}

function PRMPage() {
  const { addToast } = useToast();
  const { toggle } = useSidebar();
  const router = useRouter();
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
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentStageFilter, setCurrentStageFilter] = useState<string>("ALL");
  const [refreshListsTrigger, setRefreshListsTrigger] = useState(0);
  const [undoToken, setUndoToken] = useState<string | null>(null);
  const [lists, setLists] = useState<ContactListType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [viewMode, setViewMode] = useState<"contacts" | "companies">("contacts");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [smartView, setSmartView] = useState<SmartView>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const STAGES = [{ value: "ALL", label: "All" }, ...RELATIONSHIP_STAGES];
  const fetchContacts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data: PaginatedContacts = await getContacts({
        search: searchQuery,
        stage: currentStageFilter === "ALL" ? undefined : currentStageFilter,
        listId: selectedListId,
        page,
      });
      setContacts(data.contacts ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalContacts(data.total ?? 0);
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
  const fetchMembers = useCallback(async () => {
    try {
      const org = await getCurrentOrganization();
      setMembers(org?.members ?? []);
    } catch {}
  }, []);
  const fetchCompanies = useCallback(async () => {
    try {
      const data = await getCompanies();
      setCompanyProfiles(data);
    } catch {}
  }, []);

  const visibleContacts = useMemo(() => {
    const filtered = contacts.filter((contact) => matchesSmartView(contact, smartView));
    const sorted = sortContacts(filtered, sortMode);
    if (viewMode === "companies" && sortMode !== "company") {
      return sortContacts(sorted, "company");
    }
    return sorted;
  }, [contacts, smartView, sortMode, viewMode]);

  const smartViewCounts = useMemo(() => ({
    actionQueue: getSmartViewCount(contacts, "action_queue"),
    overdue: getSmartViewCount(contacts, "overdue"),
    unassigned: getSmartViewCount(contacts, "unassigned"),
    meetings: getSmartViewCount(contacts, "meetings"),
  }), [contacts]);

  const companyRows = useMemo<CompanyRow[]>(() => {
    const rows = new Map<string, CompanyRow>();

    visibleContacts.forEach((contact) => {
      const name = getCompanyName(contact.company);
      const domainKey = (contact.companyDomain || "").trim().toLowerCase();
      const nameKey = name.trim().toLowerCase();
      const key = domainKey || nameKey;
      if (!key) return;
      const existing = rows.get(key);
      rows.set(key, {
        name,
        count: (existing?.count ?? 0) + 1,
        profileId: existing?.profileId,
        website: existing?.website ?? contact.website ?? null,
        domain: existing?.domain ?? contact.companyDomain ?? null,
        email: existing?.email ?? contact.email,
      });
    });

    companyProfiles.forEach((profile) => {
      const domainKey = (profile.domain || "").trim().toLowerCase();
      const nameKey = profile.name.trim().toLowerCase();
      const key = domainKey || nameKey;
      if (!key) return;

      const matchesSearch = !searchQuery.trim() || [profile.name, profile.domain, profile.website, profile.primaryEmail]
        .some((value) => value?.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      if (!matchesSearch) return;

      let existing = rows.get(key);
      if (!existing && domainKey) {
        existing = rows.get(domainKey);
      }

      rows.set(key, {
        name: profile.name,
        count: existing?.count ?? profile.relatedContactCount ?? 0,
        profileId: profile.id,
        website: profile.website ?? existing?.website ?? null,
        domain: profile.domain,
        email: profile.primaryEmail ?? existing?.email ?? null,
      });
    });

    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [companyProfiles, searchQuery, visibleContacts]);

  const displayedContacts = useMemo(() => {
    if (viewMode !== "companies" || !selectedCompany) return visibleContacts;
    return visibleContacts.filter((contact) => getCompanyName(contact.company) === selectedCompany);
  }, [selectedCompany, viewMode, visibleContacts]);

  const showingCompanyIndex = viewMode === "companies" && !selectedCompany;

  const handleSmartViewToggle = (value: SmartView) => {
    setSmartView((current) => current === value ? "all" : value);
  };

  const handleViewModeChange = (mode: "contacts" | "companies") => {
    setViewMode(mode);
    setSelectedContactId(null);
    setSelectedIds(new Set());
    if (mode !== "companies") {
      setSelectedCompany(null);
    }
  };

  const handleSelectCompany = (company: string) => {
    setSelectedCompany(company);
    setSelectedContactId(null);
    setSelectedIds(new Set());
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setSelectedContactId(null);
    setSelectedIds(new Set());
  };

  const openCompanyProfile = async (company: CompanyRow) => {
    if (company.profileId) {
      router.push(`/dashboard/prm/companies/${company.profileId}`);
      return;
    }

    try {
      const created = await createCompany({
        name: company.name,
        website: company.website ?? "",
        email: company.email ?? "",
      });
      await fetchCompanies();
      addToast("success", "Company profile created");
      router.push(`/dashboard/prm/companies/${created.id}`);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, "Failed to create company profile"));
    }
  };

  const handleCreateCompany = async (payload: { name: string; website: string; email: string }) => {
    try {
      const created = await createCompany(payload);
      setIsCompanyModalOpen(false);
      await fetchCompanies();
      addToast("success", "Company profile created");
      router.push(`/dashboard/prm/companies/${created.id}`);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, "Failed to create company profile"));
      throw error;
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    void fetchContacts(page);
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSelectedContactId(null);
    setSelectedCompany(null);
    void fetchContacts(1);
  }, [searchQuery, currentStageFilter, selectedListId, fetchContacts]);

  useEffect(() => {
    fetchTags();
    fetchLists();
    fetchMembers();
    fetchCompanies();
  }, [fetchCompanies, fetchTags, fetchLists, fetchMembers]);

  const handleCreateContact = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const runBulkAndTrackUndo = async (payload: Parameters<typeof runPrmBulkAction>[0], success: string) => {
    try {
      const result = await runPrmBulkAction(payload);
      setUndoToken(result.undoToken);
      setSelectedIds(new Set());
      addToast("success", success);
      await fetchContacts(currentPage);
      setRefreshListsTrigger(n => n + 1);
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

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      await createTag(name, "#3B82F6");
      setNewTagName("");
      setIsCreatingTag(false);
      await fetchTags();
      addToast("success", "Tag created");
    } catch {
      addToast("error", "Failed to create tag");
    }
  };

  return (
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
          <div className="flex-1 flex min-w-0 overflow-hidden">
            <div className="mx-auto w-full max-w-[1600px] flex grow flex-col overflow-hidden rounded-lg border border-border-light bg-white">
                <div className="shrink-0 border-b border-border-light px-4 py-3 sm:px-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggle}
                          aria-label="Open sidebar"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
                        >
                          <Menu size={14} />
                        </button>
                        <h1 className="text-base font-semibold text-text-primary">Relationships</h1>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsListsOpen(true)}
                          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary min-[1120px]:hidden"
                        >
                          <PanelLeft size={12} />
                          Lists
                        </button>
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
                          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                        >
                          <Download size={12} />
                          Export
                        </button>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                        >
                          <FileText size={12} />
                          Import
                        </button>
                        {viewMode === "companies" && (
                          <button
                            onClick={() => setIsCompanyModalOpen(true)}
                            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                          >
                            <Building2 size={12} />
                            New company
                          </button>
                        )}
                        <button
                          onClick={handleCreateContact}
                          className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90"
                        >
                          <UserPlus size={12} />
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                          type="text"
                          placeholder="Search people, companies, domains, tech..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          aria-label="Search contacts"
                          className="w-full rounded-lg border border-border-light bg-[#F8F9FA] py-1.5 pl-8 pr-2.5 text-sm outline-none transition-all focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-brand/10"
                        />
                      </div>
                      <button
                        onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                        className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all", isFiltersCollapsed ? "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary" : "bg-brand-light text-brand")}
                      >
                        <ChevronDown size={12} className={cn("transition-transform", !isFiltersCollapsed && "rotate-180")} />
                        Filters
                      </button>
                    </div>

                    {!isFiltersCollapsed && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1">
                            {[
                              { value: "action_queue" as const, label: "Action queue", count: smartViewCounts.actionQueue },
                              { value: "overdue" as const, label: "Overdue", count: smartViewCounts.overdue },
                              { value: "unassigned" as const, label: "Unassigned", count: smartViewCounts.unassigned },
                              { value: "meetings" as const, label: "Meetings list", count: smartViewCounts.meetings },
                            ].map(({ value, label, count }) => (
                              <button
                                key={value}
                                onClick={() => handleSmartViewToggle(value)}
                                className={cn("h-7 rounded-md px-2 font-medium transition-all",
                                  smartView === value
                                    ? "bg-brand-light text-brand"
                                  : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary"
                              )}
                            >
                              {label}
                              {count > 0 && (
                                <span className="ml-1 font-semibold text-brand">{count}</span>
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="h-4 w-px bg-border-light" />

                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Sort</span>
                          <div className="flex h-7 items-center gap-1 rounded-md bg-[#F8F9FA] px-2 text-text-secondary">
                            <ArrowDownUp size={11} className="shrink-0" />
                            <select
                              value={sortMode}
                              onChange={(e) => setSortMode(e.target.value as SortMode)}
                              className="bg-transparent outline-none"
                              aria-label="Sort contacts"
                            >
                              <option value="recent">Recent</option>
                              <option value="priority">Priority</option>
                              <option value="last_touched">Last touched</option>
                              <option value="engagement">Engagement</option>
                              <option value="company">Company</option>
                            </select>
                          </div>
                        </div>

                        <div className="h-4 w-px bg-border-light" />

                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Stage</span>
                          <div className="flex items-center gap-0.5">
                            {STAGES.map((s) => (
                              <button
                                key={s.value}
                                onClick={() => setCurrentStageFilter(s.value)}
                                className={cn("h-7 rounded-md px-2 font-medium transition-all", currentStageFilter === s.value ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary")}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="h-4 w-px bg-border-light" />

                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">View</span>
                          <button onClick={() => handleViewModeChange("contacts")} className={cn("h-7 rounded-md px-2 font-medium transition-all", viewMode === "contacts" ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary")}>Contacts</button>
                          <button onClick={() => handleViewModeChange("companies")} className={cn("h-7 rounded-md px-2 font-medium transition-all", viewMode === "companies" ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary")}>Companies</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex min-w-0 overflow-hidden">
                  <aside className={`relative hidden shrink-0 border-r border-border-light bg-white transition-all duration-300 min-[1120px]:flex min-[1120px]:flex-col ${isSidebarCollapsed ? 'w-12' : 'w-48'}`}>
                    {isSidebarCollapsed ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <button
                          onClick={() => setIsSidebarCollapsed(false)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-brand transition-colors"
                          title="Expand lists"
                        >
                          <PanelLeft size={16} className="rotate-180" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between border-b border-border-light px-2 py-1.5">
                          <span className="px-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">Lists</span>
                          <button
                            onClick={() => setIsSidebarCollapsed(true)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background hover:text-brand"
                            title="Collapse sidebar"
                          >
                            <PanelLeft size={14} />
                          </button>
                        </div>
                        <ContactListsSidebar
                          selectedListId={selectedListId}
                          onSelectList={setSelectedListId}
                          refreshKey={refreshListsTrigger}
                        />
                      </>
                    )}
                  </aside>

                  <div className={`flex-1 flex flex-col min-w-0 ${selectedContactId ? "hidden min-[1240px]:flex" : "flex"}`}>
                    {selectedIds.size > 0 && (
                      <div className="sticky top-0 z-20 border-b border-border-light bg-white">
                        <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-brand-light px-1.5 py-0.5 text-xs font-semibold text-brand">{selectedIds.size} selected</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const selectedEmails = contacts.filter((c) => selectedIds.has(c.id)).map((c) => c.email).join(",");
                                window.location.href = `/dashboard/compose?emails=${encodeURIComponent(selectedEmails)}`;
                              }}
                              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3] hover:text-brand"
                            >
                              <Send size={12} /> Compose
                            </button>
                            <button
                              onClick={() => setIsAddToListModalOpen(true)}
                              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3]"
                            >
                              <Folder size={12} /> Add to List
                            </button>
                            <button
                              onClick={handleBulkDelete}
                              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-error-bg hover:text-error-text"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                            <button
                              onClick={() => setSelectedIds(new Set())}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3]"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="border-t border-border-light bg-[#F8F9FA]">
                          <div className="flex items-center gap-2 px-4 py-1.5 sm:px-6">
                            <span className="text-[11px] font-medium text-text-muted">Stage</span>
                            {STAGES.filter((s) => s.value !== "ALL").map((s) => (
                              <button
                                key={s.value}
                                className="h-7 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-white hover:text-text-primary"
                                onClick={() => runBulkAndTrackUndo({ actionType: "update_stage", contactIds: Array.from(selectedIds), stage: s.value }, `Updated to ${getStageLabel(s.value)}`)}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 border-t border-border-light px-4 py-1.5 sm:px-6">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-text-muted">Tag</span>
                              <select
                                className="h-7 rounded-md bg-white px-2 text-xs text-text-secondary outline-none transition-all hover:border hover:border-border-light"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    runBulkAndTrackUndo({ actionType: "add_tag", contactIds: Array.from(selectedIds), tagId: e.target.value }, "Tag added");
                                    e.target.value = "";
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Add...</option>
                                {tags.length === 0 && <option value="" disabled>No tags</option>}
                                {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                              </select>
                              {isCreatingTag ? (
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateTag(); if (e.key === "Escape") { setIsCreatingTag(false); setNewTagName(""); } }}
                                    placeholder="Tag name"
                                    autoFocus
                                    className="h-7 w-28 rounded-md border border-border-light bg-white px-2 text-xs outline-none"
                                  />
                                  <button onClick={handleCreateTag} disabled={!newTagName.trim()} className="flex h-6 w-6 items-center justify-center rounded text-brand hover:bg-brand/5 disabled:opacity-30">
                                    <Check size={11} />
                                  </button>
                                  <button onClick={() => { setIsCreatingTag(false); setNewTagName(""); }} className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-[#F0F1F3]">
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setIsCreatingTag(true)} className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-all hover:bg-[#F0F1F3] hover:text-brand" title="Create tag">
                                  <Plus size={11} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-text-muted">List</span>
                              <select
                                className="h-7 rounded-md bg-white px-2 text-xs text-text-secondary outline-none transition-all hover:border hover:border-border-light"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    runBulkAndTrackUndo({ actionType: "add_to_list", contactIds: Array.from(selectedIds), listId: e.target.value }, "Added to list");
                                    e.target.value = "";
                                  }
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Add...</option>
                                {lists.length === 0 && <option value="" disabled>No lists</option>}
                                {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {undoToken && (
                      <div className="sticky top-0 z-20 border-b border-border-light bg-white">
                        <div className="flex items-center justify-between px-4 py-2 sm:px-6">
                          <span className="text-xs text-text-muted">Bulk action completed.</span>
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
                            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-brand transition-all hover:bg-brand-light"
                          >
                            <CircleDot size={12} /> Undo
                          </button>
                        </div>
                      </div>
                    )}
                    {isLoading && contacts.length === 0 ? (
                      <InlineLoader message="Loading your relationships..." />
                    ) : (
                      <>
                        <ContactList
                          contacts={displayedContacts}
                          selectedId={selectedContactId}
                          onSelect={setSelectedContactId}
                          onEdit={(contact) => {
                            setEditingContact(contact);
                            setIsModalOpen(true);
                          }}
                          selectedIds={selectedIds}
                          setSelectedIds={setSelectedIds}
                          groupByCompany={false}
                          companyMode={viewMode === "companies"}
                          companies={companyRows}
                          selectedCompany={selectedCompany}
                          onSelectCompany={handleSelectCompany}
                          onBackToCompanies={handleBackToCompanies}
                          onOpenCompanyProfile={openCompanyProfile}
                        />
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between border-t border-border-light bg-white px-4 py-2 sm:px-6 shrink-0">
                            <span className="text-xs text-text-muted">
                              {showingCompanyIndex ? `${companyRows.length} compan${companyRows.length === 1 ? "y" : "ies"}` : `${displayedContacts.length} of ${totalContacts}`}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronsLeft size={13} />
                              </button>
                              <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft size={13} />
                              </button>
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                                const p = start + i;
                                if (p > totalPages) return null;
                                return (
                                  <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${
                                      p === currentPage
                                        ? "bg-brand-light text-brand"
                                        : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronRight size={13} />
                              </button>
                              <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronsRight size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {selectedContactId && (
                    <div className="w-full min-[1240px]:w-[420px] min-[1440px]:w-[480px] border-l border-border-light bg-white flex flex-col min-w-0 overflow-hidden animate-in slide-in-from-right duration-300">
                      <ContactDetails
                        contactId={selectedContactId}
                        onClose={() => setSelectedContactId(null)}
                        onEdit={(contact) => {
                          setEditingContact(contact);
                          setIsModalOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>

                {isListsOpen && (
                  <div className="fixed inset-0 z-40 bg-text-primary/10 backdrop-blur-sm min-[1120px]:hidden" onClick={() => setIsListsOpen(false)}>
                    <aside
                      className="absolute inset-y-0 left-0 w-[min(320px,calc(100vw-1rem))] border-r border-border-light bg-white shadow-premium-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-text-primary">Lists</p>
                          <p className="text-xs text-text-muted">Filter contacts by saved groups</p>
                        </div>
                        <button
                          onClick={() => setIsListsOpen(false)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-background"
                          aria-label="Close lists"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="h-[calc(100%-65px)] overflow-y-auto">
                        <ContactListsSidebar
                          selectedListId={selectedListId}
                          onSelectList={(listId) => {
                            setSelectedListId(listId);
                            setIsListsOpen(false);
                          }}
                          refreshKey={refreshListsTrigger}
                        />
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            </div>

          <AddToListModal
            isOpen={isAddToListModalOpen}
            onClose={() => setIsAddToListModalOpen(false)}
            selectedContactIds={Array.from(selectedIds)}
            onSuccess={() => {
              void fetchContacts(currentPage);
              setRefreshListsTrigger(n => n + 1);
            }}
          />

          <ContactModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            contact={editingContact}
            tags={tags}
            members={members}
            onSuccess={() => {
              setIsModalOpen(false);
              void fetchContacts(currentPage);
            }}
          />

          <CompanyCreateModal
            isOpen={isCompanyModalOpen}
            onClose={() => setIsCompanyModalOpen(false)}
            onSubmit={handleCreateCompany}
          />

          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={() => {
              void fetchContacts(currentPage);
            }}
          />

      </ErrorBoundary>
    </AuthGuard>
  );
}

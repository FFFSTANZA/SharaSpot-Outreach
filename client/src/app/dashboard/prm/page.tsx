"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useAuth } from "@/hooks/useAuth";
import { getContacts, getTags, bulkUpdateContacts, bulkDeleteContacts } from "@/lib/apis";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { ContactList } from "./ContactList";
import { ContactDetails } from "./ContactDetails";
import AddContactModal from "./AddContactModal";
import { 
  Users, UserPlus, Filter, Tag as TagIcon, 
  Search, ChevronDown,
  LayoutGrid, List, Plus, RefreshCw,
  Trash2, Send, CheckSquare, Square,
  MoreVertical, X, Copy
} from "lucide-react";
import type { Contact, Tag, ContactStage } from "@/types";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

const STAGES: (ContactStage | "ALL")[] = ["ALL", "LEAD", "CONTACTED", "REPLIED", "BOUNCED", "UNSUBSCRIBED", "CHURNED"];

export default function PRMPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<ContactStage | "ALL">("ALL");
  const [selectedTag, setSelectedTag] = useState<string | "ALL">("ALL");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedStage !== "ALL") params.stage = selectedStage;
      if (selectedTag !== "ALL") params.tag = selectedTag;
      
      const data = await getContacts(params);
      setContacts(data);
      
      // Clear selection if contacts are no longer visible
      setSelectedIds(prev => {
        const next = new Set<string>();
        data.forEach(c => {
          if (prev.has(c.id)) next.add(c.id);
        });
        return next;
      });

      // If we have contacts but none selected, select the first one
      if (data.length > 0 && !selectedContactId) {
        setSelectedContactId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStage, selectedTag, selectedContactId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    getTags().then(setTags).catch(() => {});
  }, []);

  const handleContactClick = (contact: Contact) => {
    setSelectedContactId(contact.id);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  };

  const handleBulkStageChange = async (stage: ContactStage) => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      await bulkUpdateContacts(Array.from(selectedIds), { stage });
      addToast("success", `Updated ${selectedIds.size} contacts`);
      fetchContacts();
      setSelectedIds(new Set());
    } catch (error) {
      addToast("error", "Bulk update failed");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;
    
    setIsBulkUpdating(true);
    try {
      await bulkDeleteContacts(Array.from(selectedIds));
      addToast("success", `Deleted ${selectedIds.size} contacts`);
      if (selectedContactId && selectedIds.has(selectedContactId)) {
        setSelectedContactId(null);
      }
      fetchContacts();
      setSelectedIds(new Set());
    } catch (error) {
      addToast("error", "Bulk delete failed");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleEnrollSelected = () => {
    if (selectedIds.size === 0) return;
    const emails = contacts
      .filter(c => selectedIds.has(c.id))
      .map(c => c.email)
      .join(",");
    router.push(`/dashboard/compose?emails=${encodeURIComponent(emails)}`);
  };

  const handleCopyEmails = () => {
    if (selectedIds.size === 0) return;
    const emails = contacts
      .filter(c => selectedIds.has(c.id))
      .map(c => c.email)
      .join(", ");
    navigator.clipboard.writeText(emails);
    addToast("success", `Copied ${selectedIds.size} emails to clipboard`);
  };

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId), 
  [contacts, selectedContactId]);

  const stats = useMemo(() => {
    return {
      total: contacts.length,
      contacted: contacts.filter(c => c.stage === "CONTACTED").length,
      replied: contacts.filter(c => c.stage === "REPLIED").length,
      bounced: contacts.filter(c => c.stage === "BOUNCED").length,
    };
  }, [contacts]);

  return (
    <AuthGuard>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-[#F8F9FA]">
            <Sidebar
              currentLabel="PRM"
              setLabel={() => {}}
              profile={{
                name: user?.name ?? "",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
              items={[]}
            />

            <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
              <TopBar
                initialValue={search}
                onSearch={setSearch}
                onRefresh={fetchContacts}
                isRefreshing={isLoading}
              />

              {/* Enhanced Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-none">Relationships</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Manage your network and track engagement across your contacts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
                      <button 
                        onClick={() => setSelectedStage("ALL")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          selectedStage === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        All ({stats.total})
                      </button>
                      <button 
                        onClick={() => setSelectedStage("CONTACTED")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          selectedStage === "CONTACTED" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Contacted ({stats.contacted})
                      </button>
                      <button 
                        onClick={() => setSelectedStage("REPLIED")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          selectedStage === "REPLIED" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Replied ({stats.replied})
                      </button>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={fetchContacts}
                      disabled={isLoading}
                      className="h-11 px-4 gap-2 font-bold bg-white"
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      Sync
                    </Button>
                    <Button 
                      variant="primary" 
                      className="h-11 px-5 gap-2 font-bold shadow-lg shadow-blue-100"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </Button>
                  </div>
                </div>

                {/* Search & Filters Bar */}
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search name, email, or company..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <select 
                        className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer transition-all hover:border-gray-300"
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value as any)}
                      >
                        {STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage === "ALL" ? "All Stages" : stage}</option>
                        ))}
                      </select>
                      <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative group">
                      <select 
                        className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer transition-all hover:border-gray-300"
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                      >
                        <option value="ALL">All Tags</option>
                        {tags.map(tag => (
                          <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                      </select>
                      <TagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Split-View Content */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-6 border border-white/10 backdrop-blur-xl bg-opacity-90">
                      <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-black">
                          {selectedIds.size}
                        </div>
                        <span className="text-sm font-bold tracking-tight">Selected</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 bg-white/10 border-transparent hover:bg-white/20 text-white gap-2"
                          onClick={handleCopyEmails}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>

                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 bg-white/10 border-transparent hover:bg-white/20 text-white gap-2"
                          onClick={handleEnrollSelected}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enroll
                        </Button>

                        <div className="relative group/bulk">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 bg-white/10 border-transparent hover:bg-white/20 text-white gap-2"
                          >
                            <Filter className="h-3.5 w-3.5" />
                            Stage
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/bulk:block">
                            <div className="bg-gray-800 border border-white/10 rounded-xl shadow-xl py-2 min-w-[160px] animate-in fade-in zoom-in-95">
                              {STAGES.filter(s => s !== "ALL").map(stage => (
                                <button
                                  key={stage}
                                  onClick={() => handleBulkStageChange(stage as ContactStage)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-white/10 transition-colors"
                                >
                                  {stage}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 bg-red-500/20 border-transparent hover:bg-red-500/40 text-red-200 gap-2"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>

                      <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Left Panel: Contact List */}
                <div className="w-[400px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleSelectAll}
                        className="group flex items-center justify-center"
                      >
                        {selectedIds.size === contacts.length && contacts.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                        )}
                      </button>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Contact Directory</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-blue-600 bg-blue-50 rounded-md"><List className="h-3.5 w-3.5" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"><LayoutGrid className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {isLoading && contacts.length === 0 ? (
                      <div className="py-20">
                        <InlineLoader message="Finding contacts..." />
                      </div>
                    ) : (
                      <ContactList 
                        contacts={contacts} 
                        selectedContactId={selectedContactId}
                        selectedIds={selectedIds}
                        onContactClick={handleContactClick}
                        onToggleSelect={handleToggleSelect}
                      />
                    )}
                  </div>
                </div>

                {/* Right Panel: Contact Details */}
                <div className="flex-1 overflow-hidden bg-white">
                  {selectedContactId ? (
                    <ContactDetails 
                      contactId={selectedContactId} 
                      onUpdate={fetchContacts}
                      onDelete={() => {
                        setSelectedContactId(null);
                        fetchContacts();
                      }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                        <Users className="h-10 w-10 text-gray-200" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">No contact selected</h3>
                      <p className="text-sm text-gray-500 mt-2 max-w-[280px]">
                        Select a contact from the list on the left to view their profile, activity history, and notes.
                      </p>
                      <Button 
                        variant="secondary" 
                        className="mt-8 h-11 px-6 font-bold"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Contact
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modals */}
              <AddContactModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchContacts}
              />
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}

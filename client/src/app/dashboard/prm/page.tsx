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
import ContactModal from "./ContactModal";
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

const STAGES: (ContactStage | "ALL")[] = ["ALL", "COLD", "CONTACTED", "REPLIED", "WARM", "CONVERTED", "BOUNCED", "UNSUBSCRIBED"];

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
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
          <div className="flex h-screen bg-gray-50">
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

            <main className="flex flex-1 flex-col min-w-0 overflow-hidden bg-gray-50/50">
              <TopBar
                initialValue={search}
                onSearch={setSearch}
                onRefresh={fetchContacts}
                isRefreshing={isLoading}
              />

              <div className="flex-1 flex flex-col overflow-hidden relative max-w-[1600px] mx-auto w-full px-4 pb-4">
                {/* Header Area - Clean professional look */}
                <div className="py-6 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-200">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-gray-900 leading-none">Relationship Hub</h1>
                        <p className="text-xs text-gray-500 mt-1.5 font-bold uppercase tracking-widest">{stats.total} total connections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button 
                        variant="primary" 
                        className="h-11 px-6 gap-2 font-bold shadow-lg shadow-blue-100 rounded-xl"
                        onClick={() => {
                          setEditingContact(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Connection
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-8">
                    <div className="relative flex-1 max-w-xl">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search relationships by name, company, or email..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium shadow-sm placeholder:text-gray-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select 
                          className="appearance-none pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                          value={selectedStage}
                          onChange={(e) => setSelectedStage(e.target.value as any)}
                        >
                          {STAGES.map(stage => (
                            <option key={stage} value={stage}>{stage === "ALL" ? "All Stages" : stage}</option>
                          ))}
                        </select>
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          className="appearance-none pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                          value={selectedTag}
                          onChange={(e) => setSelectedTag(e.target.value)}
                        >
                          <option value="ALL">Categories</option>
                          {tags.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                          ))}
                        </select>
                        <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Split-View Content - High Contrast */}
                <div className="flex-1 flex overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm">
                  {/* Left Column: List */}
                  <div className="w-[380px] xl:w-[420px] shrink-0 border-r border-gray-100 flex flex-col overflow-hidden bg-gray-50/30">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm shrink-0">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleSelectAll}
                          className="group flex items-center justify-center h-5 w-5 rounded-md border border-gray-300 bg-white transition-all hover:border-blue-400"
                        >
                          {selectedIds.size === contacts.length && contacts.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : selectedIds.size > 0 ? (
                            <div className="h-2 w-2 bg-blue-600 rounded-sm" />
                          ) : null}
                        </button>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Feed</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <button className="p-2 text-blue-600 bg-blue-50 rounded-xl transition-colors"><List className="h-4 w-4" /></button>
                         <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"><LayoutGrid className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                      {isLoading && contacts.length === 0 ? (
                        <div className="py-24">
                          <InlineLoader message="Loading hub..." />
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

                  {/* Right Column: Detailed Profile */}
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
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-32 w-32 bg-blue-50/50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-blue-100/50 shadow-sm group animate-pulse">
                          <Users className="h-14 w-14 text-blue-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">Select a Relationship</h3>
                        <p className="text-sm text-gray-500 mt-4 max-w-[360px] leading-relaxed font-medium">
                          Choose a contact from your directory to view their full profile, interaction history, and personal notes.
                        </p>
                        <Button 
                          variant="secondary" 
                          className="mt-12 h-14 px-10 font-bold rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-gray-600"
                          onClick={() => {
                            setEditingContact(null);
                            setIsModalOpen(true);
                          }}
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add First Connection
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-6 border border-white/10 backdrop-blur-xl bg-opacity-95">
                      <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-black">
                          {selectedIds.size}
                        </div>
                        <span className="text-sm font-bold">Selected</span>
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
              </div>

              {/* Modals */}
              <ContactModal 
                isOpen={isModalOpen} 
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingContact(null);
                }}
                onSuccess={fetchContacts}
                contact={editingContact}
              />
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}

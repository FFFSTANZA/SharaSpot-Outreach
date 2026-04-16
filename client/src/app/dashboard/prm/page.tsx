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

            <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
              <TopBar
                initialValue={search}
                onSearch={setSearch}
                onRefresh={fetchContacts}
                isRefreshing={isLoading}
              />

              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header Area */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">PRM</h1>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{stats.total} connections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button 
                        variant="primary" 
                        className="h-10 px-4 gap-2 font-bold shadow-md shadow-blue-50"
                        onClick={() => {
                          setEditingContact(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Contact
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search by name, company, or email..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select 
                          className="appearance-none pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-colors"
                          value={selectedStage}
                          onChange={(e) => setSelectedStage(e.target.value as any)}
                        >
                          {STAGES.map(stage => (
                            <option key={stage} value={stage}>{stage === "ALL" ? "All Stages" : stage}</option>
                          ))}
                        </select>
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          className="appearance-none pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-colors"
                          value={selectedTag}
                          onChange={(e) => setSelectedTag(e.target.value)}
                        >
                          <option value="ALL">All Tags</option>
                          {tags.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                          ))}
                        </select>
                        <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Split-View Content */}
                <div className="flex-1 flex overflow-hidden bg-white">
                  {/* Left Column: List */}
                  <div className="w-[350px] xl:w-[400px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden bg-gray-50/20">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleSelectAll}
                          className="group flex items-center justify-center h-4 w-4 rounded border border-gray-300 bg-white"
                        >
                          {selectedIds.size === contacts.length && contacts.length > 0 ? (
                            <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                          ) : selectedIds.size > 0 ? (
                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-sm" />
                          ) : null}
                        </button>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Directory</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-blue-600 bg-blue-50 rounded-lg"><List className="h-3 w-3" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><LayoutGrid className="h-3 w-3" /></button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-20">
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

                  {/* Right Column: Details */}
                  <div className="flex-1 overflow-hidden">
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
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                        <div className="h-24 w-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8 border border-gray-100 shadow-sm rotate-3 group hover:rotate-0 transition-transform duration-500">
                          <Users className="h-12 w-12 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Select a Relationship</h3>
                        <p className="text-sm text-gray-500 mt-3 max-w-[320px] leading-relaxed">
                          Choose a contact from your directory to view their full profile, interaction history, and personal notes.
                        </p>
                        <Button 
                          variant="secondary" 
                          className="mt-10 h-12 px-8 font-bold rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                          onClick={() => {
                            setEditingContact(null);
                            setIsModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Contact
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

"use client";

import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getContacts, deleteContact, bulkDeleteContacts, getTags } from "@/lib/apis";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { ContactList } from "./ContactList";
import { ContactDetails } from "./ContactDetails";
import { ContactModal } from "./ContactModal";
import type { Contact, Tag } from "@/types";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  MoreHorizontal,
  Mail,
  MessageSquare,
  MousePointer2,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function PRMPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentStageFilter, setCurrentStageFilter] = useState<string>("ALL");

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getContacts({ 
        search: searchQuery,
        stage: currentStageFilter === "ALL" ? undefined : currentStageFilter
      });
      setContacts(data);
    } catch (error) {
      addToast("error", "Failed to fetch contacts");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentStageFilter, addToast]);

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const STAGES = ["ALL", "COLD", "WARM", "HOT", "REPLIED", "CONVERTED", "BOUNCED"];

  const handleCreateContact = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContact(id);
      addToast("success", "Contact deleted");
      fetchContacts();
      if (selectedContactId === id) setSelectedContactId(null);
    } catch (error) {
      addToast("error", "Failed to delete contact");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;
    try {
      await bulkDeleteContacts(Array.from(selectedIds));
      addToast("success", "Contacts deleted");
      setSelectedIds(new Set());
      fetchContacts();
    } catch (error) {
      addToast("error", "Failed to delete contacts");
    }
  };

  const handleBulkStageUpdate = async (stage: string) => {
    try {
      await (await import("@/lib/apis")).bulkUpdateContacts(Array.from(selectedIds), { stage });
      addToast("success", `Updated ${selectedIds.size} contacts to ${stage}`);
      setSelectedIds(new Set());
      fetchContacts();
    } catch (error) {
      addToast("error", "Failed to update contacts");
    }
  };

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId), 
    [contacts, selectedContactId]
  );

  return (
    <AuthGuard>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-[#F8FAFC] font-sans">
            <Sidebar
              currentLabel={currentStageFilter === "ALL" ? "All Contacts" : `${currentStageFilter} Stage`}
              setLabel={(label) => {
                const stage = STAGES.find(s => s === label.split(' ')[0].toUpperCase());
                if (stage) setCurrentStageFilter(stage);
                else if (label === "All Contacts") setCurrentStageFilter("ALL");
              }}
              profile={{
                name: user?.name ?? "Outreach Pro",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
              items={[
                { label: "All Contacts", count: contacts.length, icon: <Users size={18} /> },
                ...STAGES.filter(s => s !== "ALL").map(s => ({
                   label: `${s.charAt(0) + s.slice(1).toLowerCase()} Stage`,
                   icon: <div className={cn(
                     "w-2 h-2 rounded-full",
                     s === "COLD" ? "bg-gray-400" :
                     s === "WARM" ? "bg-blue-400" :
                     s === "HOT" ? "bg-orange-400" :
                     s === "REPLIED" ? "bg-green-400" :
                     "bg-brand"
                   )} />
                }))
              ]}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-4 px-4">
              <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-black text-text-primary tracking-tight">PRM</h1>
                      <p className="text-sm text-text-muted font-medium">Manage your professional relationships</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 mr-4 pr-4 border-r border-border-light">
                          <span className="text-xs font-black text-text-muted uppercase tracking-widest mr-2">{selectedIds.size} Selected</span>
                          <select 
                             onChange={(e) => handleBulkStageUpdate(e.target.value)}
                             className="text-xs font-black uppercase tracking-wider bg-background border border-border-light rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand/20"
                             value=""
                          >
                             <option value="" disabled>Move to Stage...</option>
                             {STAGES.filter(s => s !== "ALL").map(s => (
                               <option key={s} value={s}>{s}</option>
                             ))}
                          </select>
                          <button
                            onClick={handleBulkDelete}
                            className="p-2 text-error-text hover:bg-error-bg rounded-lg transition-all"
                            title="Delete Selected"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={handleCreateContact}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
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
                        placeholder="Search by name, company, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border-light rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                      />
                    </div>
                    <div className="flex items-center bg-background p-1 rounded-xl border border-border-light">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setCurrentStageFilter(s)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
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
                  <div className={`flex-1 flex flex-col min-w-0 ${selectedContactId ? 'hidden lg:flex' : 'flex'}`}>
                    {isLoading && contacts.length === 0 ? (
                      <InlineLoader message="Loading your relationships..." />
                    ) : (
                      <ContactList
                        contacts={contacts}
                        selectedId={selectedContactId}
                        onSelect={setSelectedContactId}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                      />
                    )}
                  </div>

                  {selectedContactId && (
                    <div className="w-full lg:w-[500px] border-l border-border-light bg-white flex flex-col animate-in slide-in-from-right duration-300">
                      <ContactDetails
                        contactId={selectedContactId}
                        onClose={() => setSelectedContactId(null)}
                        onUpdate={fetchContacts}
                      />
                    </div>
                  )}
                </div>
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
              fetchContacts();
            }}
          />
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}

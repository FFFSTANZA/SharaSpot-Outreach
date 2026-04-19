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

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getContacts({ search: searchQuery });
      setContacts(data);
    } catch (error) {
      addToast("error", "Failed to fetch contacts");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, addToast]);

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [fetchContacts, fetchTags]);

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

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId), 
    [contacts, selectedContactId]
  );

  return (
    <AuthGuard>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-background font-sans">
            <Sidebar
              currentLabel="Contacts"
              setLabel={() => {}}
              profile={{
                name: user?.name ?? "Outreach Pro",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
              items={[
                { label: "All Contacts", count: contacts.length, icon: <Users size={18} /> },
              ]}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-4 px-4 bg-background">
              <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
                <TopBar
                  initialValue={searchQuery}
                  onSearch={setSearchQuery}
                  onRefresh={fetchContacts}
                  isRefreshing={isLoading}
                  filterSlot={
                    <div className="flex items-center gap-2">
                      {selectedIds.size > 0 && (
                        <button
                          onClick={handleBulkDelete}
                          className="flex items-center gap-2 px-3 py-1.5 bg-error-bg text-error-text rounded-lg text-sm font-bold hover:opacity-80 transition-all"
                        >
                          <Trash2 size={16} />
                          <span>Delete ({selectedIds.size})</span>
                        </button>
                      )}
                      <button
                        onClick={handleCreateContact}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-sm"
                      >
                        <UserPlus size={16} />
                        <span>Add Contact</span>
                      </button>
                    </div>
                  }
                />

                <div className="flex-1 flex overflow-hidden">
                  <div className={`flex-1 flex flex-col min-w-0 ${selectedContactId ? 'hidden md:flex' : 'flex'}`}>
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
                    <div className="w-full md:w-[450px] lg:w-[550px] border-l border-border-light bg-white flex flex-col animate-in slide-in-from-right duration-300">
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

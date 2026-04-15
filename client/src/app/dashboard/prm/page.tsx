"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useAuth } from "@/hooks/useAuth";
import { getContacts, getTags } from "@/lib/apis";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { ContactList } from "./ContactList";
import { ContactDrawer } from "./ContactDrawer";
import { Users, UserPlus, Filter, Tag as TagIcon } from "lucide-react";
import type { Contact, Tag, ContactStage } from "@/types";

export default function PRMPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<ContactStage | "ALL">("ALL");
  const [selectedTag, setSelectedTag] = useState<string | "ALL">("ALL");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedStage !== "ALL") params.stage = selectedStage;
      if (selectedTag !== "ALL") params.tag = selectedTag;
      
      const data = await getContacts(params);
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStage, selectedTag]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    getTags().then(setTags).catch(() => {});
  }, []);

  const handleContactClick = (contact: Contact) => {
    setSelectedContactId(contact.id);
    setIsDrawerOpen(true);
  };

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
          <div className="flex h-screen bg-[#FAFBFC]">
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

              <div className="px-4 md:px-6 py-4 border-b border-[#E8EAED] bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00A63E]" />
                    <h1 className="text-xl font-bold text-[#1A1D21]">Relationship Management</h1>
                    <span className="text-sm text-[#5F6368] font-normal">({stats.total} contacts)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DADCE0] rounded-md text-sm font-medium text-[#3C4043] hover:bg-[#F1F3F4] transition-colors"
                      onClick={() => {}}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Contact
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 bg-[#F1F3F4] px-3 py-1.5 rounded-full text-sm text-[#3C4043]">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Stage:</span>
                    <select 
                      className="bg-transparent border-none focus:ring-0 p-0 font-medium"
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value as any)}
                    >
                      <option value="ALL">All Stages</option>
                      <option value="LEAD">Leads</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="REPLIED">Replied</option>
                      <option value="BOUNCED">Bounced</option>
                      <option value="UNSUBSCRIBED">Unsubscribed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-[#F1F3F4] px-3 py-1.5 rounded-full text-sm text-[#3C4043]">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span>Tag:</span>
                    <select 
                      className="bg-transparent border-none focus:ring-0 p-0 font-medium"
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                    >
                      <option value="ALL">All Tags</option>
                      {tags.map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {isLoading && contacts.length === 0 ? (
                <InlineLoader message="Loading contacts..." />
              ) : (
                <div className="flex-1 overflow-auto p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-[#E8EAED] shadow-sm">
                      <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider mb-1">Total Contacts</p>
                      <p className="text-2xl font-bold text-[#1A1D21]">{stats.total}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#E8EAED] shadow-sm">
                      <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider mb-1">Contacted</p>
                      <p className="text-2xl font-bold text-[#1A1D21]">{stats.contacted}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#E8EAED] shadow-sm">
                      <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider mb-1">Replied</p>
                      <p className="text-2xl font-bold text-[#1A1D21] text-[#00A63E]">{stats.replied}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#E8EAED] shadow-sm">
                      <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider mb-1">Bounced</p>
                      <p className="text-2xl font-bold text-[#1A1D21] text-[#D93025]">{stats.bounced}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-[#E8EAED] shadow-sm overflow-hidden">
                    <ContactList 
                      contacts={contacts} 
                      onContactClick={handleContactClick}
                    />
                  </div>
                </div>
              )}

              {isDrawerOpen && selectedContactId && (
                <ContactDrawer 
                  contactId={selectedContactId} 
                  onClose={() => setIsDrawerOpen(false)}
                  onUpdate={fetchContacts}
                />
              )}
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}

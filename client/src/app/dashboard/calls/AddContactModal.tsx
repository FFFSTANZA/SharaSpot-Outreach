"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Folder, Hash, X, ChevronLeft, ChevronRight, PhoneCall, Plus, CalendarClock } from "lucide-react";
import { getContacts, getContactLists, createCallTask } from "@/lib/apis";
import type { Contact } from "@/types";
import type { ContactList } from "@/lib/apis/contactLists";
import { useToast } from "@/context/ToastContext";

interface AddContactModalProps {
  listFilterId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function AddContactModal({ listFilterId, onClose, onSuccess }: AddContactModalProps) {
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [callDate, setCallDate] = useState(todayDate());
  const [callTime, setCallTime] = useState(nowTime());
  const [isCreating, setIsCreating] = useState(false);

  const fetchContacts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getContacts({
        search: searchQuery || undefined,
        listId: selectedListId,
        page,
        limit: 20,
      });
      setContacts(data.contacts);
      setTotalPages(data.totalPages);
      setTotalContacts(data.total);
      setCurrentPage(data.page);
    } catch {
      addToast("error", "Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedListId, addToast]);

  const fetchLists = useCallback(async () => {
    try {
      const data = await getContactLists();
      setLists(data);
    } catch {}
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedListId]);
  useEffect(() => { fetchContacts(currentPage); }, [currentPage, fetchContacts]);

  const handleCreate = async () => {
    if (!selectedContact || !callDate || !callTime) {
      addToast("warning", "Contact, date, and time are required");
      return;
    }
    setIsCreating(true);
    try {
      const effectiveListId = listFilterId && listFilterId !== "__none" ? listFilterId : undefined;
      await createCallTask({
        contactId: selectedContact.id,
        dueAt: `${callDate}T${callTime}`,
        contactListId: effectiveListId,
      });
      addToast("success", "Call task scheduled");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to create task"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-premium-lg w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Add Contact to Call Queue</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F0F1F3] rounded-md"><X size={18} className="text-text-muted" /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-48 border-r border-border-light bg-[#F8F9FA]/50 p-3 space-y-2 overflow-y-auto">
            <button onClick={() => { setSelectedListId(null); setSearchQuery(""); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${selectedListId === null ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3]"}`}>
              <Hash size={14} /> All Contacts
            </button>
            {lists.map((list) => (
              <button key={list.id} onClick={() => setSelectedListId(list.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${selectedListId === list.id ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3]"}`}>
                <span className="flex items-center gap-2 truncate"><Folder size={14} className="shrink-0" />{list.name}</span>
                <span className="text-[10px] text-text-muted">{list._count?.contacts || 0}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b border-border-light">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search contacts"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-border-light rounded-lg text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-sm text-text-muted">Loading...</div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-sm text-text-muted">
                  <PhoneCall size={24} className="text-text-muted mb-2" />
                  No contacts found
                </div>
              ) : (
                <div className="divide-y divide-border-light">
                  {contacts.map((c) => {
                    const name = (c.firstName || c.lastName) ? `${c.firstName || ""} ${c.lastName || ""}`.trim() : c.email;
                    return (
                      <button key={c.id} onClick={() => setSelectedContact(c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F1F3] text-left transition-all ${selectedContact?.id === c.id ? "bg-brand/5" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                          {(c.firstName?.[0] || c.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-text-primary truncate">{name}</div>
                          <div className="text-xs text-text-muted truncate">{c.company || c.email}</div>
                        </div>
                        {c.phone && <span className="text-xs text-text-muted shrink-0">{c.phone}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border-light flex items-center justify-between">
                <span className="text-xs text-text-muted">{totalContacts} contacts</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
                    className="p-1.5 rounded-md hover:bg-[#F0F1F3] disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="px-2 text-xs font-semibold text-text-secondary">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-md hover:bg-[#F0F1F3] disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}

            {selectedContact && (
              <div className="px-4 py-3 border-t border-border-light bg-[#F8F9FA]/50 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <CalendarClock size={15} className="text-brand" />
                  Schedule call with <span className="text-brand">{(selectedContact.firstName || selectedContact.lastName) ? `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`.trim() : selectedContact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-border-light px-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10" />
                  <input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-border-light px-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10" />
                  <button onClick={handleCreate} disabled={isCreating}
                    className="h-9 px-4 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-60 inline-flex items-center gap-2 shrink-0">
                    <Plus size={14} /> {isCreating ? "Scheduling..." : "Schedule Call"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

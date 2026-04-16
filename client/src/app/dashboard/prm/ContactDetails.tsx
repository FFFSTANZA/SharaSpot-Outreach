"use client";

import { useState, useEffect } from "react";
import { 
  getContactById, 
  createNote, 
  deleteContact,
  getTags,
  updateContact
} from "@/lib/apis";
import { Contact, Tag, ContactStage } from "@/types";
import { 
  Mail, Building, Briefcase, Calendar, 
  Tag as TagIcon, Plus, Trash2, Send, 
  Edit2, Loader2, User,
  ChevronDown, Linkedin, Clock, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { Timeline } from "./Timeline";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import ContactModal from "./ContactModal";

interface ContactDetailsProps {
  contactId: string;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ContactDetails({ contactId, onUpdate, onDelete }: ContactDetailsProps) {
  const { addToast } = useToast();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const fetchContact = async () => {
    setIsLoading(true);
    try {
      const data = await getContactById(contactId);
      setContact(data);
    } catch (error) {
      console.error("Failed to fetch contact details", error);
      addToast("error", "Failed to fetch contact details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await createNote({ contactId, content: noteContent });
      setNoteContent("");
      addToast("success", "Note added");
      fetchContact();
    } catch (error) {
      console.error("Failed to add note", error);
      addToast("error", "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContact(contactId);
      addToast("success", "Contact deleted");
      onDelete();
    } catch (error) {
      console.error("Failed to delete contact", error);
      addToast("error", "Failed to delete contact");
    }
  };

  const handleStageChange = async (newStage: ContactStage) => {
    if (!contact) return;
    try {
      await updateContact(contact.id, { stage: newStage });
      setContact({ ...contact, stage: newStage });
      addToast("success", `Stage updated to ${newStage}`);
      onUpdate();
    } catch (error) {
      addToast("error", "Failed to update stage");
    }
  };

  if (isLoading && !contact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400 bg-white">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading contact details...</p>
      </div>
    );
  }

  if (!contact) return null;

  const totalEmails = contact.activities?.filter(a => a.type === "EMAIL_SENT").length || 0;
  const replies = contact.activities?.filter(a => a.type === "EMAIL_REPLIED").length || 0;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${contact.firstName || ""} ${contact.lastName || ""} ${contact.company || ""}`)}`;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white border-b border-gray-100 px-8 py-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-100 shrink-0">
              {(contact.firstName || contact.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 leading-none">
                  {contact.firstName || contact.lastName 
                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                    : contact.email}
                </h2>
                <div className="relative group/stage">
                  <select 
                    value={contact.stage}
                    onChange={(e) => handleStageChange(e.target.value as ContactStage)}
                    className={cn(
                      "appearance-none px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border cursor-pointer pr-5 transition-all",
                      contact.stage === "REPLIED" ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" :
                      contact.stage === "CONTACTED" ? "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100" :
                      "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    {["COLD", "CONTACTED", "REPLIED", "WARM", "CONVERTED", "BOUNCED", "UNSUBSCRIBED"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 opacity-40 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 font-medium">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {contact.email}
                </div>
                {contact.company && (
                  <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-gray-400" />
                    {contact.jobTitle ? `${contact.jobTitle} @ ${contact.company}` : contact.company}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-4 flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 shadow-inner">
               <input 
                type="text"
                placeholder="Quick note..."
                className="bg-transparent border-none focus:ring-0 text-xs py-1.5 px-3 w-48 font-medium placeholder:text-gray-400"
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddNote(e);
                }}
              />
              <button 
                onClick={handleAddNote}
                disabled={isSubmittingNote || !noteContent.trim()}
                className="p-1.5 text-blue-600 hover:bg-white rounded-lg transition-all disabled:opacity-30"
              >
                {isSubmittingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Button 
              variant="primary" 
              className="h-10 px-5 gap-2 shadow-md shadow-blue-50 font-bold"
              onClick={() => router.push(`/dashboard/compose?emails=${encodeURIComponent(contact.email)}`)}
            >
              <Send className="h-4 w-4" />
              Enroll
            </Button>
            <Button 
              variant="secondary" 
              className="h-10 px-3 gap-2 font-bold bg-white border-gray-200"
              onClick={() => setIsModalOpen(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-gray-200"
              onClick={handleDeleteContact}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-20 border-r border-gray-50">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">Sent</p>
              <p className="text-2xl font-black text-gray-900">{totalEmails}</p>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">Replies</p>
              <p className="text-2xl font-black text-emerald-600">{replies}</p>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">Response Rate</p>
              <p className="text-2xl font-black text-blue-600">
                {totalEmails > 0 ? Math.round((replies / totalEmails) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b border-gray-100 bg-gray-50/30">
              <button 
                className={cn(
                  "px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-px",
                  activeTab === "timeline" ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600"
                )}
                onClick={() => setActiveTab("timeline")}
              >
                Interaction History
              </button>
              <button 
                className={cn(
                  "px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-px",
                  activeTab === "notes" ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600"
                )}
                onClick={() => setActiveTab("notes")}
              >
                Notes ({contact.notes?.length || 0})
              </button>
            </div>

            <div className="p-6">
              {activeTab === "timeline" ? (
                <Timeline activities={contact.activities || []} />
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleAddNote} className="relative">
                    <textarea 
                      className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all resize-none font-medium"
                      placeholder="Add a private note..."
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button 
                        type="submit"
                        disabled={isSubmittingNote || !noteContent.trim()}
                        variant="primary"
                        size="sm"
                        className="h-9 px-4 font-bold"
                      >
                        {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-4">
                    {contact.notes?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                      <div key={note.id} className="bg-gray-50/30 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">{note.content}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {format(new Date(note.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info - Fixed Right */}
        <div className="w-[300px] shrink-0 p-8 space-y-6 bg-gray-50/20 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Relationship</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Stage</span>
                  <span className="text-xs font-bold text-gray-900">{contact.stage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Added</span>
                  <span className="text-xs font-bold text-gray-900">{format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Professional Info</p>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Job Title</span>
                  <span className="text-sm font-bold text-gray-900">{contact.jobTitle || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Company</span>
                  <span className="text-sm font-bold text-gray-900">{contact.company || "Not specified"}</span>
                </div>
                <div>
                  <a 
                    href={linkedinSearchUrl} 
                    target="_blank" 
                    rel="noopener" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {contact.tags?.map(tag => (
                  <span 
                    key={tag.id}
                    className="px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
                {(!contact.tags || contact.tags.length === 0) && (
                  <p className="text-[10px] text-gray-400 font-medium italic">No tags assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchContact();
          onUpdate();
        }}
        contact={contact}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  getContactById, 
  createNote, 
  deleteContact,
  getTags
} from "@/lib/apis";
import { Contact, Tag } from "@/types";
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
    <div className="h-full flex flex-col bg-gray-50/30 overflow-hidden animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-blue-100 shrink-0">
              {(contact.firstName || contact.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900 leading-none">
                  {contact.firstName || contact.lastName 
                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                    : contact.email}
                </h2>
                <span className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                  contact.stage === "REPLIED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                  contact.stage === "CONTACTED" ? "bg-blue-50 text-blue-700 border-blue-100" :
                  "bg-gray-50 text-gray-500 border-gray-100"
                )}>
                  {contact.stage}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 font-medium">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 opacity-40" />
                  {contact.email}
                </div>
                {contact.company && (
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4 opacity-40" />
                    {contact.company}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="primary" 
              className="h-11 px-6 gap-2 shadow-lg shadow-blue-100 font-bold"
              onClick={() => router.push(`/dashboard/compose?emails=${encodeURIComponent(contact.email)}`)}
            >
              <Send className="h-4 w-4" />
              Enroll
            </Button>
            <Button 
              variant="secondary" 
              className="h-11 px-4 gap-2 font-bold bg-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="secondary" 
              className="h-11 w-11 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 bg-white"
              onClick={handleDeleteContact}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Mail className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sent</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalEmails}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
             <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Replies</p>
            </div>
            <p className="text-3xl font-black text-emerald-600">{replies}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
             <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stage</p>
            </div>
            <p className="text-lg font-black text-gray-900">{contact.stage}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                <Linkedin className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Profile</p>
            </div>
            <a href={linkedinSearchUrl} target="_blank" rel="noopener" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Search LinkedIn <Plus className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Activity Area */}
          <div className="col-span-8 space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="flex border-b border-gray-100 bg-gray-50/30">
                <button 
                  className={cn(
                    "px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 -mb-px",
                    activeTab === "timeline" ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600"
                  )}
                  onClick={() => setActiveTab("timeline")}
                >
                  Activity Agenda
                </button>
                <button 
                  className={cn(
                    "px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 -mb-px",
                    activeTab === "notes" ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600"
                  )}
                  onClick={() => setActiveTab("notes")}
                >
                  Notes ({contact.notes?.length || 0})
                </button>
              </div>

              <div className="p-8">
                {activeTab === "timeline" ? (
                  <Timeline activities={contact.activities || []} />
                ) : (
                  <div className="space-y-8">
                    <form onSubmit={handleAddNote} className="relative">
                      <textarea 
                        className="w-full h-32 p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none font-medium"
                        placeholder="Add a private note about this contact..."
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                      />
                      <div className="absolute bottom-3 right-3">
                        <Button 
                          type="submit"
                          disabled={isSubmittingNote || !noteContent.trim()}
                          variant="primary"
                          size="sm"
                          className="h-10 px-4 font-bold shadow-lg shadow-blue-100"
                        >
                          {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                          Save Note
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-4">
                      {contact.notes?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                        <div key={note.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all group">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">{note.content}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-gray-400" />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">You • {format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!contact.notes || contact.notes.length === 0) && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-50 rounded-2xl">
                          <p className="text-sm font-bold text-gray-300">No notes yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overview</p>
                <TagIcon className="h-3 w-3 text-gray-300" />
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Job Details</label>
                  <p className="text-sm font-bold text-gray-900">{contact.jobTitle || "Not specified"}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{contact.company || "No company"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Relationship</label>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <p className="text-sm font-bold text-gray-900 capitalize">{contact.stage.toLowerCase()}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Added On</label>
                  <p className="text-sm font-bold text-gray-900">{format(new Date(contact.createdAt), "MMMM d, yyyy")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</p>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {contact.tags?.map(tag => (
                    <span 
                      key={tag.id}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {(!contact.tags || contact.tags.length === 0) && (
                    <p className="text-xs text-gray-400 font-medium italic">No tags assigned</p>
                  )}
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full mt-6 h-10 font-bold border-dashed border-2 hover:border-blue-300 hover:text-blue-600 transition-all"
                  onClick={() => setIsModalOpen(true)}
                >
                  Manage Tags
                </Button>
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

"use client";

import { useState, useEffect } from "react";
import { 
  getContactById, 
  createNote, 
  updateContact, 
  deleteContact,
  getTags
} from "@/lib/apis";
import { Contact, ContactStage, Tag } from "@/types";
import { 
  X, Mail, Building, Briefcase, Calendar, 
  Tag as TagIcon, Plus, Trash2, Send, Save, 
  MoreHorizontal, Edit2, Loader2, User,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { Timeline } from "./Timeline";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import { useToast } from "@/context/ToastContext";

interface ContactDetailsProps {
  contactId: string;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ContactDetails({ contactId, onUpdate, onDelete }: ContactDetailsProps) {
  const { addToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetchContact();
    getTags().then(setAvailableTags).catch(() => {});
  }, [contactId]);

  const fetchContact = async () => {
    setIsLoading(true);
    try {
      const data = await getContactById(contactId);
      setContact(data);
      setEditData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        company: data.company || "",
        jobTitle: data.jobTitle || "",
        stage: data.stage,
        tags: data.tags?.map(t => t.id) || [],
      });
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

  const handleUpdateContact = async () => {
    try {
      await updateContact(contactId, editData);
      setIsEditing(false);
      addToast("success", "Contact updated");
      fetchContact();
      onUpdate();
    } catch (error) {
      console.error("Failed to update contact", error);
      addToast("error", "Failed to update contact");
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

  const toggleTag = (tagId: string) => {
    const currentTags = editData.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id: string) => id !== tagId)
      : [...currentTags, tagId];
    
    setEditData({ ...editData, tags: newTags });
    
    if (!isEditing) {
      updateContact(contactId, { tags: newTags }).then(() => {
        fetchContact();
        onUpdate();
      });
    }
  };

  if (isLoading && !contact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading contact details...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400">
        <User className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">Select a contact to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-100 shrink-0">
            {(contact.firstName || contact.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {contact.firstName || contact.lastName 
                ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                : contact.email}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-medium">
              <Mail className="h-3 w-3" />
              {contact.email}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-9 px-3 gap-2"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
            onClick={handleDeleteContact}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">General Information</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Building className="h-3 w-3" /> Company
                </label>
                {isEditing ? (
                  <input 
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={editData.company}
                    onChange={e => setEditData({...editData, company: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{contact.company || "Not specified"}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" /> Job Title
                </label>
                {isEditing ? (
                  <input 
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={editData.jobTitle}
                    onChange={e => setEditData({...editData, jobTitle: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{contact.jobTitle || "Not specified"}</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="h-3 w-3" /> Current Stage
                </label>
                <div className="relative">
                  <select 
                    className={cn(
                      "w-full appearance-none px-3 py-2 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all",
                      editData.stage === "REPLIED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      editData.stage === "CONTACTED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      editData.stage === "BOUNCED" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-gray-100 text-gray-700 border-gray-200"
                    )}
                    value={editData.stage}
                    onChange={e => {
                      const newStage = e.target.value as ContactStage;
                      setEditData({...editData, stage: newStage});
                      if (!isEditing) {
                        updateContact(contactId, { stage: newStage }).then(() => {
                          fetchContact();
                          onUpdate();
                        });
                      }
                    }}
                  >
                    <option value="LEAD">LEAD</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="REPLIED">REPLIED</option>
                    <option value="BOUNCED">BOUNCED</option>
                    <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
                    <option value="CHURNED">CHURNED</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-50 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Date Added
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(contact.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
          {isEditing && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button onClick={handleUpdateContact} className="h-10 font-bold">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags</p>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const isSelected = (isEditing ? editData.tags : contact.tags?.map(t => t.id))?.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border",
                    isSelected 
                      ? "text-white shadow-sm ring-2 ring-offset-1" 
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100 hover:text-gray-700"
                  )}
                  style={{ 
                    backgroundColor: isSelected ? tag.color : undefined,
                    borderColor: isSelected ? tag.color : undefined,
                    boxShadow: isSelected ? `0 4px 12px ${tag.color}30` : undefined,
                    "--tw-ring-color": isSelected ? `${tag.color}40` : "transparent"
                  } as any}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs for Timeline/Notes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="flex border-b border-gray-100 px-2 bg-gray-50/50">
            <button 
              className={cn(
                "px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-px",
                activeTab === "timeline" 
                  ? "text-blue-600 border-blue-600" 
                  : "text-gray-400 border-transparent hover:text-gray-600"
              )}
              onClick={() => setActiveTab("timeline")}
            >
              Activity Timeline
            </button>
            <button 
              className={cn(
                "px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-px",
                activeTab === "notes" 
                  ? "text-blue-600 border-blue-600" 
                  : "text-gray-400 border-transparent hover:text-gray-600"
              )}
              onClick={() => setActiveTab("notes")}
            >
              Notes ({contact.notes?.length || 0})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "timeline" ? (
              <div className="p-0">
                <Timeline activities={contact.activities || []} />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <form onSubmit={handleAddNote} className="relative group">
                  <textarea 
                    className="w-full h-32 p-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-none placeholder:text-gray-400 font-medium"
                    placeholder="Type a new note here..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button 
                      type="submit"
                      disabled={isSubmittingNote || !noteContent.trim()}
                      className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100"
                    >
                      {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </form>

                <div className="space-y-4">
                  {contact.notes?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                    <div key={note.id} className="group relative bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all shadow-sm">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!contact.notes || contact.notes.length === 0) && (
                    <div className="text-center py-12">
                      <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">No notes yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start by adding your first note above</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

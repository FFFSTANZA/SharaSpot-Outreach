"use client";

import { useState, useEffect } from "react";
import { getContactById, createNote, updateContact, deleteContact } from "@/lib/apis";
import { Contact, ContactNote, ContactActivity } from "@/types";
import { X, Mail, Building, Briefcase, Calendar, Tag as TagIcon, Plus, Trash2, Send, Save } from "lucide-react";
import { format } from "date-fns";
import { Timeline } from "./Timeline";
import { cn } from "@/lib/utils";

interface ContactDrawerProps {
  contactId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ContactDrawer({ contactId, onClose, onUpdate }: ContactDrawerProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchContact();
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
      });
    } catch (error) {
      console.error("Failed to fetch contact details", error);
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
      fetchContact();
    } catch (error) {
      console.error("Failed to add note", error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleUpdateContact = async () => {
    try {
      await updateContact(contactId, editData);
      setIsEditing(false);
      fetchContact();
      onUpdate();
    } catch (error) {
      console.error("Failed to update contact", error);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContact(contactId);
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Failed to delete contact", error);
    }
  };

  if (!contact && isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex items-center justify-center border-l border-[#E8EAED]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A63E]"></div>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-[#E8EAED] transition-transform animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8EAED]">
          <h2 className="font-bold text-[#1A1D21]">Contact Details</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors"
              title="Edit Contact"
            >
              {isEditing ? <X className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            </button>
            <button 
              onClick={handleDeleteContact}
              className="p-2 hover:bg-[#FCE8E7] rounded-full text-[#D93025] transition-colors"
              title="Delete Contact"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile Card */}
          <div className="p-6 bg-gradient-to-b from-[#F8F9FA] to-white border-b border-[#E8EAED]">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#00A63E] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-green-100 shrink-0">
                {(contact.firstName || contact.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      className="text-sm border border-[#DADCE0] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00A63E]"
                      value={editData.firstName}
                      onChange={e => setEditData({...editData, firstName: e.target.value})}
                      placeholder="First Name"
                    />
                    <input 
                      className="text-sm border border-[#DADCE0] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00A63E]"
                      value={editData.lastName}
                      onChange={e => setEditData({...editData, lastName: e.target.value})}
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <h3 className="text-xl font-bold text-[#1A1D21] truncate mb-1">
                    {contact.firstName || contact.lastName 
                      ? \`\${contact.firstName || ""} \${contact.lastName || ""}\`.trim()
                      : "Unnamed Contact"}
                  </h3>
                )}
                <div className="flex items-center gap-1.5 text-sm text-[#5F6368] mb-3">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{contact.email}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select 
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all",
                      contact.stage === "REPLIED" ? "bg-green-50 text-green-700 border-green-200 ring-green-500" :
                      contact.stage === "CONTACTED" ? "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-500" :
                      "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500"
                    )}
                    value={editData.stage}
                    onChange={e => {
                      const newStage = e.target.value as any;
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
                  </select>
                  
                  {contact.tags?.map(tag => (
                    <span 
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  <button className="h-6 w-6 rounded-full border border-dashed border-[#DADCE0] flex items-center justify-center text-[#9AA0A6] hover:bg-gray-50 transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-[#9AA0A6]" />
                  {isEditing ? (
                    <input 
                      className="flex-1 border-b border-transparent hover:border-[#DADCE0] focus:border-[#00A63E] focus:outline-none transition-colors"
                      value={editData.company}
                      onChange={e => setEditData({...editData, company: e.target.value})}
                      placeholder="Company"
                    />
                  ) : (
                    <span className="text-[#3C4043] font-medium">{contact.company || "No Company"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-[#9AA0A6]" />
                  {isEditing ? (
                    <input 
                      className="flex-1 border-b border-transparent hover:border-[#DADCE0] focus:border-[#00A63E] focus:outline-none transition-colors"
                      value={editData.jobTitle}
                      onChange={e => setEditData({...editData, jobTitle: e.target.value})}
                      placeholder="Job Title"
                    />
                  ) : (
                    <span className="text-[#5F6368]">{contact.jobTitle || "No Job Title"}</span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[#9AA0A6]" />
                  <span className="text-[#5F6368]">Added {format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
                </div>
                {isEditing && (
                  <button 
                    onClick={handleUpdateContact}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#00A63E] text-white rounded text-sm font-medium hover:bg-[#008A34] transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E8EAED]">
            <button 
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === "timeline" ? "text-[#00A63E] border-[#00A63E]" : "text-[#5F6368] border-transparent hover:text-[#1A1D21]"
              )}
              onClick={() => setActiveTab("timeline")}
            >
              Activity Timeline
            </button>
            <button 
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === "notes" ? "text-[#00A63E] border-[#00A63E]" : "text-[#5F6368] border-transparent hover:text-[#1A1D21]"
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
                    className="w-full h-24 p-3 bg-[#F8F9FA] border border-[#E8EAED] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A63E] transition-all resize-none"
                    placeholder="Type a new note here..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isSubmittingNote || !noteContent.trim()}
                    className="absolute bottom-2 right-2 p-2 bg-white text-[#00A63E] border border-[#E8EAED] rounded-lg hover:bg-[#E8F5E9] disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                <div className="space-y-4">
                  {contact.notes?.map(note => (
                    <div key={note.id} className="group relative bg-[#F8F9FA] p-4 rounded-lg border border-transparent hover:border-[#E8EAED] transition-all">
                      <p className="text-sm text-[#3C4043] whitespace-pre-wrap">{note.content}</p>
                      <p className="text-[10px] text-[#9AA0A6] mt-2 font-medium">
                        {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  ))}
                  {(!contact.notes || contact.notes.length === 0) && (
                    <div className="text-center py-10 opacity-50">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-[#9AA0A6]" />
                      <p className="text-sm">No notes yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

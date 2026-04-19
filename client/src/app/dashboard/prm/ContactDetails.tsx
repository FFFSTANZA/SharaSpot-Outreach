"use client";

import { useEffect, useState, useCallback } from "react";
import { getContactById, createNote, updateContact, deleteNote } from "@/lib/apis";
import { Contact, Note, ContactActivity } from "@/types";
import { 
  X, 
  Mail, 
  Building2, 
  Briefcase, 
  Calendar, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Clock, 
  Send,
  Eye,
  MousePointer2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Button from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { InlineLoader } from "@/components/PageLoader";

interface ContactDetailsProps {
  contactId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ContactDetails({ contactId, onClose, onUpdate }: ContactDetailsProps) {
  const { addToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");

  const groupedActivities = useMemo(() => {
    if (!contact?.activities) return [];
    const groups: Record<string, ContactActivity[]> = {};
    contact.activities.forEach(activity => {
      const date = format(new Date(activity.createdAt), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [contact?.activities]);

  const fetchContact = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getContactById(contactId);
      setContact(data);
    } catch (error) {
      addToast("error", "Failed to load contact details");
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [contactId, addToast, onClose]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    try {
      await createNote(contactId, noteContent);
      setNoteContent("");
      fetchContact();
      addToast("success", "Note added");
    } catch (error) {
      addToast("error", "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      fetchContact();
      addToast("success", "Note deleted");
    } catch (error) {
      addToast("error", "Failed to delete note");
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!contact) return;
    try {
      await updateContact(contact.id, { stage: newStage });
      fetchContact();
      onUpdate();
      addToast("success", `Stage updated to ${newStage}`);
    } catch (error) {
      addToast("error", "Failed to update stage");
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><InlineLoader /></div>;
  if (!contact) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-white shrink-0">
        <h2 className="text-lg font-black tracking-tighter text-text-primary uppercase">Contact Details</h2>
        <button onClick={onClose} className="p-2 hover:bg-interactive-hover rounded-full transition-colors">
          <X size={20} className="text-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="p-6 bg-background/30 border-b border-border-light">
          {contact.engagementScore! > 30 && contact.stage !== "REPLIED" && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 animate-pulse">
               <AlertCircle className="text-orange-600 shrink-0" size={18} />
               <div className="text-xs font-black text-orange-800 uppercase tracking-tight">
                 High engagement detected. Consider following up manually.
               </div>
            </div>
          )}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand text-2xl font-black shrink-0 border-2 border-brand/5 shadow-sm">
              {contact.firstName?.[0] || contact.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-text-primary tracking-tighter truncate">
                {contact.firstName ? `${contact.firstName} ${contact.lastName || ''}` : "Unnamed Contact"}
              </h1>
              <div className="flex items-center gap-2 text-text-muted mt-1 font-bold">
                <Mail size={14} />
                <span className="text-sm">{contact.email}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
               <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Score</div>
               <div className={cn(
                 "w-10 h-10 rounded-full border-4 flex items-center justify-center text-sm font-black",
                 (contact.engagementScore || 0) > 50 ? "border-green-500 text-green-600" :
                 (contact.engagementScore || 0) > 20 ? "border-orange-500 text-orange-600" :
                 "border-gray-200 text-gray-400"
               )}>
                 {contact.engagementScore || 0}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-white rounded-xl border border-border-light shadow-sm">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Building2 size={12} /> Company
              </div>
              <div className="text-sm font-black text-text-primary">{contact.company || "—"}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-border-light shadow-sm">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Briefcase size={12} /> Job Title
              </div>
              <div className="text-sm font-black text-text-primary">{contact.jobTitle || "—"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">Pipeline Stage</div>
              <div className="flex flex-wrap gap-2">
                {["COLD", "WARM", "HOT", "REPLIED", "CONVERTED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStageChange(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 transition-all shadow-sm",
                      contact.stage === s 
                        ? "bg-brand border-brand text-white" 
                        : "bg-white border-border-light text-text-muted hover:border-brand/30 hover:text-brand"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Button 
               size="sm" 
               className="mt-5 shadow-lg shadow-brand/20 gap-2"
               onClick={() => window.location.href = `/dashboard/compose?to=${contact.email}`}
            >
              <Send size={14} />
              <span>Compose</span>
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-4 border-b border-border-light bg-white">
          <div className="p-4 border-r border-border-light text-center hover:bg-background/50 transition-colors">
            <div className="text-xl font-black text-text-primary leading-none mb-1">{contact._count?.emailsSent || 0}</div>
            <div className="text-[8px] font-black text-text-muted uppercase tracking-widest">Sent</div>
          </div>
          <div className="p-4 border-r border-border-light text-center hover:bg-background/50 transition-colors">
            <div className="text-xl font-black text-text-primary leading-none mb-1 text-blue-600">{contact._count?.emailsOpened || 0}</div>
            <div className="text-[8px] font-black text-text-muted uppercase tracking-widest">Opens</div>
          </div>
          <div className="p-4 border-r border-border-light text-center hover:bg-background/50 transition-colors">
            <div className="text-xl font-black text-text-primary leading-none mb-1 text-purple-600">{contact._count?.emailsClicked || 0}</div>
            <div className="text-[8px] font-black text-text-muted uppercase tracking-widest">Clicks</div>
          </div>
          <div className="p-4 text-center hover:bg-background/50 transition-colors">
            <div className="text-xl font-black text-text-primary leading-none mb-1 text-green-600">{contact._count?.emailsReplied || 0}</div>
            <div className="text-[8px] font-black text-text-muted uppercase tracking-widest">Replies</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === "timeline" ? "text-brand" : "text-text-muted hover:text-text-secondary"
            )}
          >
            Timeline
            {activeTab === "timeline" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === "notes" ? "text-brand" : "text-text-muted hover:text-text-secondary"
            )}
          >
            Notes ({contact.notes?.length || 0})
            {activeTab === "notes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "timeline" ? (
            <div className="space-y-8">
              {groupedActivities.length > 0 ? (
                groupedActivities.map(([date, activities]) => (
                  <div key={date}>
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <Calendar size={12} />
                       {format(new Date(date), "MMMM d, yyyy")}
                       <div className="flex-1 h-px bg-border-light/50" />
                    </div>
                    <div className="space-y-6 ml-2">
                      {activities.map((activity, idx) => (
                        <div key={activity.id} className="relative flex gap-4">
                          {idx !== activities.length - 1 && (
                            <div className="absolute left-[15px] top-[30px] bottom-[-24px] w-px bg-border-light/50" />
                          )}
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm border border-white",
                            activity.type === "EMAIL_SENT" ? "bg-blue-50 text-blue-600" :
                            activity.type === "EMAIL_OPENED" ? "bg-orange-50 text-orange-600" :
                            activity.type === "EMAIL_CLICKED" ? "bg-purple-50 text-purple-600" :
                            activity.type === "EMAIL_REPLIED" ? "bg-green-50 text-green-600" :
                            activity.type === "STAGE_CHANGED" ? "bg-brand/10 text-brand" :
                            "bg-gray-50 text-gray-600"
                          )}>
                            {activity.type === "EMAIL_SENT" ? <Send size={14} /> :
                             activity.type === "EMAIL_OPENED" ? <Eye size={14} /> :
                             activity.type === "EMAIL_CLICKED" ? <MousePointer2 size={14} /> :
                             activity.type === "EMAIL_REPLIED" ? <MessageSquare size={14} /> :
                             activity.type === "STAGE_CHANGED" ? <CheckCircle2 size={14} /> :
                             <Clock size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-black text-text-primary flex items-center justify-between">
                              {activity.type.replace(/_/g, ' ')}
                              <span className="text-[10px] font-bold text-text-muted">
                                {format(new Date(activity.createdAt), "HH:mm")}
                              </span>
                            </div>
                            {activity.metadata && (
                              <div className="text-xs text-text-muted mt-1 bg-background p-3 rounded-xl border border-border-light/50 font-semibold leading-relaxed">
                                {activity.type === "STAGE_CHANGED" ? (
                                  <span>Stage changed from <span className="font-black text-text-secondary uppercase tracking-wider text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{activity.metadata.from}</span> to <span className="font-black text-brand uppercase tracking-wider text-[10px] bg-brand/10 px-1.5 py-0.5 rounded">{activity.metadata.to}</span></span>
                                ) : activity.type === "EMAIL_SENT" ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Subject</span>
                                    <span className="text-text-secondary">{activity.metadata.subject}</span>
                                  </div>
                                ) : activity.type === "EMAIL_OPENED" ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Subject</span>
                                    <span className="text-text-secondary">{activity.metadata.subject || "Unknown subject"}</span>
                                  </div>
                                ) : activity.type === "EMAIL_CLICKED" ? (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Subject</span>
                                      <span className="text-text-secondary">{activity.metadata.subject || "Unknown subject"}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-black uppercase text-text-muted tracking-widest text-purple-600">Clicked Link</span>
                                      <span className="text-text-secondary truncate block">{activity.metadata.url}</span>
                                    </div>
                                  </div>
                                ) : activity.type === "EMAIL_REPLIED" ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">In reply to</span>
                                    <span className="text-text-secondary font-black">{activity.metadata.subject || "Unknown subject"}</span>
                                  </div>
                                ) : (
                                  JSON.stringify(activity.metadata)
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border-light rounded-2xl">
                  <Clock className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-black text-text-muted uppercase tracking-widest">No activities recorded</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleAddNote} className="relative">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Capture key insights or next steps..."
                  className="w-full bg-background border border-border-light rounded-2xl p-4 text-sm font-semibold min-h-[120px] focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                />
                <div className="absolute right-3 bottom-3">
                  <Button
                    size="sm"
                    type="submit"
                    disabled={!noteContent.trim() || isSubmittingNote}
                    className="h-8 gap-2"
                  >
                    <Plus size={14} />
                    <span>Save Note</span>
                  </Button>
                </div>
              </form>

              <div className="space-y-4">
                {contact.notes && contact.notes.length > 0 ? (
                  contact.notes.map((note) => (
                    <div key={note.id} className="bg-white border border-border-light rounded-2xl p-4 shadow-sm hover:border-brand/20 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} />
                          {format(new Date(note.createdAt), "MMMM d, yyyy")}
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-text-muted hover:text-error-text opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-text-secondary whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-border-light rounded-2xl">
                    <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-muted">No notes yet. Add one above.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

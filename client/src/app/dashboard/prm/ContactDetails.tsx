"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getContactById, createNote, deleteNote } from "@/lib/apis";
import { Contact, ContactActivity } from "@/types";
import {
  X,
  Edit3,
  Mail,
  Globe,
  Calendar,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  Send,
  Eye,
  MousePointer2,
  CheckCircle2,
  AlertCircle,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Button from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { InlineLoader } from "@/components/PageLoader";
import { getNextActionLabel, getStageLabel } from "./prmFields";
import { getPriorityLevel } from "./prmInsights";

interface ContactDetailsProps {
  contactId: string;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
}

const getMetadataText = (metadata: Record<string, unknown> | null | undefined, key: string, fallback = ""): string => {
  const value = metadata?.[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
};

export function ContactDetails({ contactId, onClose, onEdit }: ContactDetailsProps) {
  const { addToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");
  const [timelineFilter, setTimelineFilter] = useState<string | null>(null);

  const groupedActivities = useMemo(() => {
    if (!contact?.activities) return [];

    let filtered = contact.activities;
    if (timelineFilter) {
      filtered = contact.activities.filter((a) => a.type === timelineFilter);
    }

    const groups: Record<string, ContactActivity[]> = {};
    filtered.forEach((activity) => {
      const date = format(new Date(activity.createdAt), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [contact?.activities, timelineFilter]);

  const fetchContact = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const data = await getContactById(contactId);
        setContact(data);
      } catch {
        addToast("error", "Failed to load contact details");
        onClose();
      } finally {
        setIsLoading(false);
      }
    },
    [contactId, addToast, onClose]
  );

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
    } catch {
      addToast("error", "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(noteId);
      fetchContact();
      addToast("success", "Note deleted");
    } catch {
      addToast("error", "Failed to delete note");
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><InlineLoader /></div>;
  if (!contact) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-light bg-white px-4 py-2.5 shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">Contact</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contact)}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
          >
            <Edit3 size={12} />
            Edit
          </button>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3]">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="border-b border-border-light p-4 sm:p-5">
          {(contact.engagementScore ?? 0) > 30 && contact.stage !== "REPLIED" && (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-brand-light p-3">
              <AlertCircle className="text-brand shrink-0" size={16} />
              <div className="text-xs font-medium text-brand">
                High engagement — consider following up.
              </div>
            </div>
          )}

          <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-muted/40 text-sm font-semibold text-brand">
                  {contact.firstName?.[0] || contact.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-brand-light px-2 py-0.5 text-[11px] font-medium text-brand">
                      {getStageLabel(contact.stage)}
                    </span>
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[11px] font-medium",
                      getPriorityLevel(contact) === "high"
                        ? "bg-brand-light text-brand"
                        : getPriorityLevel(contact) === "medium"
                          ? "bg-[#F8F9FA] text-text-secondary"
                          : "bg-[#F8F9FA] text-text-muted"
                    )}>
                      {getPriorityLevel(contact)} focus
                    </span>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-text-primary">
                    {contact.firstName ? `${contact.firstName} ${contact.lastName || ""}` : "Unnamed Contact"}
                    </h1>
                    <div className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold",
                      (contact.engagementScore || 0) > 0 ? "bg-brand-light text-brand" : "bg-[#F8F9FA] text-text-muted"
                    )}>
                      {contact.engagementScore || 0}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-text-muted">
                    <Mail size={14} />
                    <span className="min-w-0 truncate text-sm">{contact.email}</span>
                  </div>
                  {contact.website && (
                    <div className="mt-1 flex items-center gap-2 text-text-muted">
                      <Globe size={14} />
                      <span className="min-w-0 truncate text-sm">{contact.website}</span>
                    </div>
                  )}
                  <div className="mt-3 grid gap-x-3 gap-y-2 sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-medium text-text-muted">Company</div>
                      <div className="mt-0.5 text-sm font-medium text-text-primary">{contact.company || "No company"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-text-muted">Role</div>
                      <div className="mt-0.5 text-sm font-medium text-text-primary">{contact.jobTitle || "No title"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-text-muted">Owner</div>
                      <div className="mt-0.5 text-sm font-medium text-text-primary">{contact.assignedTo ? (contact.assignedTo.name || contact.assignedTo.email) : "Unassigned"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-text-muted">Domain</div>
                      <div className="mt-0.5 truncate text-sm font-medium text-text-primary">{contact.companyDomain || "No domain"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {!!contact.techStack?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {contact.techStack.map((tech) => (
                    <span key={tech} className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
          </>

          <div className="mb-5 grid gap-0 sm:grid-cols-2">
            <div className="border-b border-border-light py-2.5 sm:border-r sm:border-b-0 sm:pr-4">
              <div className="text-[11px] font-medium text-text-muted">Next action</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">{getNextActionLabel(contact.nextAction)}</div>
              <div className="text-xs text-text-muted">
                {contact.nextActionDueAt ? `Due ${new Date(contact.nextActionDueAt).toLocaleDateString()}` : "No due date"}
              </div>
            </div>
            <div className="border-b border-border-light py-2.5 sm:pl-4 sm:border-b-0">
              <div className="text-[11px] font-medium text-text-muted">Last touch</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">
                {contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString() : "No outreach yet"}
              </div>
              <div className="text-xs text-text-muted">Engagement {contact.engagementScore || 0}</div>
            </div>
          </div>

          {(contact.tags?.length || 0) > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-[11px] font-medium text-text-muted">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags?.map((tag) => (
                  <span key={tag.id} className="rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(contact.lists?.length || 0) > 0 && (
            <div className="mb-6">
              <div className="mb-2 text-[11px] font-medium text-text-muted">Lists</div>
              <div className="flex flex-wrap gap-1.5">
                {contact.lists?.map((list) => (
                  <span key={list.id} className="flex items-center gap-1 rounded bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                    <Folder size={10} /> {list.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Strip */}
        <div className="flex border-b border-border-light">
          {[
            { label: "Sent", filterKey: "EMAIL_SENT", value: contact._count?.emailsSent || 0 },
            { label: "Opens", filterKey: "EMAIL_OPENED", value: contact._count?.emailsOpened || 0 },
            { label: "Clicks", filterKey: "EMAIL_CLICKED", value: contact._count?.emailsClicked || 0 },
            { label: "Replies", filterKey: "EMAIL_REPLIED", value: contact._count?.emailsReplied || 0 },
          ].map((stat) => (
            <button
              key={stat.filterKey}
              onClick={() => {
                setTimelineFilter(timelineFilter === stat.filterKey ? null : stat.filterKey);
                setActiveTab("timeline");
              }}
              className={cn(
                "flex-1 border-r border-border-light last:border-r-0 py-3 text-center transition-colors hover:bg-[#F8F9FA]",
                timelineFilter === stat.filterKey && "bg-brand-light"
              )}
            >
              <div className="text-lg font-semibold text-text-primary">{stat.value}</div>
              <div className="text-[10px] font-medium text-text-muted">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light">
          <button
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition-all",
              activeTab === "timeline" ? "text-brand border-b-2 border-brand" : "text-text-muted hover:text-text-secondary"
            )}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition-all",
              activeTab === "notes" ? "text-brand border-b-2 border-brand" : "text-text-muted hover:text-text-secondary"
            )}
          >
            Notes ({contact.notes?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "timeline" ? (
            <div className="space-y-6">
              {groupedActivities.length > 0 ? (
                groupedActivities.map(([date, activities]) => (
                  <div key={date}>
                    <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
                      <Calendar size={12} />
                      {format(new Date(date), "MMMM d, yyyy")}
                      <div className="flex-1 h-px bg-border-light" />
                    </div>
                    <div className="space-y-4">
                      {activities.map((activity, idx) => (
                        <div key={activity.id} className="flex gap-3">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                              "bg-brand-light text-brand"
                            )}
                          >
                            {activity.type === "EMAIL_SENT" ? <Send size={12} /> :
                              activity.type === "EMAIL_OPENED" ? <Eye size={12} /> :
                                activity.type === "EMAIL_CLICKED" ? <MousePointer2 size={12} /> :
                                  activity.type === "EMAIL_REPLIED" ? <MessageSquare size={12} /> :
                                    activity.type === "STAGE_CHANGED" ? <CheckCircle2 size={12} /> :
                                      <Clock size={12} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-text-primary capitalize">{activity.type.replace(/_/g, " ").toLowerCase()}</span>
                              <span className="text-xs text-text-muted shrink-0">
                                {format(new Date(activity.createdAt), "HH:mm")}
                              </span>
                            </div>
                            {activity.metadata && (
                              <div className="mt-1 rounded-lg bg-[#F8F9FA] p-2.5 text-xs text-text-muted">
                                {activity.type === "STAGE_CHANGED" ? (
                                  <span>From <span className="font-medium text-text-secondary">{getMetadataText(activity.metadata, "from")}</span> to <span className="font-medium text-brand">{getMetadataText(activity.metadata, "to")}</span></span>
                                ) : activity.type === "EMAIL_SENT" || activity.type === "EMAIL_OPENED" ? (
                                  <span>Subject: <span className="text-text-secondary">{getMetadataText(activity.metadata, "subject", "Unknown")}</span></span>
                                ) : activity.type === "EMAIL_CLICKED" ? (
                                  <div>
                                    <div>Subject: <span className="text-text-secondary">{getMetadataText(activity.metadata, "subject", "Unknown")}</span></div>
                                    <div>Link: <span className="text-text-secondary truncate">{getMetadataText(activity.metadata, "url")}</span></div>
                                  </div>
                                ) : activity.type === "EMAIL_REPLIED" ? (
                                  <span>Re: <span className="text-text-secondary font-medium">{getMetadataText(activity.metadata, "subject", "Unknown")}</span></span>
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock size={24} className="text-text-muted mb-2 opacity-50" />
                  <p className="text-sm font-medium text-text-muted">No activity yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleAddNote}>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Capture key insights or next steps..."
                  className="w-full rounded-lg border border-border-light bg-[#F8F9FA] p-3 text-sm min-h-[100px] outline-none transition-all focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-brand/10"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    type="submit"
                    disabled={!noteContent.trim() || isSubmittingNote}
                    className="h-7 text-xs"
                  >
                    <Plus size={12} />
                    Save Note
                  </Button>
                </div>
              </form>

              <div className="space-y-3">
                {contact.notes && contact.notes.length > 0 ? (
                  contact.notes.map((note) => (
                    <div key={note.id} className="group border-b border-border-light pb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-text-muted hover:text-error-text opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare size={24} className="text-text-muted mb-2 opacity-50" />
                    <p className="text-sm font-medium text-text-muted">No notes yet</p>
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

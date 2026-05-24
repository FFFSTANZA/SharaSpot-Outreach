"use client";

import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Inbox,
  Search,
  Filter,
  MoreHorizontal,
  MessageSquare,
  Archive,
  Star,
  Trash2,
  MailOpen,
  Send,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import {
  getInboxThreads,
  getInboxEmails,
  syncInbox,
  getSenders,
  sendInboxReply,
  markInboxRead,
  toggleInboxStar,
  archiveInboxEmail,
  deleteInboxEmail,
} from "@/lib/apis";

type FilterKey = "ALL" | "UNREAD" | "STARRED" | "ARCHIVED";

interface ThreadView {
  id: string;
  threadId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  snippet: string;
  receivedAt: string;
  unreadCount: number;
  isStarred: boolean;
}

interface EmailView {
  id: string;
  threadId: string | null;
  messageId: string;
  inReplyTo: string | null;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyText: string;
  bodyHtml: string | null;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
}

export default function InboxPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [threads, setThreads] = useState<ThreadView[]>([]);
  const [emailsByThread, setEmailsByThread] = useState<Record<string, EmailView[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [currentSenderId, setCurrentSenderId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [draftReply, setDraftReply] = useState("");

  const queryOpts = useMemo(() => ({
    unreadOnly: activeFilter === "UNREAD",
    starredOnly: activeFilter === "STARRED",
    archivedOnly: activeFilter === "ARCHIVED",
    search: query.trim() || undefined,
    limit: 50,
  }), [activeFilter, query]);

  const fetchInboxData = useCallback(async () => {
    setIsLoading(true);
    try {
      const senders = await getSenders();
      const senderId = senders[0]?.id;
      if (!senderId) {
        setThreads([]);
        setEmailsByThread({});
        setSelectedThreadId(null);
        return;
      }
      setCurrentSenderId(senderId);

      const threadsRes = await getInboxThreads(senderId, queryOpts);
      const mappedThreads: ThreadView[] = (threadsRes.threads || []).map((t: any) => ({
        id: t.id,
        threadId: t.threadId || t.id,
        subject: t.subject || "No subject",
        fromName: t.fromName || t.lastSenderEmail || "Unknown",
        fromEmail: t.fromEmail || t.lastSenderEmail || "",
        snippet: t.lastSnippet || "",
        receivedAt: t.lastMessageAt || new Date().toISOString(),
        unreadCount: Number(t.unreadCount || 0),
        isStarred: Boolean(t.isStarred),
      }));

      const grouped: Record<string, EmailView[]> = {};
      await Promise.all(mappedThreads.slice(0, 25).map(async (thread) => {
        const emailsRes = await getInboxEmails(senderId, {
          ...queryOpts,
          threadId: thread.threadId,
          limit: 100,
        });
        grouped[thread.id] = (emailsRes.emails || []).map((e: any) => ({
          id: e.id,
          threadId: e.threadId || null,
          messageId: e.messageId,
          inReplyTo: e.inReplyTo || null,
          subject: e.subject || "No subject",
          fromName: e.fromName || e.fromEmail || "Unknown",
          fromEmail: e.fromEmail || "",
          bodyText: e.bodyText || e.snippet || "",
          bodyHtml: e.bodyHtml || null,
          receivedAt: e.receivedAt || new Date().toISOString(),
          isRead: Boolean(e.isRead),
          isStarred: Boolean(e.isStarred),
        }));
      }));

      setThreads(mappedThreads);
      setEmailsByThread(grouped);
      setSelectedThreadId((prev) => {
        if (!mappedThreads.length) return null;
        if (prev && mappedThreads.some((t) => t.id === prev)) return prev;
        return mappedThreads[0].id;
      });
    } catch {
      addToast("error", "Failed to load inbox");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, queryOpts]);

  useEffect(() => {
    fetchInboxData();
  }, [fetchInboxData]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || null;
  const selectedEmails = selectedThread ? (emailsByThread[selectedThread.id] || []) : [];

  const handleSync = useCallback(async () => {
    if (!currentSenderId) return;
    setIsLoading(true);
    try {
      await syncInbox(currentSenderId);
      addToast("success", "Inbox synced");
      await fetchInboxData();
    } catch {
      addToast("error", "Inbox sync failed");
      setIsLoading(false);
    }
  }, [addToast, currentSenderId, fetchInboxData]);

  const markThreadRead = async (threadId: string) => {
    const emails = emailsByThread[threadId] || [];
    const unread = emails.filter((e) => !e.isRead);
    if (!unread.length) return;
    await Promise.all(unread.map((e) => markInboxRead(e.id)));
    await fetchInboxData();
  };

  const toggleThreadStar = async (threadId: string) => {
    const emails = emailsByThread[threadId] || [];
    if (!emails.length) return;
    await toggleInboxStar(emails[0].id);
    await fetchInboxData();
  };

  const archiveThread = async () => {
    if (!selectedThread) return;
    try {
      const emails = emailsByThread[selectedThread.id] || [];
      await Promise.all(emails.map((e) => archiveInboxEmail(e.id)));
      addToast("success", "Conversation archived");
      await fetchInboxData();
    } catch {
      addToast("error", "Failed to archive conversation");
    }
  };

  const deleteThread = async () => {
    if (!selectedThread) return;
    try {
      const emails = emailsByThread[selectedThread.id] || [];
      await Promise.all(emails.map((e) => deleteInboxEmail(e.id)));
      addToast("success", "Conversation deleted");
      await fetchInboxData();
    } catch {
      addToast("error", "Failed to delete conversation");
    }
  };

  const sendReply = async () => {
    if (!selectedThread || !selectedEmails.length || !draftReply.trim() || !currentSenderId) return;
    const latest = selectedEmails[0];
    setIsSending(true);
    try {
      await sendInboxReply({
        senderId: currentSenderId,
        toEmail: selectedThread.fromEmail,
        subject: selectedThread.subject.toLowerCase().startsWith("re:") ? selectedThread.subject : `Re: ${selectedThread.subject}`,
        body: draftReply.trim(),
        inReplyToMessageId: latest.messageId,
        threadId: latest.threadId || undefined,
      });
      setDraftReply("");
      addToast("success", "Reply sent");
      await fetchInboxData();
    } catch {
      addToast("error", "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const filterItems = [
    { key: "ALL" as FilterKey, label: "All", icon: <Inbox size={18} /> },
    { key: "UNREAD" as FilterKey, label: "Unread", icon: <MailOpen size={18} /> },
    { key: "STARRED" as FilterKey, label: "Starred", icon: <Star size={18} /> },
    { key: "ARCHIVED" as FilterKey, label: "Archived", icon: <Archive size={18} /> },
  ];

  return (
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-background font-sans text-text-primary">
            <Sidebar
              currentLabel={filterItems.find((f) => f.key === activeFilter)?.label || "Inbox"}
              setLabel={(label) => {
                const found = filterItems.find((item) => item.label === label);
                if (found) setActiveFilter(found.key);
              }}
              items={filterItems.map((f) => ({ label: f.label, icon: f.icon }))}
              profile={{
                name: user?.name ?? "User",
                email: user?.email ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              }}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
              <div className="bg-white rounded-2xl border border-border-light shadow-premium-lg flex flex-col grow overflow-hidden">
                <TopBar placeholder="Search in conversations..." onRefresh={handleSync} isRefreshing={isLoading} />

                <div className="flex flex-1 overflow-hidden">
                  <div className={cn("w-full lg:w-[400px] border-r border-border-light flex flex-col bg-white overflow-hidden", selectedThreadId && "hidden lg:flex")}>
                    <div className="px-6 py-4 border-b border-border-light bg-white shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
                        <button className="p-2 hover:bg-interactive-hover rounded-lg text-text-muted transition-colors" title="Filters are active from sidebar">
                          <Filter size={18} />
                        </button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          type="text"
                          placeholder="Filter by subject, name, email..."
                          className="w-full pl-10 pr-4 py-2.5 bg-interactive-hover/50 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {threads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={async () => {
                            setSelectedThreadId(thread.id);
                            await markThreadRead(thread.id);
                          }}
                          className={cn(
                            "px-6 py-5 cursor-pointer border-b border-border-light transition-all relative group",
                            selectedThreadId === thread.id ? "bg-brand/5 border-l-4 border-l-brand" : "hover:bg-interactive-hover/10"
                          )}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className={cn("text-sm font-bold truncate pr-4", thread.unreadCount > 0 ? "text-text-primary" : "text-text-secondary")}>{thread.fromName}</span>
                            <span className="text-[10px] font-bold text-text-muted whitespace-nowrap uppercase tracking-wider">
                              {new Date(thread.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className={cn("text-xs font-bold truncate mb-1.5", thread.unreadCount > 0 ? "text-brand" : "text-text-secondary")}>{thread.subject}</div>
                          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-medium">{thread.snippet}</p>

                          {thread.unreadCount > 0 && <div className="absolute right-4 bottom-5 h-2 w-2 bg-brand rounded-full" />}

                          <button
                            className={cn(
                              "absolute right-10 bottom-4 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100",
                              thread.isStarred ? "text-amber-400 opacity-100" : "text-text-muted hover:text-amber-400"
                            )}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await toggleThreadStar(thread.id);
                            }}
                          >
                            <Star size={14} fill={thread.isStarred ? "currentColor" : "none"} />
                          </button>
                        </div>
                      ))}

                      {!isLoading && threads.length === 0 && (
                        <div className="p-6 text-sm text-text-muted">No conversations found for this filter.</div>
                      )}
                    </div>
                  </div>

                  <div className={cn("flex-1 flex flex-col bg-interactive-hover/10 overflow-hidden", !selectedThreadId && "hidden lg:flex")}>
                    {selectedThread ? (
                      <>
                        <div className="px-8 py-5 border-b border-border-light bg-white shrink-0 flex items-center justify-between shadow-sm z-10">
                          <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedThreadId(null)} className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors">
                              <ArrowLeft size={20} />
                            </button>
                            <div className="h-11 w-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand text-lg font-bold shadow-sm">
                              {selectedThread.fromName.charAt(0)}
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-text-primary leading-tight">{selectedThread.subject}</h2>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[13px] font-bold text-text-secondary">{selectedThread.fromName}</span>
                                <span className="text-[11px] font-medium text-text-muted tracking-tight">&lt;{selectedThread.fromEmail}&gt;</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={archiveThread} variant="outline" size="sm" className="hidden sm:flex gap-2 h-9 rounded-lg">
                              <Archive size={16} />
                              <span>Archive</span>
                            </Button>
                            <Button onClick={deleteThread} variant="outline" size="sm" className="hidden sm:flex gap-2 h-9 rounded-lg text-error-text border-error-border/30 hover:bg-error-bg/20">
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                          {selectedEmails.map((email) => (
                            <div key={email.id} className="flex flex-col items-start max-w-[85%]">
                              <div className="bg-white border border-border-light p-6 rounded-2xl rounded-tl-none shadow-premium-sm text-[14px] leading-relaxed text-text-primary font-medium w-full overflow-hidden">
                                {email.bodyHtml ? (
                                  <iframe
                                    srcDoc={`<!DOCTYPE html><html><body style=\"font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#374151;font-size:14px;\">${email.bodyHtml}</body></html>`}
                                    title="Email Content"
                                    className="w-full border-none min-h-[280px]"
                                    sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                                  />
                                ) : (
                                  <div className="whitespace-pre-wrap">{email.bodyText}</div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-text-muted mt-2.5 uppercase tracking-[0.1em]">Received {new Date(email.receivedAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-6 bg-white border-t border-border-light shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10">
                          <div className="border border-border-light rounded-2xl overflow-hidden focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/5 transition-all bg-interactive-hover/5">
                            <textarea
                              value={draftReply}
                              onChange={(e) => setDraftReply(e.target.value)}
                              onKeyDown={async (e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                  e.preventDefault();
                                  await sendReply();
                                }
                              }}
                              placeholder={`Reply to ${selectedThread.fromName}...`}
                              className="w-full p-5 h-36 resize-none text-[14px] focus:outline-none bg-transparent placeholder:text-text-muted placeholder:font-medium font-medium"
                            />
                            <div className="px-5 py-3.5 bg-white border-t border-border-light flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-text-muted">
                                <button className="p-2 hover:bg-interactive-hover hover:text-text-primary rounded-lg transition-all" title="Templates">
                                  <MessageSquare size={18} />
                                </button>
                                <button className="p-2 hover:bg-interactive-hover hover:text-text-primary rounded-lg transition-all" title="Options">
                                  <MoreHorizontal size={18} />
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider hidden sm:block">Press CMD/Ctrl+Enter to send</span>
                                <Button onClick={sendReply} disabled={isSending || !draftReply.trim()} className="gap-2.5 px-7 h-11 rounded-xl">
                                  <Send size={16} />
                                  <span className="font-bold">{isSending ? "Sending..." : "Send Reply"}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                        <div className="h-24 w-24 bg-white border border-border-light rounded-[2.5rem] flex items-center justify-center text-text-muted mb-8 shadow-sm">
                          <Inbox size={48} />
                        </div>
                        <h3 className="text-xl font-extrabold text-text-primary tracking-tight">Universal Inbox</h3>
                        <p className="text-sm text-text-secondary mt-3 max-w-xs font-medium leading-relaxed">
                          Select a conversation from the left to view thread history and respond instantly.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}

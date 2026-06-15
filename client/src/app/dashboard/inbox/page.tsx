"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Inbox,
  Search,
  MoreHorizontal,
  MessageSquare,
  Archive,
  Star,
  Trash2,
  Send,
  ArrowLeft,
  Menu,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
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
import { useSidebar } from "@/hooks/useSidebar";
import type { InboxThread, InboxEmail, SenderResponse } from "@/types";

type FilterKey = "ALL" | "UNREAD" | "STARRED" | "ARCHIVED";

function InboxContent() {
  const { toggle } = useSidebar();
  const { addToast } = useToast();

  const [senders, setSenders] = useState<SenderResponse[]>([]);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [emailsByThread, setEmailsByThread] = useState<Record<string, InboxEmail[]>>({});
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

  const fetchEmailsForThread = useCallback(async (senderId: string, threadId: string) => {
    if (!threadId || !senderId) return;
    try {
      const emailsRes = await getInboxEmails(senderId, {
        threadId,
        limit: 100,
      });
      setEmailsByThread(prev => ({
        ...prev,
        [threadId]: emailsRes.emails || [],
      }));
    } catch {
      // Individual thread email fetch failure is non-critical
    }
  }, []);

  const fetchInboxData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSenders = await getSenders();
      setSenders(fetchedSenders);

      const senderId = fetchedSenders[0]?.id;
      if (!senderId) {
        setThreads([]);
        setEmailsByThread({});
        setSelectedThreadId(null);
        return;
      }
      setCurrentSenderId(senderId);

      const threadsRes = await getInboxThreads(senderId, queryOpts);
      setThreads(threadsRes.threads || []);

      setSelectedThreadId((prev) => {
        const mapped = threadsRes.threads || [];
        if (!mapped.length) return null;
        if (prev && mapped.some((t) => t.id === prev)) return prev;
        return mapped[0].id;
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

  useEffect(() => {
    if (selectedThreadId && currentSenderId) {
      fetchEmailsForThread(currentSenderId, selectedThreadId);
    }
  }, [selectedThreadId, currentSenderId, fetchEmailsForThread]);

  const handleSwitchSender = async (senderId: string) => {
    if (senderId === currentSenderId) return;
    setCurrentSenderId(senderId);
    setIsLoading(true);
    setThreads([]);
    setEmailsByThread({});
    setSelectedThreadId(null);
    try {
      const threadsRes = await getInboxThreads(senderId, queryOpts);
      setThreads(threadsRes.threads || []);
      const mapped = threadsRes.threads || [];
      if (mapped.length > 0) {
        setSelectedThreadId(mapped[0].id);
      }
    } catch {
      addToast("error", "Failed to load inbox");
    } finally {
      setIsLoading(false);
    }
  };

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

  const currentSender = senders.find(s => s.id === currentSenderId);

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      <div className="mx-auto w-full max-w-[1600px] flex grow flex-col overflow-hidden rounded-lg border border-border-light bg-white">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border-light px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                aria-label="Open sidebar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
              >
                <Menu size={14} />
              </button>
              <h1 className="text-base font-semibold text-text-primary">Inbox</h1>
              {senders.length > 1 && (
                <div className="relative group">
                  <button
                    className="ml-2 flex h-7 items-center gap-1 rounded-md border border-border-light px-2 text-xs font-medium text-text-secondary hover:bg-[#F0F1F3] transition-all"
                  >
                    {currentSender?.email || "Select account"}
                    <ChevronDown size={10} />
                  </button>
                  <div className="absolute left-0 top-full z-50 mt-1 hidden min-w-[200px] rounded-lg border border-border-light bg-white shadow-premium-lg group-hover:block hover:block">
                    {senders.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSwitchSender(s.id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                          s.id === currentSenderId
                            ? "bg-brand-light text-brand font-semibold"
                            : "text-text-secondary hover:bg-[#F0F1F3] hover:text-text-primary"
                        )}
                      >
                        <span className="truncate">{s.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary disabled:opacity-50"
              aria-label="Sync inbox"
            >
              <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
              Sync
            </button>
          </div>

          {/* Body: thread list + detail */}
          <div className="flex flex-1 overflow-hidden">
            {/* Thread List */}
            <div className={cn("w-full min-[1180px]:w-[400px] border-r border-border-light flex flex-col overflow-hidden", selectedThreadId && "hidden min-[1180px]:flex")}>
              <div className="border-b border-border-light px-4 py-3 sm:px-6 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="text"
                    placeholder="Filter by subject, name, email..."
                    className="w-full rounded-lg border border-border-light bg-[#F8F9FA] py-1.5 pl-8 pr-2.5 text-sm outline-none transition-all focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-brand/10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 border-b border-border-light px-4 py-1.5 sm:px-6 shrink-0">
                {(["ALL", "UNREAD", "STARRED", "ARCHIVED"] as FilterKey[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "h-7 rounded-md px-2.5 text-xs font-medium transition-all",
                      activeFilter === f
                        ? "bg-brand-light text-brand"
                        : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary"
                    )}
                  >
                    {f === "ALL" ? "All" : f === "UNREAD" ? "Unread" : f === "STARRED" ? "Starred" : "Archived"}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                {isLoading && threads.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-text-muted">Loading...</div>
                ) : threads.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
                    <Inbox size={28} className="text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">No conversations found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-light">
                    {threads.map((thread) => {
                      const displayName = thread.fromName || thread.lastSenderEmail || "Unknown";
                      return (
                      <div
                        key={thread.id}
                        onClick={async () => {
                          setSelectedThreadId(thread.id);
                          await markThreadRead(thread.id);
                        }}
                        className={cn(
                          "relative px-4 py-3 sm:px-6 transition-all group cursor-pointer",
                          selectedThreadId === thread.id ? "bg-brand-light/40" : "hover:bg-[#F8F9FA]"
                        )}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={cn("text-sm font-semibold truncate", thread.unreadCount > 0 ? "text-text-primary" : "text-text-secondary")}>
                            {displayName}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-text-muted">
                            {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className={cn("text-xs font-medium truncate mb-1", thread.unreadCount > 0 ? "text-brand" : "text-text-secondary")}>
                          {thread.subject}
                        </div>
                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{thread.lastSnippet || thread.snippet}</p>

                        {thread.unreadCount > 0 && (
                          <span className="absolute right-4 top-3 h-2 w-2 rounded-full bg-brand" />
                        )}

                        <button
                          className={cn(
                            "absolute right-4 bottom-3 flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                            thread.isStarred
                              ? "text-brand opacity-100"
                              : "text-text-muted opacity-0 group-hover:opacity-100 hover:text-brand"
                          )}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await toggleThreadStar(thread.id);
                          }}
                        >
                          <Star size={12} fill={thread.isStarred ? "currentColor" : "none"} />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className={cn("flex-1 flex flex-col overflow-hidden", !selectedThreadId && "hidden min-[1180px]:flex")}>
              {selectedThread ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-border-light bg-white px-4 py-3 sm:px-6 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setSelectedThreadId(null)}
                        aria-label="Back to conversations"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] min-[1180px]:hidden"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light text-xs font-bold text-brand">
                        {(selectedThread.fromName || selectedThread.lastSenderEmail || "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text-primary truncate">{selectedThread.subject}</h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <span>{selectedThread.fromName || selectedThread.lastSenderEmail}</span>
                          <span className="text-text-muted">&lt;{selectedThread.fromEmail}&gt;</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={archiveThread}
                        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                      >
                        <Archive size={12} />
                        Archive
                      </button>
                      <button
                        onClick={deleteThread}
                        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-error-bg hover:text-error-text"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-6 custom-scrollbar">
                    {selectedEmails.map((email) => (
                      <div key={email.id} className="max-w-[85%]">
                        <div className="rounded-lg border border-border-light bg-white p-5 text-sm leading-relaxed text-text-primary overflow-hidden">
                          {email.bodyHtml ? (
                            <iframe
                              srcDoc={`<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#374151;font-size:14px;">${email.bodyHtml}</body></html>`}
                              title="Email Content"
                              className="w-full border-none min-h-[280px]"
                              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">{email.bodyText || email.snippet}</div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-text-muted mt-2 block">
                          Received {new Date(email.receivedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border-light bg-white px-4 py-4 sm:px-6">
                    <div className="rounded-lg border border-border-light overflow-hidden focus-within:border-brand/30 focus-within:ring-2 focus-within:ring-brand/10">
                      <textarea
                        value={draftReply}
                        onChange={(e) => setDraftReply(e.target.value)}
                        onKeyDown={async (e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            await sendReply();
                          }
                        }}
                        placeholder={`Reply to ${selectedThread.fromName || selectedThread.lastSenderEmail || "Unknown"}...`}
                        className="w-full p-4 h-32 resize-none text-sm focus:outline-none bg-transparent placeholder:text-text-muted"
                      />
                      <div className="flex items-center justify-between border-t border-border-light bg-[#F8F9FA] px-4 py-2">
                        <div className="flex items-center gap-1 text-text-muted">
                          <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white hover:text-text-secondary transition-all" title="Templates">
                            <MessageSquare size={14} />
                          </button>
                          <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white hover:text-text-secondary transition-all" title="Options">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-text-muted hidden sm:block">Cmd+Enter to send</span>
                          <button
                            onClick={sendReply}
                            disabled={isSending || !draftReply.trim()}
                            className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                          >
                            <Send size={12} />
                            {isSending ? "Sending..." : "Send Reply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
                  <Inbox size={48} className="text-text-muted mb-3" />
                  <h3 className="text-base font-semibold text-text-primary">Universal Inbox</h3>
                  <p className="text-sm text-text-muted mt-2 max-w-xs">
                    Select a conversation from the left to view thread history and respond instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
        <InboxContent />
      </ErrorBoundary>
    </AuthGuard>
  );
}

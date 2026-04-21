"use client";

import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import {
    Inbox,
    Search,
    Filter,
    MoreHorizontal,
    User,
    Clock,
    CheckCircle2,
    MessageSquare,
    Archive,
    Star,
    Trash2,
    Reply,
    Forward,
    MoreVertical,
    MailOpen,
    Send,
    ArrowLeft
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import { getInboxThreads, getInboxEmails, syncInbox, getSenders } from "@/lib/apis";

interface Thread {
    id: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    snippet: string;
    receivedAt: string;
    isRead: boolean;
    isStarred: boolean;
    status: string;
}

interface Email {
    id: string;
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
    const [threads, setThreads] = useState<Thread[]>([]);
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [currentSenderId, setCurrentSenderId] = useState<string>("");

    const fetchInboxData = useCallback(async () => {
        setIsLoading(true);
        try {
            const senders = await getSenders();
            const senderId = senders[0]?.id;
            console.log("[Inbox] Found sender:", senderId);
            if (!senderId) {
                setIsLoading(false);
                return;
            }
            setCurrentSenderId(senderId);

            console.log("[Inbox] Fetching threads and emails...");
            const [threadsRes, emailsRes] = await Promise.all([
                getInboxThreads(senderId),
                getInboxEmails(senderId)
            ]);

            console.log("[Inbox] Threads response:", threadsRes);
            console.log("[Inbox] Emails response:", emailsRes);

            // Build thread list from threads OR emails
            let mappedThreads: Thread[] = [];

            if (threadsRes.threads && threadsRes.threads.length > 0) {
                mappedThreads = threadsRes.threads.map((t: any) => ({
                    id: t.id,
                    subject: t.subject || "No subject",
                    fromName: t.fromName || t.fromEmail || "Unknown",
                    fromEmail: t.fromEmail || "",
                    snippet: t.snippet || "",
                    receivedAt: t.lastMessageAt || t.receivedAt || new Date().toISOString(),
                    isRead: !t.unreadCount || t.unreadCount === 0,
                    isStarred: t.isStarred || false,
                    status: t.status || "ACTIVE"
                }));
            } else if (emailsRes.emails && emailsRes.emails.length > 0) {
                // Use emails to create thread list
                mappedThreads = emailsRes.emails.map((e: any) => ({
                    id: e.id,
                    subject: e.subject || "No subject",
                    fromName: e.fromName || e.fromEmail || "Unknown",
                    fromEmail: e.fromEmail || "",
                    snippet: e.snippet || "",
                    receivedAt: e.receivedAt || new Date().toISOString(),
                    isRead: e.isRead || false,
                    isStarred: e.isStarred || false,
                    status: "ACTIVE"
                }));
            }

            setThreads(mappedThreads);
            if (mappedThreads.length > 0 && !selectedThreadId) {
                setSelectedThreadId(mappedThreads[0].id);
            }

            if (emailsRes.emails && emailsRes.emails.length > 0) {
                const mappedEmails = emailsRes.emails.map((e: any) => ({
                    id: e.id,
                    subject: e.subject || "No subject",
                    fromName: e.fromName || e.fromEmail || "Unknown",
                    fromEmail: e.fromEmail || "",
                    bodyText: e.bodyText || e.snippet || "",
                    bodyHtml: e.bodyHtml || null,
                    receivedAt: e.receivedAt || new Date().toISOString(),
                    isRead: e.isRead || false,
                    isStarred: e.isStarred || false
                }));
                setEmails(mappedEmails);
            }
        } catch (error) {
            console.error("Failed to fetch inbox data:", error);
            addToast("error", "Failed to load inbox");
        } finally {
            setIsLoading(false);
        }
    }, [addToast, selectedThreadId]);

    const handleSync = useCallback(async () => {
        if (!currentSenderId) {
            addToast("error", "No sender configured");
            return;
        }
        setIsLoading(true);
        try {
            console.log("[Inbox] Starting sync for senderId:", currentSenderId);
            const result = await syncInbox(currentSenderId);
            console.log("[Inbox] Sync result:", result);
            addToast("success", "Inbox synced successfully");
            await fetchInboxData();
        } catch (error: any) {
            console.error("[Inbox] Sync error:", error);
            addToast("error", "Failed to sync inbox");
        } finally {
            setIsLoading(false);
        }
    }, [addToast, fetchInboxData, currentSenderId]);

    useEffect(() => {
        fetchInboxData();
    }, [fetchInboxData]);

    const selectedThread = threads.find(t => t.id === selectedThreadId);

    return (
        <AuthGuard>
            <ErrorBoundary>
                <SidebarProvider>
                    <div className="flex h-screen bg-background font-sans text-text-primary">
                        <Sidebar
                            currentLabel="Inbox"
                            setLabel={() => { }}
                            items={[
                                { label: "All", icon: <Inbox size={18} /> },
                                { label: "Unread", icon: <MailOpen size={18} /> },
                                { label: "Starred", icon: <Star size={18} /> },
                                { label: "Archived", icon: <Archive size={18} /> },
                            ]}
                            profile={{
                                name: user?.name ?? "User",
                                email: user?.email ?? "",
                                avatarUrl: user?.avatarUrl ?? "",
                            }}
                        />

                        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
                            <div className="bg-white rounded-2xl border border-border-light shadow-premium-lg flex flex-col grow overflow-hidden">
                                <TopBar
                                    placeholder="Search in conversations..."
                                    onRefresh={handleSync}
                                    isRefreshing={isLoading}
                                />

                                <div className="flex flex-1 overflow-hidden">
                                    {/* Left Column: Thread List */}
                                    <div className={cn(
                                        "w-full lg:w-[400px] border-r border-border-light flex flex-col bg-white overflow-hidden",
                                        selectedThreadId && "hidden lg:flex"
                                    )}>
                                        <div className="px-6 py-4 border-b border-border-light bg-white shrink-0">
                                            <div className="flex items-center justify-between mb-4">
                                                <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
                                                <div className="flex items-center gap-1">
                                                    <button className="p-2 hover:bg-interactive-hover rounded-lg text-text-muted transition-colors">
                                                        <Filter size={18} />
                                                    </button>
                                                    <button className="p-2 hover:bg-interactive-hover rounded-lg text-text-muted transition-colors">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Filter by name or email..."
                                                    className="w-full pl-10 pr-4 py-2.5 bg-interactive-hover/50 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                                            {threads.map((thread) => (
                                                <div
                                                    key={thread.id}
                                                    onClick={() => setSelectedThreadId(thread.id)}
                                                    className={cn(
                                                        "px-6 py-5 cursor-pointer border-b border-border-light transition-all relative group",
                                                        selectedThreadId === thread.id ? "bg-brand/5 border-l-4 border-l-brand" : "hover:bg-interactive-hover/10"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <span className={cn("text-sm font-bold truncate pr-4", !thread.isRead ? "text-text-primary" : "text-text-secondary")}>
                                                            {thread.fromName}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-text-muted whitespace-nowrap uppercase tracking-wider">
                                                            {new Date(thread.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className={cn("text-xs font-bold truncate mb-1.5", !thread.isRead ? "text-brand" : "text-text-secondary")}>
                                                        {thread.subject}
                                                    </div>
                                                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-medium">
                                                        {thread.snippet}
                                                    </p>

                                                    {!thread.isRead && (
                                                        <div className="absolute right-4 bottom-5 h-2 w-2 bg-brand rounded-full shadow-[0_0_8px_rgba(22,163,74,0.5)]" />
                                                    )}

                                                    <button
                                                        className={cn(
                                                            "absolute right-10 bottom-4 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100",
                                                            thread.isStarred ? "text-amber-400 opacity-100" : "text-text-muted hover:text-amber-400"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <Star size={14} fill={thread.isStarred ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column: Thread Detail */}
                                    <div className={cn(
                                        "flex-1 flex flex-col bg-interactive-hover/10 overflow-hidden",
                                        !selectedThreadId && "hidden lg:flex"
                                    )}>
                                        {selectedThread ? (
                                            <>
                                                {/* Detail Header */}
                                                <div className="px-8 py-5 border-b border-border-light bg-white shrink-0 flex items-center justify-between shadow-sm z-10">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => setSelectedThreadId(null)}
                                                            className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors"
                                                        >
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
                                                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-9 rounded-lg">
                                                            <Archive size={16} />
                                                            <span>Archive</span>
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-9 rounded-lg text-error-text border-error-border/30 hover:bg-error-bg/20">
                                                            <Trash2 size={16} />
                                                            <span>Delete</span>
                                                        </Button>
                                                        <button className="sm:hidden p-2 text-text-muted hover:bg-interactive-hover rounded-lg transition-colors">
                                                            <MoreVertical size={20} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Message Feed */}
                                                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                                    {emails.filter(e => e.fromEmail === selectedThread.fromEmail).map((email) => (
                                                        <div key={email.id} className="flex flex-col items-start max-w-[85%] animate-in fade-in slide-in-from-left-4 duration-500">
                                                            <div className="bg-white border border-border-light p-6 rounded-2xl rounded-tl-none shadow-premium-sm text-[14px] leading-relaxed text-text-primary font-medium w-full overflow-hidden">
                                                                {email.bodyHtml ? (
                                                                    <iframe
                                                                        srcDoc={`
                                                                            <!DOCTYPE html>
                                                                            <html>
                                                                                <head>
                                                                                    <style>
                                                                                        body { 
                                                                                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                                                                                            line-height: 1.6; 
                                                                                            color: #374151; 
                                                                                            margin: 0; 
                                                                                            padding: 0;
                                                                                            font-size: 14px;
                                                                                        }
                                                                                        img { max-width: 100%; height: auto; display: block; }
                                                                                        a { color: #16a34a; text-decoration: underline; }
                                                                                        p { margin-bottom: 1em; }
                                                                                    </style>
                                                                                </head>
                                                                                <body>${email.bodyHtml}</body>
                                                                            </html>
                                                                        `}
                                                                        title="Email Content"
                                                                        className="w-full border-none min-h-[300px]"
                                                                        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                                                                        onLoad={(e) => {
                                                                            const iframe = e.currentTarget;
                                                                            if (iframe.contentWindow) {
                                                                                // Attempt to auto-resize
                                                                                const body = iframe.contentWindow.document.body;
                                                                                if (body) {
                                                                                    iframe.style.height = '0px';
                                                                                    iframe.style.height = (body.scrollHeight + 50) + 'px';
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="whitespace-pre-wrap">{email.bodyText}</div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-text-muted mt-2.5 uppercase tracking-[0.1em]">Received {new Date(email.receivedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Reply Editor */}
                                                <div className="p-6 bg-white border-t border-border-light shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10">
                                                    <div className="border border-border-light rounded-2xl overflow-hidden focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/5 transition-all bg-interactive-hover/5">
                                                        <textarea
                                                            placeholder={`Reply to ${selectedThread.fromName}...`}
                                                            className="w-full p-5 h-36 resize-none text-[14px] focus:outline-none bg-transparent placeholder:text-text-muted placeholder:font-medium font-medium"
                                                        />
                                                        <div className="px-5 py-3.5 bg-white border-t border-border-light flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-text-muted">
                                                                <button className="p-2 hover:bg-interactive-hover hover:text-text-primary rounded-lg transition-all" title="Templates">
                                                                    <MessageSquare size={18} />
                                                                </button>
                                                                <button className="p-2 hover:bg-interactive-hover hover:text-text-primary rounded-lg transition-all" title="More options">
                                                                    <MoreHorizontal size={18} />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider hidden sm:block">Press CMD+Enter to send</span>
                                                                <Button className="gap-2.5 px-7 h-11 rounded-xl shadow-premium-sm active:scale-95 transition-transform">
                                                                    <Send size={16} />
                                                                    <span className="font-bold">Send Reply</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                                                <div className="h-24 w-24 bg-white border border-border-light rounded-[2.5rem] flex items-center justify-center text-text-muted mb-8 shadow-sm rotate-6 transition-transform hover:rotate-0 duration-500">
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

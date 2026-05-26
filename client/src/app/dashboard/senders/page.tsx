"use client";

import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSenders, deleteSender } from "@/lib/apis";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { SenderModal } from "../compose/SenderModal";
import type { SenderResponse } from "@/types";
import {
    Mail,
    Plus,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Globe,
    Reply,
    ShieldCheck,
    Inbox,
    Star,
    Clock,
    Send,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import { getProviderConfig, inferProviderFromHost } from "@/lib/senderProviders";
import axios from "axios";

export default function SendersPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [senders, setSenders] = useState<SenderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSender, setEditingSender] = useState<SenderResponse | undefined>(undefined);

    const fetchSenders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSenders();
            setSenders(data);
        } catch {
            addToast("error", "Failed to fetch sender accounts");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchSenders();
    }, [fetchSenders]);

    const handleDeleteSender = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to remove ${email}? This will stop any active campaigns using this sender.`)) return;
        try {
            await deleteSender(id);
            addToast("success", "Sender removed successfully");
            fetchSenders();
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message || "Failed to remove sender"
                : "Failed to remove sender";
            addToast("error", message);
        }
    };

    const handleAddSender = () => {
        setEditingSender(undefined);
        setIsModalOpen(true);
    };

    const handleVerifySender = (sender: SenderResponse) => {
        setEditingSender(sender);
        setIsModalOpen(true);
    };

    return (
        <AuthGuard requirePremium={true}>
            <ErrorBoundary>
                <SidebarProvider>
                    <div className="flex h-screen bg-background font-sans text-text-primary">
                        <Sidebar
                            currentLabel="Accounts"
                            setLabel={() => { }}
                            items={[
                                { label: "All", icon: <Inbox size={18} /> },
                                { label: "Starred", icon: <Star size={18} /> },
                                { label: "Scheduled", icon: <Clock size={18} /> },
                                { label: "Sent", icon: <Send size={18} /> },
                            ]}
                            profile={{
                                name: user?.name ?? "User",
                                email: user?.email ?? "",
                                avatarUrl: user?.avatarUrl ?? "",
                            }}
                        />

                        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
                            <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
                                <TopBar
                                    placeholder="Search accounts..."
                                    onRefresh={fetchSenders}
                                    isRefreshing={isLoading}
                                />

                                {/* Header Section */}
                                <div className="px-8 py-6 border-b border-border-light bg-white shrink-0">
                                    <div className="flex items-center justify-between gap-4 mb-8">
                                        <div>
                                            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Email Accounts</h1>
                                            <p className="text-sm font-medium text-text-secondary mt-1">Manage outbound senders and delivery infrastructure</p>
                                        </div>
                                        <Button
                                            onClick={handleAddSender}
                                            variant="primary"
                                            className="gap-2 shrink-0"
                                        >
                                            <Plus size={18} />
                                            <span>Add Sender</span>
                                        </Button>
                                    </div>

                                    {/* Stats Summary */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-white shadow-sm transition-all">
                                            <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                                <Mail size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Total Accounts</p>
                                                <p className="text-xl font-bold text-text-primary leading-none mt-1">{senders.length}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-white shadow-sm transition-all">
                                            <div className="h-10 w-10 rounded-lg bg-brand-light flex items-center justify-center text-brand shrink-0">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Deliverable</p>
                                                <p className="text-xl font-bold text-text-primary leading-none mt-1">{senders.filter(s => s.isVerified).length}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-error-border/30 bg-error-bg/20 shadow-sm transition-all">
                                            <div className="h-10 w-10 rounded-lg bg-error-bg flex items-center justify-center text-error-text shrink-0">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-error-text uppercase tracking-[0.1em]">Issues Found</p>
                                                <p className="text-xl font-bold text-error-text leading-none mt-1">{senders.filter(s => !s.isVerified).length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto bg-interactive-hover/20 p-8 custom-scrollbar">
                                    {isLoading && senders.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <InlineLoader message="Loading your accounts..." />
                                        </div>
                                    ) : senders.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-12 max-w-md mx-auto">
                                            <div className="h-16 w-16 bg-white border border-border-light rounded-2xl flex items-center justify-center text-text-muted mb-6 shadow-sm rotate-3">
                                                <Mail size={32} />
                                            </div>
                                            <h3 className="text-lg font-bold text-text-primary">Connect your first sender</h3>
                                            <p className="text-sm text-text-secondary mt-2 mb-8 leading-relaxed">
                                                Connect Google, Outlook, or any SMTP account to start sending high-deliverability campaigns.
                                            </p>
                                            <Button onClick={handleAddSender} size="lg" className="px-10">
                                                Add Sender
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                                            {senders.map((sender) => {
                                                const providerKey = sender.providerKey || inferProviderFromHost(sender.smtpHost);
                                                const providerLabel = getProviderConfig(providerKey).label;
                                                return (
                                                <div
                                                    key={sender.id}
                                                    className={cn(
                                                        "group relative bg-white border border-border-light rounded-2xl p-6 transition-all duration-200",
                                                        "hover:shadow-elevated hover:border-border-medium",
                                                        !sender.isVerified && "border-error-border/40 bg-error-bg/[0.03]"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className={cn(
                                                                "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                                                                sender.isVerified ? "bg-interactive-hover text-text-secondary" : "bg-error-bg text-error-text"
                                                            )}>
                                                                <Mail size={24} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-text-primary truncate">{sender.name || "Default Sender"}</h3>
                                                                <p className="text-xs font-semibold text-text-muted truncate">{sender.email}</p>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-interactive-hover text-[10px] font-bold uppercase tracking-wider text-text-muted mt-1">
                                                                    {providerLabel}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0">
                                                            {sender.isVerified ? (
                                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-light text-brand text-[10px] font-bold uppercase tracking-wider border border-brand/10">
                                                                    <CheckCircle2 size={12} />
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-error-bg text-error-text text-[10px] font-bold uppercase tracking-wider border border-error-border/20">
                                                                    <AlertTriangle size={12} />
                                                                    Disconnected
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-8">
                                                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-interactive-hover/50 border border-transparent">
                                                            <div className="flex items-center gap-2 text-text-muted">
                                                                <Globe size={14} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Gateway</span>
                                                            </div>
                                                            <span className="text-[11px] font-bold text-text-secondary">
                                                                {sender.smtpHost || "smtp.gmail.com"}
                                                            </span>
                                                        </div>
                                                        {sender.replyTo && (
                                                            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-interactive-hover/50 border border-transparent">
                                                                <div className="flex items-center gap-2 text-text-muted">
                                                                    <Reply size={14} />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Response Hub</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-brand truncate max-w-[140px]">
                                                                    {sender.replyTo}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            onClick={() => handleVerifySender(sender)}
                                                            variant={sender.isVerified ? "outline" : "primary"}
                                                            size="sm"
                                                            className="flex-1"
                                                        >
                                                            {sender.isVerified ? "Settings" : "Re-authenticate"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteSender(sender.id, sender.email)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-10 h-9 p-0 text-text-muted hover:text-error-text hover:bg-error-bg"
                                                            title="Delete Account"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>

                    <SenderModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        existingSender={editingSender}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            fetchSenders();
                        }}
                    />
                </SidebarProvider>
            </ErrorBoundary>
        </AuthGuard>
    );
}

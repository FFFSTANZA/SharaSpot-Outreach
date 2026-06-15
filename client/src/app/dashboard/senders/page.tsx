"use client";

import { useEffect, useState, useCallback } from "react";
import {
    deleteSender,
    getSenders,
} from "@/lib/apis";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
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
    Menu,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { getProviderConfig, inferProviderFromHost } from "@/lib/senderProviders";
import { useSidebar } from "@/hooks/useSidebar";
import axios from "axios";

function SendersContent() {
    const { toggle } = useSidebar();
    const { addToast } = useToast();
    const [senders, setSenders] = useState<SenderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSender, setEditingSender] = useState<SenderResponse | undefined>(undefined);
    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; email: string } | null>(null);

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

    const handleDeleteSender = async () => {
        if (!deleteConfirmTarget) return;
        const { id } = deleteConfirmTarget;
        setDeleteConfirmTarget(null);
        try {
            await deleteSender(id);
            addToast("success", "Sender removed successfully");
            await fetchSenders();
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

    const senderStats = [
        { label: "Total Accounts", value: senders.length, sub: "All senders", icon: Mail, color: "text-brand" },
        { label: "Ready", value: senders.filter(s => s.isVerified).length, sub: "Ready to send", icon: ShieldCheck, color: "text-brand" },
        { label: "Issues", value: senders.filter(s => !s.isVerified).length, sub: "Need attention", icon: AlertTriangle, color: "text-error-text" },
    ];

    const isEmpty = !isLoading && senders.length === 0;

    return (
        <>
            <div className="mx-auto w-full max-w-[1600px] flex flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-white">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-border-light px-4 py-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggle}
                                        aria-label="Open sidebar"
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
                                    >
                                        <Menu size={14} />
                                    </button>
                                    <h1 className="text-base font-semibold text-text-primary">Email Accounts</h1>
                                </div>
                                <button
                                    onClick={handleAddSender}
                                    className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90"
                                >
                                    <Plus size={12} />
                                    Add Sender
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="border-b border-border-light px-4 py-5 sm:px-6">
                            <div className="grid grid-cols-3 gap-3">
                                {senderStats.map((stat) => (
                                    <div key={stat.label} className="rounded-lg border border-border-light bg-white p-4 transition-all hover:shadow-premium-sm">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
                                                <stat.icon className={cn("h-[18px] w-[18px]", stat.color)} />
                                            </div>
                                            <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">{stat.label}</span>
                                        </div>
                                        <div className="text-2xl font-bold tracking-tight text-text-primary">{stat.value}</div>
                                        <div className="mt-2 border-t border-border-light pt-2 text-xs font-medium text-text-muted">{stat.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-4 sm:px-6">
                            {isLoading && senders.length === 0 ? (
                                <div className="flex h-64 items-center justify-center">
                                    <InlineLoader message="Loading your accounts..." />
                                </div>
                            ) : isEmpty ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light mb-4">
                                        <Mail size={32} className="text-brand" />
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary">Connect your first sender</h3>
                                    <p className="text-sm text-text-secondary mt-1 mb-6 max-w-md">
                                        Connect Google, Outlook, or any SMTP account to start sending campaigns.
                                    </p>
                                    <button
                                        onClick={handleAddSender}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90"
                                    >
                                        <Plus size={12} />
                                        Add Sender
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                                        {senders.map((sender) => {
                                            const providerKey = sender.providerKey || inferProviderFromHost(sender.smtpHost);
                                            const providerLabel = getProviderConfig(providerKey).label;
                                            return (
                                                <div
                                                    key={sender.id}
                                                    className={cn(
                                                        "group relative rounded-lg border bg-white p-5 transition-all hover:shadow-premium-sm",
                                                        sender.isVerified
                                                            ? "border-border-light"
                                                            : "border-error-bg"
                                                    )}
                                                >
                                                    <div className="mb-4 flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={cn(
                                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                                                sender.isVerified ? "bg-brand-light text-brand" : "bg-error-bg text-error-text"
                                                            )}>
                                                                <Mail size={20} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="truncate text-sm font-semibold text-text-primary">{sender.name || "Default Sender"}</h3>
                                                                <p className="truncate text-xs text-text-muted">{sender.email}</p>
                                                                <span className="mt-1.5 inline-flex items-center rounded-md border border-border-light bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                                                    {providerLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {sender.isVerified ? (
                                                            <span className="flex shrink-0 items-center gap-1 rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                                                                <CheckCircle2 size={12} />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="flex shrink-0 items-center gap-1 rounded-md bg-error-bg px-2 py-0.5 text-[11px] font-semibold text-error-text">
                                                                <AlertTriangle size={12} />
                                                                Disconnected
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mb-4 space-y-2">
                                                        <div className={cn(
                                                            "rounded-md border px-3 py-2 text-xs font-medium",
                                                            sender.isVerified
                                                                ? "border-brand/10 bg-brand-light/40 text-brand"
                                                                : "border-error-bg bg-error-bg/50 text-error-text"
                                                        )}>
                                                            {sender.isVerified
                                                                ? "Ready to send. This account passed its connection check."
                                                                : "Reconnect this account before using it in campaigns."}
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2 rounded-md border border-border-light bg-[#F8F9FA] px-3 py-2">
                                                            <div className="flex items-center gap-1.5 text-text-muted">
                                                                <Globe size={12} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">SMTP host</span>
                                                            </div>
                                                            <span className="truncate text-right text-[11px] font-semibold text-text-secondary">
                                                                {sender.smtpHost || "smtp.gmail.com"}
                                                            </span>
                                                        </div>
                                                        {sender.replyTo && (
                                                            <div className="flex items-center justify-between gap-2 rounded-md border border-border-light bg-[#F8F9FA] px-3 py-2">
                                                                <div className="flex items-center gap-1.5 text-text-muted">
                                                                    <Reply size={12} />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Reply-to</span>
                                                                </div>
                                                                <span className="truncate text-right text-[11px] font-semibold text-brand">
                                                                    {sender.replyTo}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-4">
                                                        <button
                                                            onClick={() => handleVerifySender(sender)}
                                                            className={cn(
                                                                "flex h-7 flex-1 items-center justify-center rounded-md text-xs font-medium transition-all",
                                                                sender.isVerified
                                                                    ? "border border-border-light bg-white text-text-secondary hover:bg-[#F0F1F3]"
                                                                    : "bg-brand text-white hover:bg-brand/90"
                                                            )}
                                                        >
                                                            {sender.isVerified ? "Manage connection" : "Reconnect account"}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmTarget({ id: sender.id, email: sender.email })}
                                                            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-error-bg hover:text-error-text"
                                                            title="Delete sender"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

            {deleteConfirmTarget && (
                <Modal isOpen onClose={() => setDeleteConfirmTarget(null)}>
                    <div className="p-6 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg">
                            <Trash2 className="h-5 w-5 text-error-text" />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary mb-1">Remove sender?</h3>
                        <p className="text-sm text-text-secondary mb-5">
                            &ldquo;{deleteConfirmTarget.email}&rdquo; will be removed. Active
                            campaigns using this sender will be paused.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmTarget(null)}
                                className="flex-1 rounded-lg border border-border-light bg-white px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSender}
                                className="flex-1 rounded-lg bg-error-text px-4 py-2 text-xs font-medium text-white transition-all hover:bg-error-text/90"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <SenderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingSender={editingSender}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchSenders();
                }}
            />
        </>
    );
}

export default function SendersPage() {
    return (
        <AuthGuard requirePremium={true}>
            <ErrorBoundary>
                    <SendersContent />
            </ErrorBoundary>
        </AuthGuard>
    );
}


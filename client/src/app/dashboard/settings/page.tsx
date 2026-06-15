"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
    User, Save, Loader2, ExternalLink, Menu
} from "lucide-react";
import { updateUserName } from "@/lib/apis/auth";
import {
    getSubscription, createSubscription, cancelSubscription,
    reactivateSubscription, createBillingPortalSession, SubscriptionResponse
} from "@/lib/apis/subscription";
import { useToast } from "@/context/ToastContext";
import { useSidebar } from "@/hooks/useSidebar";
import axios from "axios";

const PRICING: Record<string, { symbol: string; price: number }> = {
    global: { symbol: "$", price: 29 },
    india: { symbol: "₹", price: 999 },
};

function getErrorMessage(error: unknown, fallback: string): string {
    return axios.isAxiosError(error)
        ? error.response?.data?.message || fallback
        : fallback;
}

function SettingsContent() {
    const { toggle } = useSidebar();
    const { user, refreshUser } = useAuth();
    const { addToast } = useToast();
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) setName(user.name || "");
    }, [user]);

    const handleSaveName = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            addToast("error", "Name cannot be empty");
            return;
        }
        setSaving(true);
        try {
            await updateUserName(trimmed);
            await refreshUser();
            addToast("success", "Name updated");
        } catch {
            addToast("error", "Failed to update name");
        } finally {
            setSaving(false);
        }
    };

    return (
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
                                <h1 className="text-base font-semibold text-text-primary">Settings</h1>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-4 sm:px-6">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <Section title="Profile">
                                <div className="flex flex-col gap-4 rounded-lg border border-border-light bg-white p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F0F1F3] overflow-hidden">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="text-text-muted" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                                            className="w-full text-base font-semibold text-text-primary bg-transparent border-b-2 border-transparent focus:border-brand/50 focus:outline-none pb-0.5 transition-colors placeholder:text-text-muted"
                                            placeholder="Your name"
                                        />
                                        <p className="text-sm text-text-muted">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={handleSaveName}
                                        disabled={saving || name.trim() === (user?.name || "")}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50 shrink-0"
                                    >
                                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        Save
                                    </button>
                                </div>
                            </Section>

                            <SubscriptionSection />
                        </div>
                    </div>
                </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{title}</h3>
            {children}
        </div>
    );
}

function SubscriptionSection() {
    const [subscription, setSubscription] = useState<SubscriptionResponse["subscription"]>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [region, setRegion] = useState<"global" | "india">("global");
    const { addToast } = useToast();

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isSuccessRedirect = searchParams?.get("subscription") === "success";

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getSubscription();
                setSubscription(data.subscription);
                setIsPremium(data.isPremium);
                setRegion((data.region as "global" | "india") || "global");
            } catch (err) {
                console.error("Failed to fetch billing status:", err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [isSuccessRedirect]);

    const handleCancel = async () => {
        setActionLoading(true);
        try {
            await cancelSubscription();
            addToast("success", "Subscription will be cancelled at the end of billing period");
            const data = await getSubscription();
            setSubscription(data.subscription);
            setIsPremium(data.isPremium);
        } catch (err: unknown) {
            addToast("error", getErrorMessage(err, "Failed to cancel subscription"));
        } finally {
            setActionLoading(false);
            setShowCancelModal(false);
        }
    };

    const handleReactivate = async () => {
        setActionLoading(true);
        try {
            await reactivateSubscription();
            addToast("success", "Subscription reactivated");
            const data = await getSubscription();
            setSubscription(data.subscription);
            setIsPremium(data.isPremium);
        } catch (err: unknown) {
            addToast("error", getErrorMessage(err, "Failed to reactivate"));
        } finally {
            setActionLoading(false);
        }
    };

    const handlePortal = async () => {
        setPortalLoading(true);
        try {
            const { portalUrl } = await createBillingPortalSession();
            window.location.href = portalUrl;
        } catch (err: unknown) {
            addToast("error", getErrorMessage(err, "Failed to open billing portal"));
        } finally {
            setPortalLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setCheckoutLoading(true);
        try {
            const { checkoutUrl } = await createSubscription();
            window.location.href = checkoutUrl;
        } catch (err: unknown) {
            addToast("error", getErrorMessage(err, "Failed to start checkout"));
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <Section title="Subscription">
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
            </Section>
        );
    }

    const now = new Date();
    const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
    const isTrialing = trialEnd && trialEnd > now;
    const isCanceled = subscription?.cancelAtPeriodEnd;
    const needsBillingAction = subscription?.status === "ON_HOLD" || subscription?.status === "PAST_DUE";

    const pricing = PRICING[region] || PRICING.global;

    const statusBadge = () => {
        if (needsBillingAction) return <span className="inline-flex items-center rounded-full bg-error-bg px-2 py-0.5 text-[11px] font-semibold text-error-text">Past Due</span>;
        if (isTrialing) return <span className="inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">Trial</span>;
        if (isCanceled) return <span className="inline-flex items-center rounded-full bg-[#F8F9FA] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">Cancelling</span>;
        if (isPremium) return <span className="inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">Active</span>;
        return <span className="inline-flex items-center rounded-full bg-[#F0F1F3] px-2 py-0.5 text-[11px] font-semibold text-text-muted">Inactive</span>;
    };

    return (
        <>
            <Section title="Subscription">
                <div className="rounded-lg border border-border-light bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-text-primary">SharaSpot Pro</span>
                            {statusBadge()}
                        </div>
                        <span className="text-sm font-medium text-text-primary">{pricing.symbol}{pricing.price}/mo</span>
                    </div>

                    {!isPremium && !needsBillingAction ? (
                        <div>
                            <p className="text-sm text-text-muted mb-4">
                                Subscribe to access all premium features. {pricing.symbol}{pricing.price}/mo, 7-day trial included.
                            </p>
                            <button
                                onClick={handleSubscribe}
                                disabled={checkoutLoading}
                                className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                            >
                                {checkoutLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Subscribe
                            </button>
                        </div>
                    ) : needsBillingAction && subscription ? (
                        <div>
                            <p className="text-sm text-text-muted mb-4">
                                Payment issue. Update your billing method to continue premium access.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {subscription.hasDodoCustomerId && (
                                    <button onClick={handlePortal} disabled={portalLoading}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                                    >
                                        {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                        Manage Billing
                                    </button>
                                )}
                                <button onClick={handleSubscribe} disabled={checkoutLoading}
                                    className="flex h-8 items-center gap-1.5 rounded-md bg-brand-light px-3 text-xs font-medium text-brand transition-all hover:bg-brand/20 disabled:opacity-50"
                                >
                                    {checkoutLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    New Subscription
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Next billing</span>
                                <span className="text-text-primary">
                                    {periodEnd?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) || "N/A"}
                                </span>
                            </div>
                            {isTrialing && trialEnd && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Trial ends</span>
                                    <span className="text-text-primary">
                                        {trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                    </span>
                                </div>
                            )}

                            <div className="pt-3 border-t border-border-light flex flex-wrap gap-2">
                                {subscription?.hasDodoCustomerId && (
                                    <button onClick={handlePortal} disabled={portalLoading}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                                    >
                                        {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                        Billing Portal
                                    </button>
                                )}
                                {!isCanceled ? (
                                    <button onClick={() => setShowCancelModal(true)}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-error-bg px-3 text-xs font-medium text-error-text transition-all hover:bg-error-bg/80"
                                    >
                                        Cancel Subscription
                                    </button>
                                ) : (
                                    <button onClick={handleReactivate} disabled={actionLoading}
                                        className="flex h-8 items-center gap-1.5 rounded-md bg-brand-light px-3 text-xs font-medium text-brand transition-all hover:bg-brand/20 disabled:opacity-50"
                                    >
                                        {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Reactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 bg-text-primary/10 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowCancelModal(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-premium-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-text-primary mb-2">Cancel Subscription?</h3>
                        <p className="text-sm text-text-secondary mb-5">
                            Your subscription remains active until <strong className="text-text-primary">{periodEnd?.toLocaleDateString()}</strong>.
                            After that you&apos;ll lose premium access.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCancelModal(false)}
                                className="flex-1 flex h-9 items-center justify-center rounded-md border border-border-light bg-white px-4 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3]"
                            >
                                Keep
                            </button>
                            <button onClick={handleCancel} disabled={actionLoading}
                                className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-md bg-error-text px-4 text-xs font-medium text-white transition-all hover:bg-error-text/90 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function SettingsPage() {
    return (
        <AuthGuard requirePremium={true}>
            <ErrorBoundary>
                    <SettingsContent />
            </ErrorBoundary>
        </AuthGuard>
    );
}

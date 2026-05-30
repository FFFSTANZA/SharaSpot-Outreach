"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import {
    User, CreditCard, Inbox, Star, Clock, Send, Save, Loader2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateUserName } from "@/lib/apis/auth";
import {
    getSubscription, createSubscription, cancelSubscription,
    reactivateSubscription, createBillingPortalSession, SubscriptionResponse
} from "@/lib/apis/subscription";
import { useToast } from "@/context/ToastContext";

const PRICING: Record<string, { symbol: string; price: number }> = {
    global: { symbol: "$", price: 19 },
    india: { symbol: "₹", price: 999 },
};

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export default function SettingsPage() {
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
        <AuthGuard requirePremium={true}>
            <SidebarProvider>
                <div className="flex h-screen bg-background font-sans text-text-primary">
                    <Sidebar
                        currentLabel="Settings"
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
                            <TopBar placeholder="Search settings..." />

                            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full custom-scrollbar space-y-10">
                                <div>
                                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
                                    <p className="text-sm font-medium text-text-secondary mt-1">Your profile and account details</p>
                                </div>

                                <Section title="Profile">
                                    <div className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-border-light shadow-sm">
                                        <div className="h-16 w-16 rounded-2xl bg-interactive-hover flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="text-text-muted" size={32} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                                                className="w-full text-lg font-bold text-text-primary bg-transparent border-b-2 border-transparent focus:border-brand/50 focus:outline-none pb-0.5 transition-colors placeholder:text-text-muted"
                                                placeholder="Your name"
                                            />
                                            <p className="text-sm text-text-muted font-medium">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={handleSaveName}
                                            disabled={saving || name.trim() === (user?.name || "")}
                                            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 shrink-0"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save
                                        </button>
                                    </div>
                                </Section>

                                <SubscriptionSection />
                            </div>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
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
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
        if (needsBillingAction) return <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Past Due</span>;
        if (isTrialing) return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Trial</span>;
        if (isCanceled) return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Cancelling</span>;
        if (isPremium) return <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>;
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold">Inactive</span>;
    };

    return (
        <Section title="Subscription">
            <div className="rounded-2xl border border-border-light shadow-sm p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-text-primary">SharaSpot Pro</span>
                        {statusBadge()}
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{pricing.symbol}{pricing.price}/mo</span>
                </div>

                {!isPremium && !needsBillingAction ? (
                    <div>
                        <p className="text-sm text-text-muted mb-4">
                            Subscribe to access all premium features. {pricing.symbol}{pricing.price}/mo, 7-day trial included.
                        </p>
                        <button
                            onClick={handleSubscribe}
                            disabled={checkoutLoading}
                            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
                        >
                            {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Subscribe
                        </button>
                    </div>
                ) : needsBillingAction && subscription ? (
                    <div>
                        <p className="text-sm text-text-muted mb-4">
                            Payment issue. Update your billing method to continue premium access.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {subscription.dodoCustomerId && (
                                <button onClick={handlePortal} disabled={portalLoading}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
                                >
                                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                    Manage Billing
                                </button>
                            )}
                            <button onClick={handleSubscribe} disabled={checkoutLoading}
                                className="px-4 py-2 text-sm font-semibold text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors flex items-center gap-2 disabled:opacity-40"
                            >
                                {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                New Subscription
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-muted">Subscription ID</span>
                            <span className="font-mono text-text-primary">{subscription?.dodoSubscriptionId || "N/A"}</span>
                        </div>
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

                        <div className="pt-4 border-t border-border-light flex flex-wrap gap-3">
                            {subscription?.dodoCustomerId && (
                                <button onClick={handlePortal} disabled={portalLoading}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
                                >
                                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                    Billing Portal
                                </button>
                            )}
                            {!isCanceled ? (
                                <button onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Cancel Subscription
                                </button>
                            ) : (
                                <button onClick={handleReactivate} disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-semibold text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors flex items-center gap-2 disabled:opacity-40"
                                >
                                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Reactivate
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Subscription?</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Your subscription remains active until <strong>{periodEnd?.toLocaleDateString()}</strong>.
                            After that you&apos;ll lose premium access.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Keep
                            </button>
                            <button onClick={handleCancel} disabled={actionLoading}
                                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Section>
    );
}

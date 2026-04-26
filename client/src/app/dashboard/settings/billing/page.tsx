"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../../Sidebar";
import { TopBar } from "../../Topbar";
import {
    Zap, Check, CreditCard, ArrowLeft, ArrowRight, Inbox, Star, Clock, Send, ShieldCheck, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/config";
import { getSubscription, createSubscription, cancelSubscription, reactivateSubscription } from "@/lib/apis";

export default function BillingPage() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <AuthGuard>
            <SidebarProvider>
                <div className="flex h-screen bg-background font-sans">
                    <Sidebar
                        currentLabel="Billing"
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

                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-4 px-4 bg-background">
                        <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
                            <TopBar onRefresh={() => { }} />

                            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
                                <button
                                    onClick={() => router.push("/dashboard/settings")}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-all mb-8"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Settings
                                </button>

                                <div className="mb-12">
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Billing & Plans</h1>
                                    <p className="text-sm text-gray-500 mt-1">Simple pricing for high-deliverability outreach</p>
                                </div>

                                <div className="max-w-2xl mx-auto">
                                    <PremiumCard />
                                </div>

                            </div>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}

function PremiumCard() {
    const [subscription, setSubscription] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const { user } = useAuth();

    React.useEffect(() => {
        getSubscription()
            .then((data: any) => {
                setSubscription(data.subscription);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleCancel = async () => {
        if (!confirm("Are you sure? Your pro features will remain active until the end of the current billing period.")) return;
        try {
            await cancelSubscription();
            const data = await getSubscription();
            setSubscription(data.subscription);
        } catch (error) {
            console.error("Cancel failed:", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12 bg-slate-50 rounded-3xl animate-pulse">
            <span className="text-sm font-bold text-slate-400">Loading subscription details...</span>
        </div>
    );

    const now = new Date();
    const expiryDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
    const isPremium = (expiryDate && expiryDate > now) || (trialEnd && trialEnd > now);
    const isCancelled = subscription?.status === "cancelled" || subscription?.cancelAtPeriodEnd;

    React.useEffect(() => {
        if (!loading && !isPremium) {
            const timer = setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [loading, isPremium]);

    if (!isPremium) {
        return (
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Active Subscription</h3>
                <p className="text-sm text-slate-500 mt-2">Redirecting you to secure payment setup...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                    <div className="flex items-center gap-2 bg-brand text-white px-3.5 py-1.5 rounded-full shadow-lg border border-brand/50">
                        <ShieldCheck size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Verified Pro</span>
                    </div>
                </div>

                <div className="relative z-10 pt-4">
                    <h2 className="text-3xl font-black text-white tracking-tight">Pro Outreach Plan</h2>
                    <p className="text-brand font-black text-[10px] uppercase tracking-[0.2em] mt-1">Managed By Dodo Payments</p>

                    <div className="mt-10 space-y-4">
                        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription Status</p>
                                    <p className={cn(
                                        "text-sm font-black mt-1 uppercase tracking-wider",
                                        isCancelled ? "text-amber-500" : "text-brand"
                                    )}>
                                        {isCancelled ? "Cancelled (Pending Expiry)" : "Active & SECURE"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {isCancelled ? "Expires On" : "Next Billing"}
                                    </p>
                                    <p className="text-sm font-bold text-slate-300 mt-1">
                                        {(expiryDate || trialEnd)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!isCancelled && (
                            <button
                                onClick={handleCancel}
                                className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Zap className="w-3 h-3" /> Cancel Subscription
                            </button>
                        )}

                        {isCancelled && (
                            <div className="py-4 px-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                                <p className="text-[11px] text-amber-500/80 font-bold leading-relaxed">
                                    Your subscription has been cancelled. You will continue to have full access to all Pro features until
                                    <span className="text-amber-500 ml-1">
                                        {(expiryDate || trialEnd)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text, isPro, isDark }: { text: string; isPro?: boolean; isDark?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                isPro ? "bg-brand text-white" : (isDark ? "bg-slate-800 text-slate-600" : "bg-gray-200 text-gray-400")
            )}>
                <Check size={12} strokeWidth={4} />
            </div>
            <span className={cn(
                "text-sm font-bold",
                isPro ? (isDark ? "text-slate-200" : "text-gray-800") : (isDark ? "text-slate-600" : "text-gray-400")
            )}>{text}</span>
        </div>
    );
}

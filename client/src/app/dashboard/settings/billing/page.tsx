"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../../Sidebar";
import { TopBar } from "../../Topbar";
import {
    Zap, Check, CreditCard, ArrowLeft, ArrowRight, Inbox, Star, Clock, Send, ShieldCheck
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
    const [region, setRegion] = React.useState<"india" | "global">("global");
    const [subscription, setSubscription] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const { user } = useAuth();

    React.useEffect(() => {
        getSubscription()
            .then((data: any) => {
                setSubscription(data.subscription);
                if (data.region) setRegion(data.region);
                setLoading(false);
            })
            .catch(() => {
                setRegion("global");
                setLoading(false);
            });
    }, []);

    const pricing = BRAND_CONFIG.pricing[region];
    const [timeLeft, setTimeLeft] = React.useState<string>("");

    React.useEffect(() => {
        if (!subscription?.trialEnd) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const end = new Date(subscription.trialEnd).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("Expired");
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s`);
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(interval);
    }, [subscription]);

    const now = new Date();
    const isTrialActive = !subscription?.dodoSubscriptionId && subscription?.trialEnd && new Date(subscription.trialEnd) > now;
    const isPaidActive = subscription?.dodoSubscriptionId && subscription?.status === "ACTIVE" && subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now;
    const isPremium = isTrialActive || isPaidActive;

    const handleUpgrade = async () => {
        try {
            const data = await createSubscription();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        } catch (error) {
            console.error("Failed to start checkout:", error);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your pro subscription? You will keep your features until the end of the billing period.")) return;
        try {
            await cancelSubscription();
            const data = await getSubscription();
            setSubscription(data.subscription);
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
        }
    };

    const handleReactivate = async () => {
        try {
            await reactivateSubscription();
            const data = await getSubscription();
            setSubscription(data.subscription);
        } catch (error) {
            console.error("Failed to reactivate subscription:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className={cn(
                "rounded-3xl p-8 relative overflow-hidden transition-all duration-500",
                isPaidActive
                    ? "bg-slate-900 border-2 border-slate-800 shadow-2xl"
                    : "bg-white border-2 border-brand shadow-2xl shadow-brand/10"
            )}>
                <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
                    {isPaidActive ? (
                        <div className="flex items-center gap-2.5 bg-brand text-white px-3.5 py-1.5 rounded-full shadow-lg shadow-brand/20 border border-brand/50">
                            <ShieldCheck size={14} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Verified Pro</span>
                        </div>
                    ) : (
                        <div className="bg-brand text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-xl shadow-brand/20">Recommended</div>
                    )}
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mt-6">
                        <h2 className={cn("text-4xl font-black", isPaidActive ? "text-white" : "text-gray-900")}>
                            {pricing.symbol}{pricing.amount}<span className={cn("text-lg font-bold", isPaidActive ? "text-slate-400" : "text-gray-400")}>/mo</span>
                        </h2>
                        {isPaidActive ? (
                            <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-[0.15em] bg-brand/5 px-2.5 py-1 rounded border border-brand/20">
                                PRO SUB
                            </div>
                        ) : isTrialActive ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                Trial Access
                            </span>
                        ) : null}
                    </div>
                    <p className={cn("text-xl font-bold mt-2", isPaidActive ? "text-slate-200" : "text-gray-700")}>Pro Outreach Plan</p>

                    <div className="text-sm mt-1 flex items-center gap-2">
                        {isPaidActive ? (
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-brand/10 border border-brand/20 rounded-lg">
                                <CreditCard size={12} className="text-brand" />
                                <span className="text-brand font-black text-[10px] uppercase tracking-wider">
                                    Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        ) : isTrialActive ? (
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                                <Clock size={12} className="text-amber-600" />
                                <span className="text-amber-600 font-black text-[10px] uppercase tracking-wider tabular-nums">
                                    Trial Ends: {timeLeft}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-500 italic text-xs">Includes 7-day payment trial</span>
                        )}
                    </div>

                    <div className="mt-10 space-y-3">
                        <FeatureItem text="Unlimited Multi-Sender Rotation" isPro={isPremium} isDark={isPaidActive} />
                        <FeatureItem text="Automated Warmup Infrastructure" isPro={isPremium} isDark={isPaidActive} />
                        <FeatureItem text="Real-time IMAP Reply Detection" isPro={isPremium} isDark={isPaidActive} />
                        <FeatureItem text="Priority Agency-Grade Delivery" isPro={isPremium} isDark={isPaidActive} />
                    </div>

                    <div className="mt-10">
                        {isPaidActive ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="py-4 text-slate-500 font-bold rounded-2xl bg-slate-800/30 border border-slate-800 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                                    <Zap size={12} className="text-brand fill-brand" /> PRO STATUS
                                </div>
                                {subscription.cancelAtPeriodEnd ? (
                                    <button
                                        onClick={handleReactivate}
                                        className="py-4 bg-brand text-white font-black rounded-2xl hover:scale-[1.02] transition-all text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20"
                                    >
                                        Reactivate
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCancel}
                                        className="py-4 bg-slate-800 text-slate-500 font-bold rounded-2xl hover:bg-red-900/10 hover:text-red-400 hover:border-red-900/20 border border-slate-700 transition-all text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                className="w-full py-5 text-white font-black rounded-2xl bg-brand shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                <span className="uppercase tracking-widest text-sm">{isTrialActive ? "Claim Pro Access" : "Start 7-Day Trial"}</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isPaidActive && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Renewal Status</p>
                        <p className={cn(
                            "text-sm font-black mt-1 uppercase tracking-wider",
                            subscription.cancelAtPeriodEnd ? "text-amber-600" : "text-brand"
                        )}>
                            {subscription.cancelAtPeriodEnd ? "Expiring Soon" : "Auto-renewing"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Cycle</p>
                        <p className="text-sm font-bold text-slate-600 mt-1">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            )}
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

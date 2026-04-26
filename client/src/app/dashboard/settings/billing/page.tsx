"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../../Sidebar";
import {
    Zap, Check, CreditCard, ArrowLeft, ShieldCheck, AlertTriangle, Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSubscription, cancelSubscription } from "@/lib/apis";

export default function BillingPage() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <AuthGuard>
            <SidebarProvider>
                <div className="flex h-screen bg-white font-sans text-slate-900">
                    <Sidebar
                        currentLabel="Billing"
                        setLabel={() => { }}
                        items={[]}
                        profile={{
                            name: user?.name ?? "User",
                            email: user?.email ?? "",
                            avatarUrl: user?.avatarUrl ?? "",
                        }}
                    />

                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden px-10 py-12">
                        <div className="max-w-3xl mx-auto w-full">
                            <button
                                onClick={() => router.push("/dashboard/settings")}
                                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all mb-10 group"
                            >
                                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                                RETURN TO SETTINGS
                            </button>

                            <header className="mb-12 text-center md:text-left">
                                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Billing</h1>
                                <p className="text-slate-500 mt-2 text-sm font-medium">Manage your subscription and payment details</p>
                            </header>

                            <PremiumCard />
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
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isSuccessRedirect = searchParams?.get("subscription") === "success";

    React.useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getSubscription();
                setSubscription(data.subscription);
                if (isSuccessRedirect && !data.isPremium) {
                    // Give a small delay for webhook to propagate before refresh
                    setTimeout(() => refreshUser(), 1000);
                }
            } catch (err) {
                console.error("Failed to fetch billing status:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [isSuccessRedirect, refreshUser]);

    const handleCancel = async () => {
        if (!confirm("Your pro features will expire at the end of your billing cycle. Are you sure?")) return;
        try {
            await cancelSubscription();
            const data = await getSubscription();
            setSubscription(data.subscription);
        } catch (error) {
            console.error("Cancellation failed:", error);
        }
    };

    if (loading) return (
        <div className="p-12 border border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center animate-pulse">
            <div className="h-4 w-48 bg-slate-200 rounded-full mb-3" />
            <div className="h-3 w-32 bg-slate-100 rounded-full" />
        </div>
    );

    const now = new Date();
    const expiryDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
    const isPremium = (expiryDate && expiryDate > now) || (trialEnd && trialEnd > now);
    const isCancelled = subscription?.status === "cancelled" || subscription?.cancelAtPeriodEnd;

    if (!isPremium) {
        return (
            <div className="p-10 border border-slate-200 rounded-3xl text-center bg-white shadow-sm transition-all hover:shadow-md">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-5" />
                <h3 className="text-xl font-bold text-slate-900">No Active Plan</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                    You currently don't have an active subscription. Upgrade to Pro to start your outreach campaigns.
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="mt-8 px-10 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                >
                    Upgrade to SharaSpot Pro
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Plan Information */}
            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
                <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Plan</span>
                                <div className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase tracking-wider border border-green-100 italic">Active</div>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                                SharaSpot Pro
                                <ShieldCheck className="text-brand h-6 w-6" />
                            </h2>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-4xl font-black text-slate-900">$29<span className="text-sm font-bold text-slate-400 ml-1">USD/mo</span></p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Professional Tier</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-y border-slate-100">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Renewal Date</p>
                            <p className="text-lg font-bold text-slate-900">
                                {(expiryDate || trialEnd)?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method</p>
                            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <CreditCard size={18} className="text-slate-300" />
                                Standard Billing
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                        {!isCancelled ? (
                            <button
                                onClick={handleCancel}
                                className="px-6 py-3 border border-slate-200 text-slate-400 font-bold rounded-xl hover:border-red-100 hover:text-red-500 hover:bg-red-50 transition-all text-[11px] uppercase tracking-widest"
                            >
                                Cancel Subscription
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
                                <Clock size={16} />
                                <p className="text-[11px] font-bold uppercase tracking-wider">
                                    Ends on {(expiryDate || trialEnd)?.toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden md:block">
                            Secured by Dodo Payments
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Features / Proof of Status */}
            <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50/40">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Zap className="text-brand h-4 w-4" />
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">Plan Inclusions</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                    <BenefitItem text="Multi-Sender Rotation Engine" />
                    <BenefitItem text="Professional AI Follow-ups" />
                    <BenefitItem text="Unlimited Campaign Senders" />
                    <BenefitItem text="Primary Inbox Optimization" />
                    <BenefitItem text="Advanced Deliverability Tools" />
                    <BenefitItem text="Priority Email Infrastructure" />
                </div>
            </div>
        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-green-50 rounded-full flex items-center justify-center shrink-0 border border-green-100">
                <Check size={10} className="text-green-600" strokeWidth={4} />
            </div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{text}</span>
        </div>
    );
}

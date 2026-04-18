"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getSubscription, createSubscription, cancelSubscription, reactivateSubscription } from "@/lib/apis";
import type { SubscriptionResponse } from "@/lib/apis";
import { CreditCard, Check, AlertTriangle, ArrowRight, Shield, Zap, Clock, Crown, X } from "lucide-react";
import Button from "@/components/Button";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export default function BillingPage() {
    const { addToast } = useToast();
    const [subData, setSubData] = useState<SubscriptionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchSubscription = async () => {
        try {
            const data = await getSubscription();
            setSubData(data);
        } catch (err) {
            console.error("Failed to fetch subscription", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    const handleSubscribe = async () => {
        setIsProcessing(true);
        try {
            const { checkoutUrl } = await createSubscription();
            window.location.href = checkoutUrl;
        } catch (err) {
            addToast("error", "Failed to start checkout. Please try again.");
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel? You will keep your access until the end of the period.")) return;
        setIsProcessing(true);
        try {
            await cancelSubscription();
            addToast("success", "Subscription cancelled. It will remain active until the period ends.");
            await fetchSubscription();
        } catch (err) {
            addToast("error", "Failed to cancel subscription.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReactivate = async () => {
        setIsProcessing(true);
        try {
            await reactivateSubscription();
            addToast("success", "Subscription reactivated!");
            await fetchSubscription();
        } catch (err) {
            addToast("error", "Failed to reactivate subscription.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
        );
    }

    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
        ACTIVE: { label: "Active", color: "text-brand bg-brand-light border-brand/10", icon: Check },
        PAST_DUE: { label: "Past Due", color: "text-amber-700 bg-amber-50 border-amber-100", icon: AlertTriangle },
        CANCELLED: { label: "Cancelled", color: "text-gray-500 bg-gray-50 border-gray-100", icon: X },
        EXPIRED: { label: "Expired", color: "text-red-700 bg-red-50 border-red-100", icon: AlertTriangle },
    };

    const status = subData?.subscription?.status || "INACTIVE";
    const statusConfig = statusMap[status] || { label: status, color: "text-gray-500 bg-gray-50 border-gray-100", icon: AlertTriangle };
    const StatusIcon = statusConfig.icon;

    const isTrial = subData?.subscription?.trialEnd && new Date(subData.subscription.trialEnd) > new Date();
    const trialDaysLeft = isTrial ? Math.ceil((new Date(subData!.subscription!.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <AuthGuard>
            <ErrorBoundary>
                <div className="min-h-screen bg-gray-50/50">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
                        <div className="mb-10">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Billing & Access</h1>
                            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.3em]">
                                Manage your plan and professional capabilities
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* Status Banner */}
                            <div className={cn("rounded-[2rem] border p-8 flex flex-col md:flex-row items-center gap-8 transition-all",
                                "bg-white border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]")}>
                                <div className={cn("h-24 w-24 rounded-3xl flex items-center justify-center shrink-0 shadow-lg",
                                    subData?.isPremium ? "bg-brand text-white shadow-brand/20" : "bg-gray-100 text-gray-400")}>
                                    <Crown className="h-10 w-10" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                            {subData?.isPremium ? "Full Access Plan" : "7-Day Trial"}
                                        </h2>
                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest", statusConfig.color)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.label}
                                        </div>
                                    </div>
                                    {isTrial ? (
                                        <p className="text-sm text-gray-600 font-medium">
                                            Your professional trial is active. You have <span className="font-black text-brand">{trialDaysLeft} business days</span> remaining.
                                        </p>
                                    ) : subData?.isPremium ? (
                                        <p className="text-sm text-gray-600 font-medium">
                                            Next billing cycle: <span className="font-black text-gray-900">{new Date(subData.subscription!.currentPeriodEnd).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500 font-medium">
                                            Your professional access has concluded. Upgrade to maintain your outreach momentum.
                                        </p>
                                    )}
                                </div>
                                {!subData?.subscription?.dodoSubscriptionId && !isTrial && (
                                    <button
                                        className="w-full md:w-auto h-14 px-8 bg-brand text-white rounded-2xl shadow-xl shadow-brand/20 font-black uppercase tracking-widest text-xs hover:scale-105 transition-all active:scale-95"
                                        onClick={handleSubscribe}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? "Processing..." : "Upgrade to Pro — $20/mo"}
                                    </button>
                                )}
                            </div>

                            {/* Plan Details */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Zap className="h-6 w-6 text-brand" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Professional Suite</h2>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Full capabilities included</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-gray-900 tracking-tight">$20.00 <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">/ mo</span></p>
                                    </div>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        "Unlimited Sender Accounts",
                                        "Unlimited Outreach Campaigns",
                                        "Advanced Reply Detection",
                                        "Multi-step Follow-up Sequences",
                                        "Live Delivery Analytics",
                                        "Priority Sending Queue",
                                        "Dynamic Template Variables",
                                        "Adaptive Safe Warmup"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-700 font-bold tracking-tight">
                                            <div className="h-6 w-6 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                                                <Check className="h-4 w-4 text-brand" />
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subscription Management */}
                            {subData?.subscription?.dodoSubscriptionId && (
                                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Subscription Management</h2>
                                        <div className="h-10 w-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
                                            <CreditCard className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col sm:flex-row gap-4">
                                        {subData.subscription.cancelAtPeriodEnd ? (
                                            <button
                                                className="flex-1 h-12 bg-brand text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand/20 transition-all hover:scale-[1.02]"
                                                onClick={handleReactivate}
                                                disabled={isProcessing}
                                            >
                                                Reactivate Full Access
                                            </button>
                                        ) : (
                                            <button
                                                className="flex-1 h-12 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-transparent hover:border-red-100"
                                                onClick={handleCancel}
                                                disabled={isProcessing}
                                            >
                                                Cancel Subscription
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Support */}
                            <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <span>Secure processing by Dodo Payments</span>
                                </div>
                                <a
                                    href="mailto:support@sharaspot.com"
                                    className="h-12 px-6 flex items-center justify-center bg-gray-50 text-gray-900 hover:bg-white hover:text-brand border border-gray-100 hover:border-brand/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm"
                                >
                                    Contact Support Team
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </AuthGuard>
    );
}

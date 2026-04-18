"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getSubscription, createSubscription, cancelSubscription, reactivateSubscription } from "@/lib/apis";
import type { SubscriptionResponse } from "@/lib/apis";
import { CreditCard, Check, AlertTriangle, Shield, Zap, Crown, X } from "lucide-react";
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
                <div className="min-h-screen bg-background">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
                        <div className="mb-10 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Access</h1>
                            <p className="text-sm text-text-secondary mt-2">
                                Manage your professional outreach plan
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* Status Card */}
                            <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                                <div className={cn("h-20 w-20 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                    subData?.isPremium ? "bg-brand text-white" : "bg-gray-100 text-gray-400")}>
                                    <Crown className="h-10 w-10" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {subData?.isPremium ? "Professional Plan" : "7-Day Free Trial"}
                                        </h2>
                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold border uppercase tracking-wider", statusConfig.color)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.label}
                                        </div>
                                    </div>
                                    {isTrial ? (
                                        <p className="text-sm text-text-secondary">
                                            Your 7-day trial is active. You have <span className="font-semibold text-brand">{trialDaysLeft} days</span> remaining.
                                        </p>
                                    ) : subData?.isPremium ? (
                                        <p className="text-sm text-text-secondary">
                                            Next billing date: <span className="font-semibold text-gray-900">{new Date(subData.subscription!.currentPeriodEnd).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-text-secondary">
                                            Your trial has ended. Upgrade to the Professional plan to continue.
                                        </p>
                                    )}
                                </div>
                                {!subData?.subscription?.dodoSubscriptionId && !isTrial && (
                                    <button
                                        className="w-full md:w-auto h-12 px-8 bg-brand text-white rounded-xl font-semibold shadow-sm hover:bg-brand-hover transition-all"
                                        onClick={handleSubscribe}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? "Processing..." : "Upgrade to Pro — $20/mo"}
                                    </button>
                                )}
                            </div>

                            {/* Plan Details */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                                            <Zap className="h-5 w-5 text-brand" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Professional Suite</h2>
                                            <p className="text-xs text-text-secondary">Full access to all features</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">$20.00 <span className="text-xs text-text-secondary font-normal">/ month</span></p>
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
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                                            <div className="h-5 w-5 rounded-md bg-brand-light flex items-center justify-center shrink-0">
                                                <Check className="h-3.5 w-3.5 text-brand" />
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subscription Management */}
                            {subData?.subscription?.dodoSubscriptionId && (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-gray-900">Manage Subscription</h2>
                                        <CreditCard className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="p-8 flex flex-col sm:flex-row gap-4">
                                        {subData.subscription.cancelAtPeriodEnd ? (
                                            <button
                                                className="flex-1 h-11 bg-brand text-white rounded-xl font-semibold shadow-sm transition-all hover:bg-brand-hover"
                                                onClick={handleReactivate}
                                                disabled={isProcessing}
                                            >
                                                Reactivate Subscription
                                            </button>
                                        ) : (
                                            <button
                                                className="flex-1 h-11 bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all border border-gray-200 hover:border-red-100"
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
                            <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                    <Shield className="h-5 w-5 text-gray-300" />
                                    <span>Secure processing by Dodo Payments</span>
                                </div>
                                <a
                                    href="mailto:support@sharaspot.com"
                                    className="h-10 px-5 flex items-center justify-center bg-gray-50 text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-all border border-gray-200"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </AuthGuard>
    );
}

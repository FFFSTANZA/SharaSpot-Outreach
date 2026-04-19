"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getSubscription, createSubscription, cancelSubscription, reactivateSubscription } from "@/lib/apis";
import type { SubscriptionResponse } from "@/lib/apis";
import { CreditCard, Check, AlertTriangle, ArrowRight, Shield, Zap, Clock, X } from "lucide-react";
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
        ACTIVE: { label: "Active", color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: Check },
        PAST_DUE: { label: "Past Due", color: "text-amber-700 bg-amber-50 border-amber-100", icon: AlertTriangle },
        CANCELLED: { label: "Cancelled", color: "text-gray-700 bg-gray-50 border-gray-100", icon: X },
        EXPIRED: { label: "Expired", color: "text-red-700 bg-red-50 border-red-100", icon: AlertTriangle },
    };

    const status = subData?.subscription?.status || "INACTIVE";
    const statusConfig = statusMap[status] || { label: status, color: "text-gray-700 bg-gray-50 border-gray-100", icon: AlertTriangle };
    const StatusIcon = statusConfig.icon;

    const isTrial = subData?.subscription?.trialEnd && new Date(subData.subscription.trialEnd) > new Date();
    const trialDaysLeft = isTrial ? Math.ceil((new Date(subData!.subscription!.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <AuthGuard>
            <ErrorBoundary>
                <div className="min-h-screen bg-[#FAFBFC]">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-[#1A1D21]">Billing & Subscription</h1>
                            <p className="text-sm text-[#5F6368] mt-1">
                                Manage your payment method and subscription plan
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Status Banner */}
                            <div className={cn("rounded-xl border p-6 flex flex-col md:flex-row items-center gap-6",
                                subData?.subscription?.status === "ACTIVE" || isTrial ? "bg-white border-gray-200" : "bg-amber-50 border-amber-100")}>
                                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0",
                                    subData?.subscription?.status === "ACTIVE" || isTrial ? "bg-[#00A63E]/10" : "bg-amber-100")}>
                                    <Zap className={cn("h-8 w-8", subData?.subscription?.status === "ACTIVE" || isTrial ? "text-[#00A63E]" : "text-amber-600")} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {(subData?.subscription?.status === "ACTIVE" || isTrial) ? "Active Subscription" : "Subscription Required"}
                                        </h2>
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border", statusConfig.color)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.label}
                                        </div>
                                    </div>
                                    {isTrial ? (
                                        <p className="text-sm text-gray-600">
                                            Your 7-day free trial is active. You have <span className="font-bold text-emerald-600">{trialDaysLeft} days</span> left.
                                        </p>
                                    ) : subData?.isPremium ? (
                                        <p className="text-sm text-gray-600">
                                            Next billing date: <span className="font-bold text-gray-900">{new Date(subData.subscription!.currentPeriodEnd).toLocaleDateString()}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-amber-700">
                                            Your trial has expired. Subscribe to continue using SharaSpot.
                                        </p>
                                    )}
                                </div>
                                {!subData?.subscription?.dodoSubscriptionId && !isTrial && (
                                    <Button
                                        variant="primary"
                                        className="w-full md:w-auto"
                                        onClick={handleSubscribe}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? "Processing..." : "Subscribe Now — $20/mo"}
                                    </Button>
                                )}
                            </div>

                            {/* Plan Details */}
                            <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
                                <div className="px-6 py-4 border-b border-[#E8EAED] bg-[#FAFBFC] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <Zap className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-[#1A1D21]">Plan Details</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">$20.00 / month</p>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        "Unlimited Sender Accounts",
                                        "Unlimited Campaigns",
                                        "Reply Detection & Management",
                                        "Follow-up Sequences",
                                        "Real-time Analytics",
                                        "Priority Email Delivery",
                                        "Template Personalization",
                                        "Safe Sending Warmup"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subscription Management */}
                            {subData?.subscription?.dodoSubscriptionId && (
                                <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[#E8EAED] bg-[#FAFBFC]">
                                        <h2 className="text-base font-semibold text-[#1A1D21]">Subscription Actions</h2>
                                    </div>
                                    <div className="p-6 flex flex-col sm:flex-row gap-3">
                                        {subData.subscription.cancelAtPeriodEnd ? (
                                            <Button
                                                variant="secondary"
                                                className="flex-1"
                                                onClick={handleReactivate}
                                                disabled={isProcessing}
                                            >
                                                Reactivate Subscription
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                                                onClick={handleCancel}
                                                disabled={isProcessing}
                                            >
                                                Cancel Subscription
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Support */}
                            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Shield className="h-4 w-4" />
                                    <span>Secure payments by Dodo Payment</span>
                                </div>
                                <a
                                    href="mailto:support@sharaspot.com"
                                    className="text-sm font-bold text-emerald-600 hover:underline"
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

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../../Sidebar";
import {
    ArrowLeft,
    Check,
    CreditCard,
    Calendar,
    AlertTriangle,
    Loader2,
    Crown,
    Zap,
    Building2,
    Shield,
    Mail,
    Users,
    BarChart3,
    Globe,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSubscription, cancelSubscription, reactivateSubscription, SubscriptionResponse } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";

const PRICING = {
    global: {
        currency: "USD",
        symbol: "$",
        price: 29,
        productId: "pdt_0NdSUs666T4IaNYC5YQGO",
    },
    india: {
        currency: "INR",
        symbol: "₹",
        price: 499,
        productId: "pdt_0NdSW8L98BDmeuwfx4dj6",
    },
};

const FEATURES = [
    { icon: Mail, label: "Unlimited Emails", desc: "Send as many cold emails as you want" },
    { icon: Users, label: "Unlimited Senders", desc: "Connect unlimited email accounts" },
    { icon: Zap, label: "Priority Delivery", desc: "Emails land in primary inbox, not spam" },
    { icon: BarChart3, label: "Advanced Analytics", desc: "Track opens, clicks, and replies" },
    { icon: Globe, label: "Unlimited Campaigns", desc: "Run unlimited outreach campaigns" },
    { icon: Shield, label: "API Access", desc: "Full programmatic control" },
    { icon: Building2, label: "Priority Support", desc: "Get help when you need it" },
    { icon: Sparkles, label: "Custom Templates", desc: "Create and save your templates" },
];

export default function BillingPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Hide billing page and redirect to dashboard
        router.replace("/dashboard");
    }, [router]);

    return null;
}

function PremiumCard() {
    const [subscription, setSubscription] = useState<SubscriptionResponse["subscription"]>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [region, setRegion] = useState<"global" | "india">("global");
    const { refreshUser } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isSuccessRedirect = searchParams?.get("subscription") === "success";
    const isCancelledRedirect = searchParams?.get("subscription") === "cancelled";

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getSubscription();
                setSubscription(data.subscription);
                setIsPremium(data.isPremium);
                setRegion((data.region as "global" | "india") || "global");

                if (isSuccessRedirect && !data.isPremium) {
                    setTimeout(() => refreshUser(), 1500);
                }

                if (isCancelledRedirect) {
                    addToast("info", "Payment was cancelled. You can try again when ready.");
                }
            } catch (err) {
                console.error("Failed to fetch billing status:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [isSuccessRedirect, isCancelledRedirect, refreshUser, addToast]);

    const handleCancelSubscription = async () => {
        setActionLoading(true);
        try {
            await cancelSubscription();
            addToast("success", "Subscription will be cancelled at the end of billing period");
            const data = await getSubscription();
            setSubscription(data.subscription);
            setIsPremium(data.isPremium);
        } catch (err: any) {
            addToast("error", err.message || "Failed to cancel subscription");
        } finally {
            setActionLoading(false);
            setShowCancelModal(false);
        }
    };

    const handleReactivate = async () => {
        setActionLoading(true);
        try {
            await reactivateSubscription();
            addToast("success", "Subscription reactivated successfully");
            const data = await getSubscription();
            setSubscription(data.subscription);
            setIsPremium(data.isPremium);
        } catch (err: any) {
            addToast("error", err.message || "Failed to reactivate subscription");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    const now = new Date();
    const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const periodStart = subscription?.currentPeriodStart ? new Date(subscription.currentPeriodStart) : null;
    const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
    const isTrialing = trialEnd && trialEnd > now;
    const isCanceled = subscription?.cancelAtPeriodEnd;

    const currentPricing = PRICING[region];

    const statusBadge = () => {
        if (isTrialing) {
            return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Trial Active</span>;
        }
        if (isCanceled) {
            return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Cancels {periodEnd?.toLocaleDateString()}</span>;
        }
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>;
    };

    if (!isPremium) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-lg shadow-indigo-200 mb-6">
                        <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Get SharaSpot Pro</h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Unlock unlimited cold email outreach. No limits, no restrictions.
                    </p>
                </div>

                <div className="bg-white rounded-3xl border-2 border-indigo-600 shadow-2xl shadow-indigo-100 overflow-hidden max-w-lg w-full">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8 text-center">
                        <p className="text-indigo-100 font-medium mb-2">One Plan. One Price.</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-5xl font-extrabold text-white">{currentPricing.symbol}{currentPricing.price}</span>
                            <span className="text-indigo-200 text-lg">/{currentPricing.currency === "USD" ? "month" : "mo"}</span>
                        </div>
                        {region === "india" && (
                            <p className="text-indigo-200 text-sm mt-2">India regional pricing</p>
                        )}
                    </div>

                    <div className="p-8">
                        <ul className="space-y-4 mb-8">
                            {FEATURES.map((feature) => (
                                <li key={feature.label} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{feature.label}</p>
                                        <p className="text-sm text-slate-500">{feature.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => router.push("/login")}
                            className="w-full py-4 px-6 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                        >
                            Get Started Now
                        </button>

                        <p className="text-center text-xs text-slate-400 mt-4">
                            30-day money-back guarantee • Cancel anytime
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>{region === "india" ? "India pricing (₹499/mo)" : "Global pricing ($29/mo)"}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <Crown className="w-6 h-6 text-white" />
                                <h2 className="text-2xl font-bold text-white">SharaSpot Pro</h2>
                                {statusBadge()}
                            </div>
                            <p className="text-indigo-100 mt-1">You have full access to all premium features</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                                {currentPricing.symbol}{currentPricing.price}
                                <span className="text-lg font-normal">/mo</span>
                            </div>
                            <p className="text-indigo-100 text-sm">
                                {isTrialing
                                    ? `Trial ends: ${trialEnd?.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                                    : `Next billing: ${periodEnd?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Subscription Details</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-500">Billing Period</p>
                                <p className="text-slate-900 font-semibold">
                                    {periodStart?.toLocaleDateString()} - {periodEnd?.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                            <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-500">Subscription ID</p>
                                <p className="text-slate-900 font-mono text-sm">{subscription?.dodoSubscriptionId || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Your Features</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {FEATURES.map((item) => (
                                <div key={item.label} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                    <item.icon className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-900">{item.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                        {!isCanceled ? (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancel Subscription
                            </button>
                        ) : (
                            <button
                                onClick={handleReactivate}
                                disabled={actionLoading}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Reactivate Subscription
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">•••• •••• •••• ••••</p>
                        <p className="text-sm text-slate-500">Managed by Dodo Payments</p>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                    Payment details are securely managed by Dodo Payments. Contact support to update your payment method.
                </p>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Cancel Subscription?</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Your subscription will remain active until <strong>{periodEnd?.toLocaleDateString()}</strong>.
                            After that, you'll lose access to all premium features.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Keep Subscription
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={actionLoading}
                                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { getSubscription, SubscriptionResponse } from "../lib/apis";
import { useAuth } from "../hooks/useAuth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const TrialBanner = () => {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getSubscription()
                .then((res) => {
                    setSubscription(res);
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [user]);

    const isSuccessRedirect = searchParams?.get("subscription") === "success";

    if (loading || !subscription) return null;

    const now = new Date();
    const trialEnd = subscription.subscription?.trialEnd ? new Date(subscription.subscription.trialEnd) : null;
    const isTrialActive = trialEnd && trialEnd > now;
    const isPremium = subscription.isPremium;

    // Hide banner for active premium users
    if (isPremium && !isTrialActive) return null;

    // Show processing state if they just paid
    if (isSuccessRedirect && !isPremium) {
        return (
            <div className="mx-2 mb-6 px-4 py-3 rounded-xl bg-brand/5 border border-brand/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Verifying Pro</span>
                        <span className="text-[13px] font-bold text-text-primary leading-tight">Securing your access...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isTrialActive) {
        const hoursLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
        const daysLeft = Math.floor(hoursLeft / 24);
        const displayTime = daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`;

        return (
            <div className="mx-2 mb-6 px-4 py-2.5 rounded-xl bg-[#1A1D21] border border-white/10 shadow-premium-md group transition-all hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">Trial Access</span>
                        <span className="text-[13px] font-bold text-white leading-tight">Ends in {displayTime}</span>
                    </div>
                    <Link
                        href="/dashboard/settings/billing"
                        className="text-[11px] font-bold text-brand hover:text-brand-light transition-colors"
                    >
                        Upgrade
                    </Link>
                </div>
            </div>
        );
    }

    if (!isPremium) {
        return (
            <div className="mx-2 mb-6 px-4 py-3 rounded-xl bg-brand/5 border border-brand/20 backdrop-blur-sm group transition-all hover:border-brand/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand/10">
                        <Sparkles className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Unverified Pro</span>
                        <span className="text-[13px] font-bold text-text-primary leading-tight">Activate Your Trial</span>
                    </div>
                </div>
                <Link
                    href="/dashboard/settings/billing"
                    className="mt-3 flex items-center justify-center w-full py-2 bg-brand text-white text-[12px] font-extrabold rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Start 7-Day Trial
                </Link>
            </div>
        );
    }

    return null;
};

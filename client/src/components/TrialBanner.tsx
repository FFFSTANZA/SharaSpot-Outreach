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

    // Hide banner for active premium (paid) users
    if (isPremium && !isTrialActive) return null;

    // Show processing state if they just paid
    if (isSuccessRedirect && !isPremium) {
        return (
            <div className="mx-2 mb-6 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Verifying Pro</span>
                        <span className="text-[13px] font-bold text-white leading-tight">Securing your access...</span>
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
            <div className="mx-2 mb-6 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-premium-md">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Subscription</span>
                        <span className="text-[13px] font-bold text-white leading-tight">Pro Trial: {displayTime} left</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../../Sidebar";
import {
    ArrowLeft, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSubscription } from "@/lib/apis";

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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription Detail</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="px-6 py-5 text-sm font-bold text-slate-500">Plan</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Pro Outreach</span>
                                        <div className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase tracking-wider border border-green-100 italic">Active</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-5 text-sm font-bold text-slate-500">Subscription ID</td>
                                <td className="px-6 py-5 text-sm font-mono font-medium text-slate-900">
                                    {subscription?.dodoSubscriptionId || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-5 text-sm font-bold text-slate-500">Next Renewal</td>
                                <td className="px-6 py-5 text-sm font-bold text-slate-900">
                                    {(expiryDate || trialEnd)?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Secured by Dodo Payments
                </p>
            </div>
        </div>
    );
}

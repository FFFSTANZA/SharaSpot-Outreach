"use client";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../../Sidebar";
import { TopBar } from "../../Topbar";
import {
    Zap, Check, CreditCard, ArrowLeft, Inbox, Star, Clock, Send
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Current Plan */}
                                    <div className="rounded-3xl bg-gray-50 border border-gray-100 p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-all">
                                            <Zap size={160} className="text-brand" />
                                        </div>

                                        <div className="relative z-10">
                                            <span className="px-4 py-1.5 bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest rounded-full">Active Plan</span>
                                            <h2 className="text-4xl font-black text-gray-900 mt-6">$0<span className="text-lg text-gray-400 font-bold">/mo</span></h2>
                                            <p className="text-xl font-bold text-gray-700 mt-2">Free Starter</p>

                                            <div className="mt-8 space-y-4">
                                                <FeatureItem text="50 emails per day" />
                                                <FeatureItem text="Basic tracking" />
                                                <FeatureItem text="1 connected sender" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Premium Plan */}
                                    <div className="rounded-3xl bg-white border-2 border-brand p-8 relative overflow-hidden shadow-2xl shadow-brand/10">
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="bg-brand text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-brand/20">Recommended</div>
                                        </div>

                                        <div className="relative z-10">
                                            <h2 className="text-4xl font-black text-gray-900 mt-6">$19<span className="text-lg text-gray-400 font-bold">/mo</span></h2>
                                            <p className="text-xl font-bold text-gray-700 mt-2">Pro Outreach</p>

                                            <div className="mt-8 space-y-4">
                                                <FeatureItem text="Unlimited priority emails" isPro />
                                                <FeatureItem text="Advanced link & open tracking" isPro />
                                                <FeatureItem text="Unlimited sender accounts" isPro />
                                                <FeatureItem text="Custom tracking domains" isPro />
                                            </div>

                                            <button className="w-full mt-10 bg-brand text-white font-black py-4 rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                                <CreditCard size={20} />
                                                Upgrade to Pro
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="mt-16 p-8 rounded-3xl bg-gray-50/50 border border-gray-100 text-center">
                                    <p className="text-xs text-gray-400 font-medium">
                                        Need a custom enterprise plan for 1M+ emails? <span className="text-brand font-bold cursor-pointer hover:underline">Contact Sales</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}

function FeatureItem({ text, isPro }: { text: string; isPro?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                isPro ? "bg-brand text-white" : "bg-gray-200 text-gray-400"
            )}>
                <Check size={12} strokeWidth={4} />
            </div>
            <span className={cn("text-sm font-bold", isPro ? "text-gray-800" : "text-gray-400")}>{text}</span>
        </div>
    );
}

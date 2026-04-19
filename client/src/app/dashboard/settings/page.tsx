"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import {
    User, Settings as SettingsIcon, Mail, Shield, Bell,
    ChevronRight, Inbox, Star, Clock, Send, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user } = useAuth();
    const [minDelay, setMinDelay] = useState(30);
    const [hourlyLimit, setHourlyLimit] = useState(50);
    const [trackOpens, setTrackOpens] = useState(true);
    const [trackClicks, setTrackClicks] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("campaign_defaults");
        if (saved) {
            const parsed = JSON.parse(saved);
            setMinDelay(parsed.minDelay || 30);
            setHourlyLimit(parsed.hourlyLimit || 50);
            setTrackOpens(parsed.trackOpens !== false);
            setTrackClicks(parsed.trackClicks !== false);
        }
    }, []);

    const saveDefaults = () => {
        localStorage.setItem("campaign_defaults", JSON.stringify({
            minDelay, hourlyLimit, trackOpens, trackClicks
        }));
        alert("Settings saved!");
    };

    return (
        <AuthGuard>
            <SidebarProvider>
                <div className="flex h-screen bg-background font-sans">
                    <Sidebar
                        currentLabel="Settings"
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

                            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                                <div className="mb-10">
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
                                    <p className="text-sm text-gray-500 mt-1">Manage your account and campaign preferences</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="md:col-span-1 space-y-1">
                                        {[
                                            { id: "profile", label: "Profile", icon: User },
                                            { id: "campaigns", label: "Campaigns", icon: Mail },
                                            { id: "security", label: "Security", icon: Shield },
                                            { id: "billing", label: "Billing", icon: Zap, href: "/dashboard/settings/billing" },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => item.href && (window.location.href = item.href)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                                                    item.id === "profile" ? "bg-brand/10 text-brand" : "text-gray-500 hover:bg-gray-50"
                                                )}
                                            >
                                                <item.icon size={18} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="md:col-span-3 space-y-8">
                                        {/* Profile Section */}
                                        <Section title="Account Profile">
                                            <div className="flex items-center gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                <img src={user?.avatarUrl || ""} alt="" className="h-16 w-16 rounded-2xl bg-gray-200 object-cover border-2 border-white shadow-sm" />
                                                <div>
                                                    <p className="text-lg font-black text-gray-900">{user?.name}</p>
                                                    <p className="text-sm text-gray-400 font-medium">{user?.email}</p>
                                                </div>
                                            </div>
                                        </Section>

                                        {/* Campaign Defaults */}
                                        <Section title="Campaign Defaults">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputWrapper label="Min Delay (seconds)" sub="Safety gap between emails">
                                                        <input
                                                            type="number"
                                                            value={minDelay}
                                                            onChange={(e) => setMinDelay(Number(e.target.value))}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all"
                                                        />
                                                    </InputWrapper>
                                                    <InputWrapper label="Hourly Limit" sub="Maximum emails per hour">
                                                        <input
                                                            type="number"
                                                            value={hourlyLimit}
                                                            onChange={(e) => setHourlyLimit(Number(e.target.value))}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all"
                                                        />
                                                    </InputWrapper>
                                                </div>

                                                <div className="space-y-3">
                                                    <ToggleItem
                                                        label="Track Email Opens"
                                                        sub="Know when recipients open your messages"
                                                        checked={trackOpens}
                                                        onChange={setTrackOpens}
                                                    />
                                                    <ToggleItem
                                                        label="Track Link Clicks"
                                                        sub="Monitor engagement with your links"
                                                        checked={trackClicks}
                                                        onChange={setTrackClicks}
                                                    />
                                                </div>

                                                <button
                                                    onClick={saveDefaults}
                                                    className="w-full bg-brand text-white font-black py-3 rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </Section>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</h3>
            {children}
        </div>
    );
}

function InputWrapper({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">{label}</label>
            <p className="text-[10px] text-gray-400 font-medium mb-1">{sub}</p>
            {children}
        </div>
    );
}

function ToggleItem({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group">
            <div>
                <p className="text-sm font-bold text-gray-800">{label}</p>
                <p className="text-[11px] text-gray-400 font-medium">{sub}</p>
            </div>
            <div
                onClick={() => onChange(!checked)}
                className={cn(
                    "h-6 w-11 rounded-full transition-all relative",
                    checked ? "bg-brand" : "bg-gray-200"
                )}
            >
                <div className={cn(
                    "h-4 w-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                    checked ? "left-6" : "left-1"
                )} />
            </div>
        </label>
    );
}

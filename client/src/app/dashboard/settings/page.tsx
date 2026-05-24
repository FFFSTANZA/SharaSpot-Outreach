"use client";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { User, Inbox, Star, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { updateUserSettings } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { addToast } = useToast();
    const [savingCalling, setSavingCalling] = useState(false);

    const onToggleCalling = async (enabled: boolean) => {
        setSavingCalling(true);
        try {
            await updateUserSettings({ callingEnabled: enabled });
            await refreshUser();
            addToast("success", enabled ? "Calling workspace enabled" : "Calling workspace disabled");
        } catch {
            addToast("error", "Failed to update calling setting");
        } finally {
            setSavingCalling(false);
        }
    };

    return (
        <AuthGuard requirePremium={true}>
            <SidebarProvider>
                <div className="flex h-screen bg-background font-sans text-text-primary">
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

                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
                        <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
                            <TopBar placeholder="Search settings..." />

                            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full custom-scrollbar">
                                <div className="mb-10">
                                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
                                    <p className="text-sm font-medium text-text-secondary mt-1">Your profile and account details</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                                    <div className="md:col-span-1 space-y-1">
                                        <button
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                                                "bg-brand/10 text-brand"
                                            )}
                                        >
                                            <User size={18} />
                                            Profile
                                        </button>
                                    </div>

                                    <div className="md:col-span-3">
                                        <Section title="Account Profile">
                                            <div className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-border-light shadow-sm transition-all hover:shadow-card">
                                                <div className="h-16 w-16 rounded-2xl bg-interactive-hover flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                                                    {user?.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="text-text-muted" size={32} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-lg font-bold text-text-primary truncate">{user?.name || "Administrator"}</p>
                                                    <p className="text-sm text-text-muted font-semibold truncate">{user?.email}</p>
                                                </div>
                                            </div>
                                        </Section>

                                        <Section title="Communications Workspace">
                                            <div className="p-6 bg-white rounded-2xl border border-border-light shadow-sm">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">Enable Calling Workspace</p>
                                                        <p className="text-xs text-text-muted mt-1">Keep this off for email-only mode. Turn on to show Calls and BYOK provider setup.</p>
                                                    </div>
                                                    <button
                                                        disabled={savingCalling}
                                                        onClick={() => onToggleCalling(!(user?.callingEnabled ?? false))}
                                                        className={cn(
                                                            "h-9 px-3 rounded-lg text-sm font-semibold border",
                                                            user?.callingEnabled ? "bg-brand text-white border-brand" : "bg-white border-border-light text-text-secondary"
                                                        )}
                                                    >
                                                        {savingCalling ? "Saving..." : user?.callingEnabled ? "Enabled" : "Disabled"}
                                                    </button>
                                                </div>
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
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{title}</h3>
            {children}
        </div>
    );
}

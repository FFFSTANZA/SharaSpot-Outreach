"use client";

import React, { useState } from "react";
import {
    Inbox, Send, Star, Clock, Trash2, Search, Settings, HelpCircle,
    Archive, AlertCircle, MoreVertical, Paperclip, ChevronLeft, ChevronRight,
    Menu, Bell, Shield, User, CornerUpLeft, CornerUpRight, Reply, Mail
} from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MailAppContainer({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [activeFolder, setActiveFolder] = useState("inbox");

    const folders = [
        { id: "inbox", label: "Infrastructure", icon: Inbox, count: 12, href: "#features" },
        { id: "priority", label: "Priority Mail", icon: Star, count: 3, href: "#priority" },
        { id: "workflow", label: "Workflow", icon: Clock, href: "#how-it-works" },
        { id: "stats", label: "Performance", icon: Shield, href: "#stats" },
        { id: "sent", label: "Guide", icon: Send, href: "/guide" },
        { id: "research", label: "Research", icon: HelpCircle, href: "/priority-mail" },
    ];

    return (
        <div className="flex h-screen w-full bg-[#f1f3f4] text-text-primary overflow-hidden font-sans">
            {/* Sidebar - Email Folders */}
            <aside className="w-64 bg-[#f8f9fa] border-r border-border-light hidden lg:flex flex-col">
                <div className="p-4 mb-4">
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <Logo size="md" />
                    </Link>

                    <button
                        onClick={() => router.push("/login")}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-border-medium rounded-2xl shadow-sm hover:shadow-md transition-all text-sm font-bold text-text-primary mb-8"
                    >
                        <Mail size={16} />
                        Initialize Outreach
                    </button>

                    <nav className="space-y-1">
                        {folders.map((folder) => (
                            <a
                                key={folder.id}
                                href={folder.href}
                                onClick={() => setActiveFolder(folder.id)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-2 rounded-r-full text-sm font-medium transition-colors group",
                                    activeFolder === folder.id
                                        ? "bg-[#e8f0fe] text-[#1a73e8]"
                                        : "text-text-secondary hover:bg-interactive-hover"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <folder.icon size={18} className={cn(
                                        activeFolder === folder.id ? "text-[#1a73e8]" : "text-text-muted group-hover:text-text-primary"
                                    )} />
                                    {folder.label}
                                </div>
                                {folder.count && (
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        activeFolder === folder.id ? "text-[#1a73e8]" : "text-text-muted"
                                    )}>
                                        {folder.count}
                                    </span>
                                )}
                            </a>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Mail View */}
            <main className="flex-1 flex flex-col bg-white overflow-hidden shadow-2xl lg:ml-2">
                {/* Top Header - Mail Controls */}
                <header className="h-16 border-b border-border-light flex items-center justify-between px-6 shrink-0 bg-white">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden">
                            <Menu size={20} className="text-text-secondary" />
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="p-2 rounded-full hover:bg-interactive-hover text-text-secondary"><Archive size={18} /></button>
                            <button className="p-2 rounded-full hover:bg-interactive-hover text-text-secondary"><AlertCircle size={18} /></button>
                            <button className="p-2 rounded-full hover:bg-interactive-hover text-text-secondary"><Trash2 size={18} /></button>
                        </div>
                        <div className="h-4 w-px bg-border-light mx-2" />
                        <div className="flex items-center gap-2 text-text-muted text-xs font-medium">
                            <CornerUpLeft size={16} />
                            <CornerUpRight size={16} />
                        </div>
                    </div>

                    <div className="flex-1 max-w-2xl px-8 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search SharaSpot Infrastructure..."
                                className="w-full h-10 bg-[#f1f3f4] rounded-lg pl-10 pr-4 text-sm focus:bg-white focus:shadow-sm outline-none transition-all placeholder:text-text-muted border border-transparent focus:border-border-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-full hover:bg-interactive-hover text-text-secondary"><HelpCircle size={18} /></button>
                        <button className="p-2 rounded-full hover:bg-interactive-hover text-text-secondary"><Settings size={18} /></button>
                        <button className="h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white font-black text-xs">S</button>
                    </div>
                </header>

                {/* Email Header */}
                <div className="px-8 py-6 border-b border-border-light shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                            Subject: The end of outreach as you know it.
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#f1f3f4] text-[10px] font-bold text-text-muted uppercase">Inbox</span>
                            <Star size={18} className="text-text-muted hover:text-amber-400 cursor-pointer transition-colors" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand">
                                <Shield size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-text-primary">SharaSpot Infrastructure</span>
                                    <span className="text-xs text-text-muted">&lt;ops@sharaspot.com&gt;</span>
                                </div>
                                <div className="text-xs text-brand font-medium">to me [Primary Inbox Bypassed]</div>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-2 text-xs text-text-muted">
                            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            <div className="flex gap-1">
                                <Reply size={14} />
                                <MoreVertical size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Email Body (The Website) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="max-w-5xl mx-auto p-8 lg:p-12 prose prose-sm prose-slate">
                        {children}
                    </div>

                    {/* Mail Footer */}
                    <footer className="max-w-5xl mx-auto px-8 py-12 border-t border-border-light text-center">
                        <div className="flex justify-center gap-4 mb-8">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-medium hover:bg-interactive-hover text-sm font-medium">
                                <Reply size={16} /> Reply
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-medium hover:bg-interactive-hover text-sm font-medium">
                                <CornerUpRight size={16} /> Forward
                            </button>
                        </div>

                        <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest space-y-2">
                            <div>Sent via SharaSpot Priority Pipeline v4.2</div>
                            <div>IP Reputation: 99.8/100 · Encryption: AES-256-GCM</div>
                            <div className="mt-8">&copy; {new Date().getFullYear()} Folonite Labs</div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}

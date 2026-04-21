"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Inbox, Star, FileText, HelpCircle, Shield, ChevronRight, Activity } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function MailAppContainer({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: "Inbox", href: "/", icon: Inbox, description: "Home" },
        { label: "Starred", href: "/priority", icon: Star, description: "Priority" },
        { label: "Drafts", href: "/guide", icon: FileText, description: "Guide" },
        { label: "Help", href: "/faq", icon: HelpCircle, description: "FAQ" },
    ];

    const getPageSubject = () => {
        if (pathname === "/") return "Outreach that feels human";
        if (pathname === "/priority") return "High-stakes delivery protocol";
        if (pathname === "/guide") return "Implementation manual";
        if (pathname === "/faq") return "System inquiries";
        return "SharaSpot Internal";
    };

    return (
        <div className="min-h-screen bg-white text-text-primary font-sans flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-[280px] flex-col border-r border-border-light bg-[#fcfcfc] h-screen sticky top-0 shrink-0">
                <div className="p-6 border-b border-border-light">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" />
                    </Link>
                </div>

                <div className="flex-1 py-6 overflow-y-auto">
                    <div className="px-3 mb-8">
                        <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Mailbox</p>
                        <nav className="space-y-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={`flex items-center justify-between px-3 py-2 rounded-md transition-all group ${
                                            isActive 
                                            ? "bg-brand/5 text-brand" 
                                            : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <link.icon size={18} className={isActive ? "text-brand" : "text-text-muted group-hover:text-text-primary"} />
                                            <span className="text-[13px] font-semibold">{link.label}</span>
                                        </div>
                                        <span className={`text-[11px] tabular-nums font-medium ${isActive ? "text-brand/60" : "text-text-muted opacity-0 group-hover:opacity-100"}`}>
                                            {link.label === "Inbox" ? "12" : ""}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="px-3">
                        <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Security</p>
                        <div className="px-3 py-2 flex items-center gap-3 text-text-secondary">
                            <Shield size={18} className="text-text-muted" />
                            <span className="text-[13px] font-semibold">End-to-End</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border-light bg-white">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border-light bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">System Live</span>
                        </div>
                        <Activity size={14} className="text-brand" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 border-b border-border-light bg-white sticky top-0 z-40 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            className="lg:hidden p-2 -ml-2 text-text-primary"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="h-4 w-px bg-border-light hidden lg:block mr-2" />
                        <h1 className="text-[13px] font-bold text-text-primary uppercase tracking-widest truncate">
                            Subject: <span className="text-text-secondary font-medium lowercase tracking-normal ml-1">{getPageSubject()}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/login")}
                            className="hidden sm:block text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-[0.1em]"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-text-primary text-white text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 rounded-md hover:bg-slate-800 transition-all shadow-sm"
                        >
                            Get Started
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-white">
                    {children}
                    
                    {/* Compact Footer for Sidebar Layout */}
                    <footer className="border-t border-border-light bg-[#fcfcfc] py-12 px-6">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <Logo size="sm" />
                                <p className="text-[12px] text-text-muted">© 2026 {BRAND_CONFIG.company}. All rights reserved.</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <Link href="/privacy" className="text-[11px] font-bold text-text-muted uppercase tracking-widest hover:text-text-primary">Privacy</Link>
                                <Link href="/terms" className="text-[11px] font-bold text-text-muted uppercase tracking-widest hover:text-text-primary">Terms</Link>
                                <a href={BRAND_CONFIG.supportUrl} className="text-[11px] font-bold text-text-muted uppercase tracking-widest hover:text-text-primary">Support</a>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="p-6 border-b border-border-light flex items-center justify-between">
                            <Logo size="md" />
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="py-6">
                            <nav className="px-3 space-y-1">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-md transition-all ${
                                                isActive 
                                                ? "bg-brand/5 text-brand" 
                                                : "text-text-secondary hover:bg-slate-100"
                                            }`}
                                        >
                                            <link.icon size={18} />
                                            <span className="text-sm font-semibold">{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

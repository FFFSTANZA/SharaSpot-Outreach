"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MailAppContainer({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: "Priority", href: "/priority" },
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Guide", href: "/guide" },
        { label: "FAQ", href: "/faq" },
        { label: "Support", href: BRAND_CONFIG.supportUrl, external: true },
    ];

    return (
        <div className="min-h-screen bg-white text-text-primary font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-5">
                        <button
                            onClick={() => router.push("/login")}
                            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors"
                        >
                            Start for free
                        </button>
                    </div>

                    <button
                        className="md:hidden p-2 text-text-primary"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-border-light px-6 py-6">
                        <div className="flex flex-col gap-5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    target={link.external ? "_blank" : undefined}
                                    className="text-base font-medium text-text-primary"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-brand text-white font-semibold py-3 rounded-lg text-sm mt-2"
                            >
                                Start for free
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <main className="pt-14">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border-light">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                        <div>
                            <Logo size="md" />
                            <p className="text-sm text-text-secondary mt-4 leading-relaxed max-w-xs">
                                Cold email that reaches the right inbox and reads like it came from a real person. Built for founders, sales leaders, and recruiting teams.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-x-16 gap-y-8">
                            <div>
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Product</p>
                                <div className="flex flex-col gap-3">
                                    <Link href="#founders" className="text-sm text-text-secondary hover:text-text-primary transition-colors">For Founders</Link>
                                    <Link href="#sales" className="text-sm text-text-secondary hover:text-text-primary transition-colors">For Sales</Link>
                                    <Link href="#hr" className="text-sm text-text-secondary hover:text-text-primary transition-colors">For HR Teams</Link>
                                    <Link href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">How It Works</Link>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Company</p>
                                <div className="flex flex-col gap-3">
                                    <Link href="/guide" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Guide</Link>
                                    <Link href="/privacy" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Privacy</Link>
                                    <Link href="/terms" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Terms</Link>
                                    <a href={BRAND_CONFIG.supportUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Support</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-14 pt-8 border-t border-border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <p className="text-xs text-text-muted">2026 Folonite. All rights reserved.</p>
                        <p className="text-xs text-text-muted">Built for people doing real outreach.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
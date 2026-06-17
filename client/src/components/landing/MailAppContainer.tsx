"use client";

import React, { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function MailAppContainer({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNav, setShowNav] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowNav(window.scrollY > 80);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    showNav
                        ? "bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"
                        : "bg-transparent border-b border-transparent shadow-none"
                }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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
                        {user ? (
                            <>
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                                >
                                    <LayoutDashboard size={14} />
                                    Dashboard
                                </button>
                                <button
                                    onClick={async () => { await logout(); router.push("/"); }}
                                    className="text-sm text-text-muted hover:text-error-text transition-colors flex items-center gap-1.5"
                                >
                                    <LogOut size={14} />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
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
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2.5 text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-border-light px-4 sm:px-6 py-6">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    target={link.external ? "_blank" : undefined}
                                    className="text-base font-medium text-text-primary min-h-[44px] flex items-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {user ? (
                                <>
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); router.push("/dashboard"); }}
                                        className="w-full bg-brand text-white font-semibold py-3.5 rounded-lg text-sm mt-1 flex items-center justify-center gap-2"
                                    >
                                        <LayoutDashboard size={16} />
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={async () => { setMobileMenuOpen(false); await logout(); router.push("/"); }}
                                        className="w-full border border-error-bg text-error-text font-semibold py-3.5 rounded-lg text-sm flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full bg-brand text-white font-semibold py-3.5 rounded-lg text-sm mt-1"
                                >
                                    Get Started
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <main>
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border-light">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
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
                        <p className="text-xs text-text-muted">Hire me as GTM engineer for your company — <a href="mailto:fffstanza@gmail.com" className="text-brand hover:text-brand/80 transition-colors">fffstanza@gmail.com</a></p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

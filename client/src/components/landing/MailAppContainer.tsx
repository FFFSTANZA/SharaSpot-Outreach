"use client";

import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MailAppContainer({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Infrastructure", href: "/#features" },
        { label: "Priority", href: "/priority" },
        { label: "Guide", href: "/guide" },
        { label: "FAQ", href: "/faq" },
    ];

    return (
        <div className="min-h-screen bg-white text-text-primary font-sans">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-border-light py-3' : 'bg-white/0 py-5'}`}>
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" />
                    </Link>

                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-[0.1em]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => router.push("/login")}
                            className="text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-[0.1em]"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-brand text-white text-[11px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-lg hover:bg-brand/90 transition-all hover:shadow-brand-glow"
                        >
                            Get Started
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
                    <div className="md:hidden bg-white border-t border-border-light px-6 py-8 animate-in">
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm font-bold text-text-primary uppercase tracking-widest"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-brand text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <main>
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-[#fcfcfc] border-t border-border-light">
                <div className="max-w-6xl mx-auto px-6 py-24">
                    <div className="grid lg:grid-cols-[1fr_auto_auto] gap-20 lg:gap-32">
                        <div>
                            <Logo size="md" />
                            <p className="text-[14px] text-text-secondary mt-6 leading-relaxed max-w-sm">
                                Outreach that feels human, not robotic. Built specifically for high-stakes outreach where delivery determines the outcome.
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-6">Product</p>
                            <div className="flex flex-col gap-4">
                                <Link href="/priority" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Priority Mail</Link>
                                <Link href="/#features" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Infrastructure</Link>
                                <Link href="/#how-it-works" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Workflow</Link>
                                <Link href="/faq" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">FAQ</Link>
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-6">Company</p>
                            <div className="flex flex-col gap-4">
                                <Link href="/guide" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Documentation</Link>
                                <Link href="/privacy" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Privacy Policy</Link>
                                <Link href="/terms" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Terms of Service</Link>
                                <a href={BRAND_CONFIG.supportUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-text-secondary hover:text-brand transition-colors">Support</a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 pt-8 border-t border-border-light flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-[12px] text-text-muted">© 2026 {BRAND_CONFIG.company}. All rights reserved.</p>
                        <div className="flex items-center gap-8">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand" />
                                All systems operational
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

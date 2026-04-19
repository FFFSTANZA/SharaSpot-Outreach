"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Button from "@/components/Button";
import { Logo } from "@/components/Logo";
import { BRAND_CONFIG } from "@/lib/config";

export default function Navbar() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks = [
        { label: "Infrastructure", href: "/#features" },
        { label: "Priority", href: "/priority" },
        { label: "Workflow", href: "/#how-it-works" },
        { label: "Trust", href: "/#stats" },
        { label: "Guide", href: "/guide" },
        { label: "FAQ", href: "/faq" },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-border-light shadow-sm py-2" : "bg-transparent py-4"
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Logo size="md" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium text-text-secondary hover:text-brand transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Button size="sm" onClick={() => router.push("/login")}>
                        Sign In
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-text-primary"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border-light p-6 animate-in">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-lg font-medium text-text-primary"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Button className="w-full" onClick={() => router.push("/login")}>
                            Get Started
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}

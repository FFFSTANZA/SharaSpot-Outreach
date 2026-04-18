"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail, Zap, Shield, Clock,
  ArrowRight, Menu, X, Gauge,
  Rocket, Eye,
  MessageSquare, TrendingUp,
  Briefcase, GraduationCap, Store, Building2,
  Megaphone, Layers, CheckCircle2,
  Users, Flame,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useState, useEffect } from "react";

const features = [
  { icon: Users, title: "Multi-Sender Rotation", desc: "Rotate across multiple email accounts automatically. Distribute volume, avoid rate limits, and scale your outreach without risking any single account." },
  { icon: Gauge, title: "Human-Like Scheduling", desc: "Random delays between emails that mimic real sending patterns. No robotic fixed intervals that trigger spam filters." },
  { icon: Flame, title: "Automatic Warmup", desc: "New senders ramp from 20 to 500 emails/day over 14 days, building inbox reputation safely. Skip it for accounts with existing history." },
  { icon: Eye, title: "Open & Click Tracking", desc: "See who opens your emails and clicks your links. Real-time metrics with per-recipient and per-link breakdowns." },
  { icon: MessageSquare, title: "Reply Detection", desc: "Automatic inbox scanning detects replies and stops follow-ups instantly. No more awkward duplicate emails to engaged prospects." },
  { icon: Shield, title: "Encrypted & Secure", desc: "AES-256 encryption for credentials, JWT auth with token rotation, and per-user data isolation." },
];

const useCases = [
  { icon: Rocket, title: "Founders", desc: "Pitch to investors with personalized outreach and track every interaction." },
  { icon: Briefcase, title: "Job Seekers", desc: "Send personalized applications to recruiters and follow up automatically." },
  { icon: Megaphone, title: "Sales", desc: "Run cold email campaigns across multiple accounts to identify hot leads." },
];

const steps = [
  { num: "01", title: "Add Your Email", desc: "Connect your email account with SMTP credentials. SharaSpot verifies connectivity and starts a warmup.", icon: Mail },
  { num: "02", title: "Build Your Campaign", desc: "Write your email, import recipients via CSV, and set up follow-up sequences.", icon: Layers },
  { num: "03", title: "Send & Track", desc: "Launch immediately or schedule for later. Monitor opens, clicks, and replies in real-time.", icon: TrendingUp },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* ─── Navbar ─── */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-gray-100 py-3" : "bg-transparent py-5"}`}>
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-brand transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand transition-colors">Workflow</a>
            <Link href="/guide" className="hover:text-brand transition-colors">Guide</Link>
            <Link href="/faq" className="hover:text-brand transition-colors">FAQ</Link>
          </div>
          <div className="hidden md:block">
            <button 
              className="h-10 px-6 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover transition-all active:scale-[0.98]" 
              onClick={() => router.push("/login")}
            >
              Get Started
            </button>
          </div>
          <button
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-6 py-8 space-y-6 bg-white">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-semibold text-gray-900" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="text-sm font-semibold text-gray-900" onClick={() => setMobileMenuOpen(false)}>Workflow</a>
              <Link href="/guide" className="text-sm font-semibold text-gray-900" onClick={() => setMobileMenuOpen(false)}>Guide</Link>
              <Link href="/faq" className="text-sm font-semibold text-gray-900" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
            </div>
            <button className="w-full h-12 bg-brand text-white rounded-xl font-semibold" onClick={() => router.push("/login")}>Get Started</button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-light border border-brand-muted px-4 py-1.5 text-xs font-semibold text-brand mb-8">
            <Rocket className="h-3.5 w-3.5" />
            The Professional Outreach Standard
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-gray-900 tracking-tight mb-8">
            Professional outreach<br />
            <span className="text-brand">simplified.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Send emails with human behavior, not bot logic. Scale your outreach safely with multi-sender rotation and real-time response detection.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button 
              className="h-14 px-10 bg-brand text-white rounded-xl text-base font-semibold hover:bg-brand-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm" 
              onClick={() => router.push("/login")}
            >
              Start 7-Day Free Trial <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              className="h-14 px-10 bg-white text-gray-900 border border-gray-200 rounded-xl text-base font-semibold hover:bg-gray-50 transition-all"
              onClick={() => router.push("/guide")}
            >
              Read Documentation
            </button>
          </div>
          
          <div className="mt-16 flex flex-wrap items-center gap-10 justify-center text-xs font-medium text-text-muted">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-brand" /> AES-256 Security</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-brand" /> $20/mo after trial</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand" /> Instant Setup</span>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Built for outreach that actually <span className="text-brand">lands.</span>
            </h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
              Every system is engineered to protect your domain reputation while maximizing scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-card transition-all duration-200 flex flex-col">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm">
                  <f.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Workflow ─── */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">How it works</h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto">Standardize your outreach in three simple steps.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-8 h-16 w-16 flex items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <s.icon className="h-8 w-8 text-brand" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-[280px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Start your professional outreach engine today.
            </h2>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              Standardize your outreach with SharaSpot. Smart, safe, and scaleable. Only $20/month after a 7-day free trial.
            </p>
            <button 
              className="h-14 px-12 bg-brand text-white rounded-xl text-base font-semibold hover:bg-brand-hover transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
              onClick={() => router.push("/login")}
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <Logo size="md" />
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-text-secondary">
            <Link href="/guide" className="hover:text-brand transition-colors">Documentation</Link>
            <Link href="/faq" className="hover:text-brand transition-colors">FAQ</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">Support</a>
            <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-brand transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-text-muted">&copy; 2026 SharaSpot Global</p>
        </div>
      </footer>
    </div>
  );
}

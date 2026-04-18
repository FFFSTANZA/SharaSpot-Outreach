"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  Mail, Shield, Clock, Gauge, AlertTriangle, CheckCircle2,
  ArrowRight, ChevronDown, Send, Users, Rocket,
  Zap, BookOpen, Target, BarChart3, Lock, Menu, X,
  Flame, Paperclip, RefreshCw, FileText, HelpCircle,
} from "lucide-react";

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-24">{children}</section>;
}

function SectionHeader({ icon: Icon, title, bg }: { icon: React.ElementType; title: string; bg: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shadow-sm`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
}

function Accordion({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-200 bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 text-left group">
        <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0 transition-colors">
          <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
        </div>
        <span className="flex-1 text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-gray-50 pt-4">{children}</div>}
    </div>
  );
}

function StepCard({ step, title, desc, icon: Icon }: { step: string; title: string; desc: string; icon?: React.ElementType }) {
  return (
    <div className="flex gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-brand/20 transition-all group">
      <div className="h-8 w-8 rounded-lg bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0">
        {Icon ? <Icon className="h-4 w-4" /> : step}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const limits = [
  { type: "Free Gmail", hourly: "20", daily: "300–400", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { type: "Google Workspace", hourly: "75", daily: "1,500–1,800", color: "bg-brand-light text-brand border-brand/10" },
];

const warmupSchedule = [
  { day: "Day 1–2", limit: "20–30/day", note: "Initial reputation building" },
  { day: "Day 3–5", limit: "50–100/day", note: "Gradual ramp-up" },
  { day: "Day 6–10", limit: "150–300/day", note: "Approaching target" },
  { day: "Day 11–14", limit: "350–500/day", note: "Full capacity" },
];

const navItems = [
  { label: "Getting Started", href: "#getting-started" },
  { label: "Multi-Sender", href: "#multi-sender" },
  { label: "Throttling", href: "#throttling" },
  { label: "Sequences", href: "#sequences" },
  { label: "Variables", href: "#variables" },
  { label: "Best Practices", href: "#best-practices" },
];

export default function GuidePage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            {navItems.slice(0, 4).map((item) => (
              <a key={item.href} href={item.href} className="hover:text-brand transition-colors">{item.label}</a>
            ))}
            <Link href="/faq" className="hover:text-brand transition-colors">FAQ</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">Support</a>
          </div>
          <Button className="hidden md:block" size="sm" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-gray-100 px-6 py-6 space-y-4 bg-white">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="block text-sm font-semibold text-gray-900" onClick={() => setMobileNav(false)}>{item.label}</a>
            ))}
            <Link href="/faq" className="block text-sm font-semibold text-gray-900" onClick={() => setMobileNav(false)}>FAQ</Link>
            <Button className="w-full" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="py-16 md:py-24 bg-white border-b border-gray-100">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-light border border-brand-muted px-4 py-1.5 text-xs font-bold text-brand mb-6 uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            Complete User Guide
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Professional outreach,<br />
            <span className="text-brand">mastered.</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Everything you need to know about multi-sender campaigns, smart throttling, and response management.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 space-y-20">

        {/* Getting Started */}
        <Section id="getting-started">
          <SectionHeader icon={Rocket} title="Getting Started" bg="bg-brand" />
          <div className="space-y-4">
            <StepCard step="1" title="Sign in with Google" desc="Connect instantly with your Google account to access your dashboard." icon={Mail} />
            <StepCard step="2" title="Add & verify a sender" desc="Add your Gmail or Google Workspace accounts using an App Password for secure SMTP access." icon={Shield} />
            <StepCard step="3" title="Configure sending pace" desc="Set hourly and daily limits. SharaSpot adds natural delays between emails to mimic human behavior." icon={Gauge} />
            <StepCard step="4" title="Import recipients" desc="Upload a CSV with personalization variables to send tailored outreach at scale." icon={Users} />
            <StepCard step="5" title="Send & track" desc="Launch your campaign and monitor real-time metrics on opens, clicks, and replies." icon={Send} />
          </div>
        </Section>

        {/* Multi-Sender */}
        <Section id="multi-sender">
          <SectionHeader icon={Users} title="Multi-Sender Rotation" bg="bg-blue-600" />
          <div className="space-y-6">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-6">
              <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wider">Why rotate senders?</h3>
              <p className="text-sm text-blue-700 leading-relaxed font-medium">Protect your domain reputation by distributing volume across multiple accounts. SharaSpot rotates through your pool automatically.</p>
            </div>
            <div className="grid gap-3">
              {[
                { title: "Round-robin rotation", desc: "Evenly distributes emails across your verified sender pool." },
                { title: "Automatic failover", desc: "Instantly switches to another account if one hits a provider limit." },
                { title: "Intelligent recovery", desc: "Automatically resumes sending when accounts regain capacity." }
              ].map((item) => (
                <div key={item.title} className="flex gap-3 items-start p-4 rounded-xl border border-gray-100 bg-white">
                  <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-text-secondary mt-1 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Throttling & Warmup */}
        <Section id="throttling">
          <SectionHeader icon={Gauge} title="Smart Throttling" bg="bg-amber-500" />

          <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">
            Multiple layers of protection to ensure your outreach stays compliant with provider limits and avoids spam filters.
          </p>

          {/* Provider limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {limits.map((l) => (
              <div key={l.type} className={`rounded-xl border p-5 ${l.color}`}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-3">{l.type}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="opacity-80">Hourly</span><span className="font-bold">{l.hourly} emails</span></div>
                  <div className="flex justify-between text-sm"><span className="opacity-80">Daily</span><span className="font-bold">{l.daily} emails</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Warmup schedule */}
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-8">
            <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wider">
                <Flame className="h-4 w-4" />
                Adaptive Warmup
              </h3>
              <p className="text-xs text-amber-700 mt-1 font-medium">Safe ramp-up schedule for new sender accounts.</p>
            </div>
            <div className="divide-y divide-gray-50 bg-white">
              {warmupSchedule.map((w) => (
                <div key={w.day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3 text-sm gap-1">
                  <span className="font-bold text-gray-700 sm:w-24">{w.day}</span>
                  <span className="text-brand font-bold">{w.limit}</span>
                  <span className="text-text-muted text-xs sm:text-right sm:flex-1">{w.note}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Sequences */}
        <Section id="sequences">
          <SectionHeader icon={RefreshCw} title="Follow-Up Sequences" bg="bg-purple-600" />
          <div className="space-y-6">
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-6">
              <h3 className="text-sm font-bold text-purple-900 mb-2 uppercase tracking-wider">Automated Persistence</h3>
              <p className="text-sm text-purple-700 leading-relaxed font-medium">Add up to 5 automated follow-ups that stop instantly when a recipient replies. Multi-threading ensures all follow-ups appear in the same email chain.</p>
            </div>
            
            <div className="flex gap-4 items-start p-5 rounded-xl border border-gray-100 bg-white">
              <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Per-recipient controls</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">Granular control over each recipient&apos;s journey. Manually pause or stop a sequence for any specific person at any time.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* CTA */}
        <div className="rounded-xl bg-gray-900 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to land more replies?</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">Join professional outreach teams who have standardized their workflow on SharaSpot.</p>
            <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
              <Button className="w-full" onClick={() => router.push("/login")}>
                Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button onClick={() => router.push("/faq")} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                View Frequently Asked Questions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <Logo size="sm" />
          <nav className="flex flex-wrap justify-center gap-8">
            <Link href="/guide" className="text-sm font-medium text-text-secondary hover:text-brand">Guide</Link>
            <Link href="/faq" className="text-sm font-medium text-text-secondary hover:text-brand">FAQ</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-text-secondary hover:text-brand">Support</a>
            <Link href="/privacy" className="text-sm font-medium text-text-secondary hover:text-brand">Privacy</Link>
            <Link href="/terms" className="text-sm font-medium text-text-secondary hover:text-brand">Terms</Link>
          </nav>
          <span className="text-sm text-text-muted">&copy; 2026 SharaSpot Global</span>
        </div>
      </footer>
    </div>
  );
}

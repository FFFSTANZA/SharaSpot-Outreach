"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import Button from "@/components/Button";
import {
  Mail, Zap, Shield, Clock, BarChart3, Users,
  ArrowRight, Menu, X, Send, Target, Gauge,
  Rocket, Eye, MousePointerClick,
  RefreshCw, Paperclip, FileText, Flame,
  MessageSquare, TrendingUp, Headphones,
  Briefcase, GraduationCap, Store, Building2,
  Megaphone, HeartHandshake, Layers, CheckCircle2,
  Brain, Calendar, Clock4, Globe, ScanEye,
  LockKeyhole, Sparkles, Crown,
} from "lucide-react";
import { Logo } from "@/components/Logo";

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`fade-in-up ${isVisible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isVisible = useIntersectionObserver(ref as React.RefObject<Element>, { threshold: 0.5 });
  useEffect(() => {
    if (!isVisible) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [isVisible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  { icon: Users, title: "Multi-Sender Rotation", desc: "Rotate across multiple email accounts automatically. Distribute volume, avoid rate limits, and scale your outreach without risking any single account.", color: "from-emerald-500 to-teal-600" },
  { icon: Gauge, title: "Human-Like Scheduling", desc: "Random delays between emails that mimic real sending patterns. No robotic fixed intervals that trigger spam filters.", color: "from-emerald-600 to-green-700" },
  { icon: Flame, title: "Automatic Warmup", desc: "New senders ramp from 20 to 500 emails/day over 14 days, building inbox reputation safely. Skip it for accounts with existing history.", color: "from-amber-500 to-orange-600" },
  { icon: Eye, title: "Open & Click Tracking", desc: "See who opens your emails and clicks your links. Real-time metrics with per-recipient and per-link breakdowns.", color: "from-teal-500 to-emerald-600" },
  { icon: MessageSquare, title: "Reply Detection", desc: "Automatic inbox scanning detects replies and stops follow-ups instantly. No more awkward duplicate emails to engaged prospects.", color: "from-sky-500 to-blue-600" },
  { icon: Shield, title: "Encrypted & Secure", desc: "AES-256 encryption for credentials, JWT auth with token rotation, and per-user data isolation.", color: "from-gray-700 to-gray-900" },
];

const useCases = [
  {
    icon: Rocket,
    title: "Founders Raising Capital",
    desc: "Pitch to hundreds of investors with personalized outreach. Track who opens your deck, follows up, and schedules calls. Maintain a natural sending pattern that never triggers spam.",
    color: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-100",
    text: "text-red-700",
  },
  {
    icon: Briefcase,
    title: "Job Seekers",
    desc: "Send personalized applications to hundreds of recruiters without landing in spam. Follow up automatically until you get a response.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-700",
  },
  {
    icon: Megaphone,
    title: "Sales & Outreach",
    desc: "Run cold email campaigns across multiple accounts. Track opens, clicks, and replies to identify hot leads and close more deals.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    text: "text-violet-700",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    desc: "Reach out to professors, labs, and collaborators at scale. Personalize each message with template variables for genuine connections.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
  },
  {
    icon: Store,
    title: "Freelancers & Agencies",
    desc: "Pitch to potential clients with follow-up sequences that stop when they reply. Build your pipeline while focusing on your craft.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
  },
  {
    icon: Building2,
    title: "Recruiters & HR",
    desc: "Source candidates at volume with personalized outreach. Multi-sender rotation means you never hit daily limits during hiring spikes.",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    text: "text-rose-700",
  },
];

const steps = [
  { num: "01", title: "Add Your Email", desc: "Connect your email account with SMTP credentials. SharaSpot verifies connectivity and starts a 14-day warmup to protect your reputation.", icon: Mail },
  { num: "02", title: "Build Your Campaign", desc: "Write your email, import recipients via CSV, set up follow-up sequences, and configure your sending pace.", icon: Layers },
  { num: "03", title: "Send & Track", desc: "Launch immediately or schedule for later. Monitor opens, clicks, and replies in real-time from your dashboard.", icon: TrendingUp },
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SharaSpot",
            description: "Personal outreach system that sends emails like a human. Multi-sender rotation, automatic warmup, human-like scheduling, reply detection, and real-time tracking.",
            url: "https://sharaspot.com",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            author: {
              "@type": "Organization",
              name: "Folonite",
            },
            featureList: [
              "Multi-sender email rotation",
              "Automatic sender warmup",
              "Human-like scheduling with random delays",
              "Real-time reply detection",
              "Open and click tracking",
              "Follow-up sequences up to 5 steps",
              "Template variables and CSV personalization",
              "AES-256 encrypted credentials",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SharaSpot",
            url: "https://sharaspot.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://sharaspot.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      {/* ─── Navbar ─── */}
      <nav className={`sticky top-0 z-30 transition-all duration-300 bg-white/95 backdrop-blur-xl ${scrolled ? "shadow-sm border-b border-gray-100" : "border-b border-transparent"}`}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5">
          <a href="/" aria-label="Go to homepage"><Logo size="md" /></a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#use-cases" className="hover:text-gray-900 transition-colors">Use Cases</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="/guide" className="hover:text-gray-900 transition-colors">Guide</a>
            <a href="/faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
          <div className="hidden md:block">
            <Button className="w-auto px-5 py-2 rounded-full text-sm" onClick={() => router.push("/login")}>
              Get Started
            </Button>
          </div>
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-gray-900" /> : <Menu className="h-5 w-5 text-gray-900" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-2 bg-white/95 backdrop-blur-xl">
            <a href="#features" className="block text-sm text-gray-700 py-3" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#use-cases" className="block text-sm text-gray-700 py-3" onClick={() => setMobileMenuOpen(false)}>Use Cases</a>
            <a href="#how-it-works" className="block text-sm text-gray-700 py-3" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="/guide" className="block text-sm text-gray-700 py-3" onClick={() => setMobileMenuOpen(false)}>Guide</a>
            <a href="/faq" className="block text-sm text-gray-700 py-3" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-700 py-3" onClick={() => setMobileMenuOpen(false)}>Support</a>
            <Button className="w-full rounded-full mt-2" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-28 lg:pt-20 lg:pb-36">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:flex lg:items-center lg:gap-16">
          <div className="lg:flex-1 text-center lg:text-left" style={{ animation: "fadeInUp 0.8s ease-out" }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-6">
              <Rocket className="h-3.5 w-3.5" />
              Not another email blast tool
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.15] tracking-tight">
              Your inbox is your<br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">most powerful channel</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-700 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              SharaSpot sends emails like a human, not a bot. Rotate across multiple accounts, warm them up automatically, detect replies in real time, and throttle like a person would. No other tool does all of this together.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button className="w-full sm:w-auto px-8 py-3.5 text-sm rounded-full shadow-lg shadow-emerald-600/25" onClick={() => router.push("/login")}>
                Start Free <ArrowRight className="ml-2 h-4 w-4 inline" />
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto px-8 py-3.5 text-sm text-gray-700" onClick={() => router.push("/guide")}>
                Read the Guide
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start text-sm text-gray-600">
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-600" /> AES-256 encrypted</span>
              <span className="h-1 w-1 rounded-full bg-gray-400 hidden sm:block" />
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-emerald-600" /> Free forever</span>
              <span className="h-1 w-1 rounded-full bg-gray-400 hidden sm:block" />
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-600" /> 2 min setup</span>
            </div>
          </div>

          {/* Hero visual — desktop */}
          <div className="hidden lg:block lg:flex-1" style={{ animation: "fadeInUp 1s ease-out 0.2s both" }}>
            <div className="relative">
              <div className="w-full max-w-md mx-auto rounded-2xl bg-white border border-gray-200 shadow-2xl shadow-gray-200/50 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                  <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  <span className="ml-auto text-[10px] text-gray-500 font-mono">campaign · 3 senders</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700 w-12">From:</span>
                    <div className="flex gap-1">
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 font-medium">you@company.com</span>
                      <span className="rounded-full bg-teal-50 text-teal-700 px-2 py-0.5 font-medium">+2 more</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700 w-12">To:</span>
                    <span className="text-gray-700 font-medium">150 recipients from CSV</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="text-[13px] text-gray-600 leading-relaxed space-y-2 py-1">
                    <p>Hi <span className="bg-emerald-100 text-emerald-700 px-1 rounded font-mono text-[11px] font-semibold">{"{{name}}"}</span>,</p>
                    <p>I noticed <span className="bg-emerald-100 text-emerald-700 px-1 rounded font-mono text-[11px] font-semibold">{"{{company}}"}</span> is growing and I'd love to explore how we can work together...</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                      <Eye className="h-3 w-3" /> 42% opened
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700 border border-teal-100">
                      <MessageSquare className="h-3 w-3" /> 18% replied
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 rounded-xl bg-white border border-gray-200 shadow-lg px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2" style={{ animation: "float 4s ease-in-out infinite" }}>
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Warmup: Day 7 · 200/day
              </div>
              <div className="absolute -bottom-2 -left-3 rounded-xl bg-white border border-gray-200 shadow-lg px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2" style={{ animation: "float 4s ease-in-out infinite 2s" }}>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sending · 38/40 this hour
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Built for outreach that<br className="hidden sm:block" /> doesn't land in spam
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Not just another bulk emailer. SharaSpot is built for professionals who need smart, safe, and trackable cold outreach.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((f, i) => (
              <AnimatedSection key={i} delay={i * 80} className="h-full">
                <div className="group h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300 flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/30 transition-all duration-300" />
                  <div className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                    <f.icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="relative text-sm font-bold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="relative text-xs text-gray-600 leading-relaxed flex-1">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use Cases ─── */}
      <section id="use-cases" className="py-16 sm:py-24 md:py-32 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">Use Cases</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Who is SharaSpot for?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Anyone who sends cold emails and wants better results. Here's how different professionals use it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {useCases.map((uc, i) => (
              <AnimatedSection key={i} delay={i * 80} className="h-full">
                <div className={`group h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 hover:shadow-lg transition-all duration-300 flex flex-col`}>
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${uc.color} shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <uc.icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{uc.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed flex-1">{uc.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Up and running in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent" />
            {steps.map((s, i) => (
              <AnimatedSection key={i} delay={i * 120} className="text-center relative group">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 border-emerald-200 shadow-sm relative z-10 group-hover:shadow-lg group-hover:border-emerald-300 transition-all duration-300">
                  <s.icon className="h-6 w-6 text-emerald-600" strokeWidth={1.8} />
                </div>
                <span className="inline-block text-[10px] font-bold text-white bg-emerald-600 rounded-full px-2.5 py-0.5 uppercase tracking-widest mb-3">Step {s.num}</span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">{s.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 sm:py-24 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {[
              { value: 50000, suffix: "+", label: "Emails Sent" },
              { value: 42, suffix: "%", label: "Avg Open Rate" },
              { value: 99, suffix: "%", label: "Delivery Rate" },
              { value: 0, suffix: "", label: "Monthly Cost", prefix: "$" },
            ].map((s, i) => (
              <div key={i} className={`text-center ${i > 0 ? "md:border-l md:border-white/10" : ""} py-2`}>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {s.value === 0 ? "$0" : <AnimatedCounter target={s.value} suffix={s.suffix} />}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Premium Coming Soon ─── */}
      <section className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-6">
              <Crown className="h-3.5 w-3.5" />
              Premium Coming Soon
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Premium is about making you better,<br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">not making you pay more</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Every feature you use today stays free forever. We are building premium because you told us what you need, not because we want to lock things behind a paywall. SharaSpot will always be powerful as a free tool. Premium just adds sharper edges for those who want them.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-5 py-2">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">No feature removals. No limits reduced. No restrictions. Ever.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              {
                icon: Brain,
                title: "AI Subject Line Scorer",
                desc: "Predict open rates before sending. Catches spam triggers, checks length, scores personalization.",
              },
              {
                icon: ScanEye,
                title: "Sentiment Analysis",
                desc: "Auto-classifies replies as Interested, Not Interested, Out of Office, or Wrong Person.",
              },
              {
                icon: Globe,
                title: "Domain Rotation",
                desc: "Automatically rotate sending domains to protect reputation and maximize deliverability.",
              },
              {
                icon: Calendar,
                title: "Calendar Integration",
                desc: "Auto-schedule meetings when someone replies positively. No back-and-forth needed.",
              },
              {
                icon: Sparkles,
                title: "Email Signature Manager",
                desc: "Dynamic signatures that change per campaign and sender. Track which signature performs best.",
              },
              {
                icon: Clock4,
                title: "Timezone Auto-Detection",
                desc: "Detect recipient timezone from email headers. Send at 10 AM their time, automatically.",
              },
              {
                icon: Shield,
                title: "Email Verification",
                desc: "Verify every address before sending. Catch typos, dead domains, and role-based emails.",
              },
              {
                icon: LockKeyhole,
                title: "And More",
                desc: "A/B testing, lead scoring, cross-campaign dedup, inbox placement testing. All coming.",
              },
            ].map((f, i) => (
              <AnimatedSection key={i} delay={i * 60} className="h-full">
                <div className="group h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300 flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/30 transition-all duration-300" />
                  <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-emerald-100 transition-colors duration-300">
                    <f.icon className="h-4 w-4 text-gray-600 group-hover:text-emerald-600 transition-colors duration-300" strokeWidth={1.8} />
                  </div>
                  <h3 className="relative text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="relative text-xs text-gray-600 leading-relaxed flex-1">{f.desc}</p>
                  <div className="relative mt-3 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 px-6 py-12 sm:px-10 sm:py-16 md:px-16 md:py-20 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-emerald-600/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-emerald-300 mb-6 border border-white/10">
                <Rocket className="h-3.5 w-3.5" />
                Free forever · No credit card required
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                Ready to start reaching<br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">the right people?</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
                Smart scheduling, multi-sender rotation, reply detection, and real-time tracking. All in one tool built for professionals who value their inbox reputation.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button className="w-full sm:w-auto px-8 py-3.5 text-sm rounded-full shadow-lg shadow-emerald-600/30" onClick={() => router.push("/login")}>
                  Start Your Outreach <ArrowRight className="ml-2 h-4 w-4 inline" />
                </Button>
                <button
                  className="w-full sm:w-auto px-8 py-3.5 text-sm rounded-full font-medium text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
                  onClick={() => router.push("/guide")}
                >
                  Read the Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <a href="/" aria-label="Go to homepage"><Logo size="sm" /></a>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="/guide" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">Guide</a>
            <a href="/faq" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">Support</a>
            <a href="/privacy" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">Privacy</a>
            <a href="/terms" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">Terms</a>
            <a href="/contact" className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </nav>
          <span className="text-xs text-gray-500">© 2026 SharaSpot</span>
        </div>
      </footer>
    </div>
  );
}

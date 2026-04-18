"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import Button from "@/components/Button";
import {
  Mail, Zap, Shield, Clock,
  ArrowRight, Menu, X, Gauge,
  Rocket, Eye,
  MessageSquare, TrendingUp,
  Briefcase, GraduationCap, Store, Building2,
  Megaphone, HeartHandshake, Layers, CheckCircle2,
  Brain, Calendar, Clock4, Globe, ScanEye,
  LockKeyhole, Sparkles, Crown, Users, Flame,
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
  { icon: Users, title: "Multi-Sender Rotation", desc: "Rotate across multiple email accounts automatically. Distribute volume, avoid rate limits, and scale your outreach without risking any single account.", color: "bg-brand" },
  { icon: Gauge, title: "Human-Like Scheduling", desc: "Random delays between emails that mimic real sending patterns. No robotic fixed intervals that trigger spam filters.", color: "bg-violet-600" },
  { icon: Flame, title: "Automatic Warmup", desc: "New senders ramp from 20 to 500 emails/day over 14 days, building inbox reputation safely. Skip it for accounts with existing history.", color: "bg-amber-500" },
  { icon: Eye, title: "Open & Click Tracking", desc: "See who opens your emails and clicks your links. Real-time metrics with per-recipient and per-link breakdowns.", color: "bg-blue-600" },
  { icon: MessageSquare, title: "Reply Detection", desc: "Automatic inbox scanning detects replies and stops follow-ups instantly. No more awkward duplicate emails to engaged prospects.", color: "bg-rose-600" },
  { icon: Shield, title: "Encrypted & Secure", desc: "AES-256 encryption for credentials, JWT auth with token rotation, and per-user data isolation.", color: "bg-gray-900" },
];

const useCases = [
  {
    icon: Rocket,
    title: "Founders Raising Capital",
    desc: "Pitch to hundreds of investors with personalized outreach. Track who opens your deck, follows up, and schedules calls.",
    color: "bg-red-500",
  },
  {
    icon: Briefcase,
    title: "Job Seekers",
    desc: "Send personalized applications to hundreds of recruiters without landing in spam. Follow up automatically until you get a response.",
    color: "bg-blue-500",
  },
  {
    icon: Megaphone,
    title: "Sales & Outreach",
    desc: "Run cold email campaigns across multiple accounts. Track opens, clicks, and replies to identify hot leads and close more deals.",
    color: "bg-violet-500",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    desc: "Reach out to professors, labs, and collaborators at scale. Personalize each message with template variables.",
    color: "bg-amber-500",
  },
  {
    icon: Store,
    title: "Freelancers & Agencies",
    desc: "Pitch to potential clients with follow-up sequences that stop when they reply. Build your pipeline while focusing on your craft.",
    color: "bg-brand",
  },
  {
    icon: Building2,
    title: "Recruiters & HR",
    desc: "Source candidates at volume with personalized outreach. Multi-sender rotation means you never hit daily limits.",
    color: "bg-rose-500",
  },
];

const steps = [
  { num: "01", title: "Add Your Email", desc: "Connect your email account with SMTP credentials. SharaSpot verifies connectivity and starts a warmup to protect your reputation.", icon: Mail },
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
    <div className="min-h-screen bg-white text-gray-900 font-medium">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SharaSpot",
            description: "Professional outreach system that sends emails like a human. Multi-sender rotation, automatic warmup, human-like scheduling, and real-time tracking.",
            url: "https://sharaspot.com",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "20.00",
              priceCurrency: "USD",
            },
            author: {
              "@type": "Organization",
              name: "Folonite",
            },
          }),
        }}
      />
      {/* ─── Navbar ─── */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 bg-white/90 backdrop-blur-2xl ${scrolled ? "shadow-[0_2px_20px_-2px_rgba(0,0,0,0.05)] border-b border-gray-100 py-3" : "border-b border-transparent py-5"}`}>
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <a href="#features" className="hover:text-brand transition-colors">Features</a>
            <a href="#use-cases" className="hover:text-brand transition-colors">Use Cases</a>
            <a href="#how-it-works" className="hover:text-brand transition-colors">Workflow</a>
            <Link href="/guide" className="hover:text-brand transition-colors">Guide</Link>
            <Link href="/faq" className="hover:text-brand transition-colors">FAQ</Link>
          </div>
          <div className="hidden md:block">
            <button 
              className="h-11 px-8 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:scale-105 transition-all active:scale-95" 
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
          <div className="md:hidden border-t border-gray-100 px-6 py-8 space-y-6 bg-white animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 gap-4">
              {["features", "use-cases", "how-it-works"].map((item) => (
                <a key={item} href={`#${item}`} className="text-sm font-black uppercase tracking-widest text-gray-900" onClick={() => setMobileMenuOpen(false)}>{item.replace('-', ' ')}</a>
              ))}
              <Link href="/guide" className="text-sm font-black uppercase tracking-widest text-gray-900" onClick={() => setMobileMenuOpen(false)}>Guide</Link>
              <Link href="/faq" className="text-sm font-black uppercase tracking-widest text-gray-900" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
            </div>
            <button className="w-full h-14 bg-brand text-white rounded-2xl font-black uppercase tracking-widest" onClick={() => router.push("/login")}>Get Started</button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="absolute inset-0 bg-gray-50/50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/5 rounded-full blur-[120px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand shadow-sm mb-10">
              <Rocket className="h-4 w-4" />
              The Professional Outreach Standard
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tighter mb-8 uppercase">
              Inbox outreach<br />
              <span className="text-brand">perfected.</span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
              SharaSpot sends emails with human behavior, not bot logic. Scale your outreach safely with multi-sender rotation and real-time response detection.
            </p>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button 
                className="h-16 px-10 bg-brand text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/30 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3" 
                onClick={() => router.push("/login")}
              >
                Access Professional Suite <ArrowRight className="h-5 w-5" />
              </button>
              <button 
                className="h-16 px-10 bg-white text-gray-900 border border-gray-200 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-sm"
                onClick={() => router.push("/guide")}
              >
                Read Documentation
              </button>
            </div>
            
            <div className="mt-16 flex flex-wrap items-center gap-10 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-brand" /> AES-256 Security</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-brand" /> $20 Monthly</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand" /> Instant Setup</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Hero Visual ─── */}
      <section className="relative -mt-20 md:-mt-32 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection delay={200}>
            <div className="relative rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-4 md:p-8 overflow-hidden">
               <div className="aspect-[16/9] bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                  <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform group-hover:scale-[1.02] transition-transform duration-700">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-brand" />
                      <div className="ml-auto px-3 py-1 bg-gray-50 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest">Dashboard Preview</div>
                    </div>
                    <div className="space-y-6">
                      <div className="h-4 w-3/4 bg-gray-100 rounded-full" />
                      <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="h-20 bg-brand-light/30 rounded-2xl border border-brand/10 flex flex-col items-center justify-center gap-2">
                           <TrendingUp className="h-5 w-5 text-brand" />
                           <div className="h-2 w-10 bg-brand/20 rounded-full" />
                        </div>
                        <div className="h-20 bg-violet-50 rounded-2xl border border-violet-100 flex flex-col items-center justify-center gap-2">
                           <MessageSquare className="h-5 w-5 text-violet-600" />
                           <div className="h-2 w-10 bg-violet-200 rounded-full" />
                        </div>
                        <div className="h-20 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center justify-center gap-2">
                           <Flame className="h-5 w-5 text-amber-500" />
                           <div className="h-2 w-10 bg-amber-200 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-32 md:py-48 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Core Capabilities</p>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight uppercase leading-[0.95]">
                Built for outreach that actually <span className="text-brand">lands.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Every system is engineered to protect your domain reputation while maximizing scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="group h-full rounded-[2.5rem] border border-gray-100 bg-white p-8 md:p-10 hover:border-brand/20 hover:shadow-[0_20px_40px_-12px_rgba(0,166,62,0.08)] transition-all duration-500 flex flex-col">
                  <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${f.color} shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-500`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-0">
            {[
              { value: 50000, suffix: "+", label: "Emails Processed" },
              { value: 42, suffix: "%", label: "Average Open Rate" },
              { value: 99, suffix: "%", label: "Delivery Success" },
              { value: 20, suffix: "", label: "Monthly Fixed Cost" },
            ].map((s, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-4xl sm:text-5xl font-black text-brand tracking-tighter mb-3">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Workflow ─── */}
      <section id="how-it-works" className="py-32 md:py-48 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-24">
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Automation Protocol</p>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight uppercase">Operational Workflow</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-gray-200 rounded-full" />
            {steps.map((s, i) => (
              <AnimatedSection key={i} delay={i * 150} className="relative z-10 text-center">
                <div className="mx-auto mb-10 h-20 w-20 flex items-center justify-center rounded-[2rem] bg-white border-4 border-gray-50 shadow-xl group-hover:scale-110 transition-transform">
                  <s.icon className="h-8 w-8 text-brand" />
                </div>
                <div className="inline-block px-4 py-1.5 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Phase {s.num}</div>
                <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">{s.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[280px] mx-auto">{s.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 md:py-48">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative rounded-[3rem] bg-gray-900 px-8 py-20 md:px-20 md:py-32 text-center overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand/20 via-transparent to-transparent" />
             <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tight leading-[0.95]">
                  Start your <span className="text-brand">professional</span> outreach engine today.
                </h2>
                <p className="text-lg text-gray-400 font-medium mb-12 max-w-xl mx-auto leading-relaxed">
                  Join hundreds of professionals who have standardized their outreach on SharaSpot. Smart, safe, and scaleable.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button 
                    className="h-16 px-12 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/40 hover:scale-105 transition-all active:scale-95"
                    onClick={() => router.push("/login")}
                  >
                    Get Full Access
                  </button>
                  <button 
                    className="h-16 px-12 bg-white/5 text-white border border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                    onClick={() => router.push("/guide")}
                  >
                    View Pricing
                  </button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-20 border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Link href="/guide" className="hover:text-brand transition-colors">Documentation</Link>
            <Link href="/faq" className="hover:text-brand transition-colors">FAQ</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">Support</a>
            <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-brand transition-colors">Terms</Link>
          </div>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">&copy; 2026 SharaSpot Global</p>
        </div>
      </footer>
    </div>
  );
}

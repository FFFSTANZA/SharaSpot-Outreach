"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  ChevronDown, HelpCircle, Mail, Shield, Clock, Gauge,
  Users, Zap, Paperclip, RefreshCw, ArrowRight, Menu, X,
  Flame, Snowflake, FileText, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
  icon: React.ElementType;
}

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all duration-200",
      isOpen ? "border-[#00A63E]/20 bg-[#00A63E]/[0.02] shadow-sm" : "border-gray-100 hover:border-gray-200"
    )}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isOpen ? "bg-[#00A63E]/10" : "bg-gray-50"
        )}>
          <item.icon className={cn("h-4 w-4", isOpen ? "text-[#00A63E]" : "text-gray-400")} />
        </div>
        <span className={cn(
          "flex-1 text-sm font-semibold transition-colors",
          isOpen ? "text-gray-900" : "text-gray-700"
        )}>{item.question}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180 text-[#00A63E]"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200 ease-out",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed ml-11">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

const faqItems: FAQItem[] = [
  // ─── AI & Automation ───
  {
    category: "AI & Innovation",
    icon: Zap,
    question: "How does the AI Follow-up Generator work?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot uses a proprietary &ldquo;Context Locking&rdquo; engine. It analyzes your original email to identify unique value anchors (like specific pain points or offers) and crafts follow-ups that feel like a direct continuation of your first message.</p>
        <p>Unlike generic tools, it avoids robotic filler words and focuses on curiosity-driven questions that provoke higher reply rates.</p>
      </div>
    ),
  },
  {
    category: "AI & Innovation",
    icon: RefreshCw,
    question: "What is the Shara AI Agent?",
    answer: <p>The Shara Agent is an experimental autonomous outreach engine that handles personalized research and initial contact on your behalf. It mimics human research patterns to find high-intent signals before reaching out, ensuring every email is deeply relevant.</p>,
  },
  // ─── Warmup & Throttling ───
  {
    category: "Warmup & Throttling",
    icon: Flame,
    question: "What is the 14-day warmup and can I skip it?",
    answer: (
      <div className="space-y-2">
        <p>When you add a new sender, SharaSpot automatically starts a 14-day warmup period that gradually increases your daily sending limit from 20 to 500 emails/day. This builds your sender reputation with email providers and prevents your account from being flagged.</p>
        <p>You can skip warmup for established accounts, but we always recommend letting our adaptive algorithm handle the ramp-up for maximum delivery safety.</p>
      </div>
    ),
  },
  {
    category: "Warmup & Throttling",
    icon: Gauge,
    question: "What happens when I hit my sending limit?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot enforces three layers of rate limiting: per-minute, per-hour, and per-day. When any limit is reached, pending emails are automatically rescheduled with a small random delay - they&apos;re not lost.</p>
        <p>If you&apos;re using multiple senders, SharaSpot will automatically rotate to the next available sender. If all senders are exhausted, the campaign pauses and auto-resumes when capacity is available.</p>
      </div>
    ),
  },
  // ─── Multi-Sender & Scale ───
  {
    category: "Scale & Delivery",
    icon: Users,
    question: "Can I use multiple email accounts?",
    answer: <p>Yes. SharaSpot is built for scale. You can connect multiple SMTP accounts and our multi-sender rotation engine will automatically distribute your campaign volume across all of them to stay under provider limits and maintain high deliverability.</p>,
  },
  {
    category: "Scale & Delivery",
    icon: Shield,
    question: "Is there a limit on how many campaigns I can run?",
    answer: <p>No. During our early access period, every active subscription includes unlimited campaigns. You can run parallel outreach for different products, markets, or hiring roles without any artificial caps.</p>,
  },
  // ─── PRM & Inbox ───
  {
    category: "PRM & Inbox",
    icon: Mail,
    question: "What is the PRM Infrastructure?",
    answer: (
      <div className="space-y-2">
        <p>PRM stands for Personal Relationship Management. Our infrastructure treats your outreach as the beginning of a long-term relationship, not a one-off broadcast. It includes automatic reply detection, thread-safe follow-ups, and an integrated inbox that keeps your high-stakes conversations organized and moving forward.</p>
      </div>
    ),
  },
  // ─── Security ───
  {
    category: "Security",
    icon: Shield,
    question: "How are my Gmail credentials stored?",
    answer: (
      <div className="space-y-2">
        <p>Your Google App Password is encrypted using AES-256-CBC with a unique random initialization vector before being stored in the database. The encryption key is a server-side secret that never leaves the server.</p>
        <p>Credentials are only decrypted momentarily in memory when the worker needs to send an email, then discarded immediately.</p>
      </div>
    ),
  },
  {
    category: "Security",
    icon: Mail,
    question: "What is a Google App Password and why do I need one?",
    answer: (
      <div className="space-y-2">
        <p>Google App Passwords are 16-character codes that let SharaSpot access your Gmail via SMTP without using your main password. Google requires them specifically for high-security third-party access.</p>
        <p>To generate one: go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-bold">myaccount.google.com/apppasswords</a> (requires 2-Step Verification enabled).</p>
      </div>
    ),
  },
  // ─── Tracking ───
  {
    category: "Tracking",
    icon: Mail,
    question: "How does open tracking work?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot adds a tiny transparent 1x1 pixel image to each outgoing email. When the recipient&apos;s email client loads this image, the server records an open event. This is the industry-standard method used by all professional outreach platforms.</p>
      </div>
    ),
  },
  {
    category: "Tracking",
    icon: Mail,
    question: "Can I disable tracking for a specific campaign?",
    answer: <p>Yes. In the compose form&apos;s Sending Settings section, you can toggle &ldquo;Track opens&rdquo; and &ldquo;Track clicks&rdquo; independently. This is useful for high-priority personal outreach where you want to maintain maximum privacy.</p>,
  },
];

const categories = [...new Set(faqItems.map((item) => item.category))];

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const filtered = faqItems.filter((item) => {
    const matchesSearch = !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === "string" && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/guide" className="hover:text-brand transition-colors">Guide</Link>
            <Link href="/priority" className="hover:text-brand transition-colors">Priority</Link>
            <Link href="/faq" className="text-brand">FAQ</Link>
          </div>
          <Button className="hidden md:block w-auto px-5 py-2 rounded-full text-sm" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-1 bg-white">
            <Link href="/guide" className="block text-sm text-gray-600 py-3">Guide</Link>
            <Link href="/priority" className="block text-sm text-gray-600 py-3">Priority</Link>
            <Link href="/faq" className="block text-sm text-brand font-bold py-3">FAQ</Link>
            <Button className="w-full rounded-full mt-2" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-brand/[0.03] to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/[0.05] rounded-full blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/[0.08] border border-brand/10 px-4 py-1.5 text-xs font-bold text-brand uppercase tracking-widest mb-6">
            <HelpCircle className="h-3.5 w-3.5" />
            Support & Knowledge
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-[1.05]">
            Everything you need <br /><span className="text-brand">to know.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto font-medium">
            Find answers to common questions about warmup, AI-driven follow-ups, and high-performance deliverability settings.
          </p>

          {/* Search */}
          <div className="relative mt-10 max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or questions..."
              className="w-full h-14 rounded-2xl bg-white border border-gray-200 pl-12 pr-4 text-sm text-gray-700 outline-none shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/10 placeholder:text-gray-300 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
              !activeCategory
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all border",
                activeCategory === cat
                  ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                  : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
              <HelpCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-base font-bold text-gray-400">No matching questions found.</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                className="text-sm text-brand font-black uppercase tracking-widest mt-4 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filtered.map((item, index) => (
              <FAQAccordion
                key={index}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))
          )}
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-[40px] bg-gray-900 p-8 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/[0.1] rounded-full blur-[120px]" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-4">Still have questions?</h3>
            <p className="text-base text-gray-400 mb-10 max-w-md mx-auto font-medium leading-relaxed">Our documentation and support team are here to ensure your outreach engine never stops.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Button className="w-full sm:w-auto px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest" onClick={() => router.push("/guide")}>
                View Documentation
              </Button>
              <button
                onClick={() => window.open("https://tally.so/r/aQee69", "_blank")}
                className="w-full sm:w-auto px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-white border border-white/10 hover:bg-white/5 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-[#fdfdfd]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" aria-label="Go to homepage"><Logo size="sm" /></Link>
            <p className="text-xs text-text-muted font-medium">Built for high-stakes outreach by Folonite.</p>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            <Link href="/guide" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-brand transition-colors">Guide</Link>
            <Link href="/priority" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-brand transition-colors">Priority</Link>
            <Link href="/privacy" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-brand transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-brand transition-colors">Terms</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase tracking-widest text-brand transition-colors">Support</a>
          </nav>
          <span className="text-[11px] font-bold text-gray-300">© 2026 SharaSpot</span>
        </div>
      </footer>
    </div>
  );
}

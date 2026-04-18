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
      isOpen ? "border-brand/20 bg-brand/[0.02]" : "border-gray-100 hover:border-gray-200 bg-white"
    )}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 text-left group">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isOpen ? "bg-brand/10" : "bg-gray-50 group-hover:bg-gray-100"
        )}>
          <item.icon className={cn("h-4 w-4", isOpen ? "text-brand" : "text-gray-400")} />
        </div>
        <span className={cn(
          "flex-1 text-sm font-semibold transition-colors",
          isOpen ? "text-gray-900" : "text-gray-700"
        )}>{item.question}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180 text-brand"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed ml-11 border-t border-gray-50 pt-4">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

const faqItems: FAQItem[] = [
  // ─── Warmup & Throttling ───
  {
    category: "Warmup & Throttling",
    icon: Flame,
    question: "What is the 14-day warmup and can I skip it?",
    answer: (
      <div className="space-y-2">
        <p>When you add a new sender, SharaSpot automatically starts a 14-day warmup period that gradually increases your daily sending limit from 20 to 500 emails/day. This builds your sender reputation with email providers and prevents your account from being flagged.</p>
        <p>You can skip warmup by checking &ldquo;Skip warmup period&rdquo; when adding a sender — but only do this if the account already has established sending history. Skipping warmup on a brand-new account risks triggering Gmail&apos;s spam filters.</p>
      </div>
    ),
  },
  {
    category: "Warmup & Throttling",
    icon: Gauge,
    question: "What happens when I hit my sending limit?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot enforces three layers of rate limiting: per-minute, per-hour, and per-day. When any limit is reached, pending emails are automatically rescheduled with a small random delay — they&apos;re not lost.</p>
        <p>If you&apos;re using multiple senders, SharaSpot will automatically rotate to the next available sender. If all senders are exhausted, the campaign pauses and auto-resumes when capacity is available (checked every hour).</p>
      </div>
    ),
  },
  {
    category: "Warmup & Throttling",
    icon: Snowflake,
    question: "What is a cooldown and why did my sender enter one?",
    answer: (
      <div className="space-y-2">
        <p>If a sender encounters 3 consecutive SMTP errors (e.g., connection refused, authentication failure), SharaSpot puts it in a 5-minute cooldown. No emails are sent during cooldown to prevent further damage to your sender reputation.</p>
        <p>After cooldown expires, sending resumes automatically. A single successful send resets the error counter. You can see cooldown status in the Throttle Status panel on the campaign detail page.</p>
      </div>
    ),
  },
  {
    category: "Warmup & Throttling",
    icon: Gauge,
    question: "What does 'adaptive throttle' mean?",
    answer: (
      <p>SharaSpot monitors your error rate and bounce rate over a rolling 1-hour window. If more than 10% of emails fail or more than 5% bounce, all rate limits are automatically halved to protect your account. Once the rates drop back to normal, full speed resumes.</p>
    ),
  },
  // ─── Multi-Sender ───
  {
    category: "Multi-Sender",
    icon: Users,
    question: "How does multi-sender rotation work?",
    answer: (
      <div className="space-y-2">
        <p>When you select multiple senders for a campaign, SharaSpot distributes emails across them using round-robin — each sender gets roughly equal volume, respecting their individual daily limits.</p>
        <p>During sending, if one sender hits its limit, emails are automatically reassigned to the next available sender. This lets you send higher volumes without exceeding any single account&apos;s limits.</p>
      </div>
    ),
  },
  {
    category: "Multi-Sender",
    icon: Users,
    question: "Do all senders need to be verified?",
    answer: <p>Yes. Every sender in a campaign must have verified SMTP credentials (a Google App Password). Unverified senders are shown in the dropdown but can&apos;t be selected for campaigns.</p>,
  },
  // ─── Sequences ───
  {
    category: "Sequences",
    icon: RefreshCw,
    question: "How do follow-up sequences work?",
    answer: (
      <div className="space-y-2">
        <p>You can add up to 5 follow-up steps to a campaign. Each step has its own subject, body, and a wait period (in days) after the previous step was sent.</p>
        <p>The sequence scheduler runs every 15 minutes, checking which recipients are due for their next follow-up. If a recipient replies to any step, their sequence stops automatically.</p>
      </div>
    ),
  },
  {
    category: "Sequences",
    icon: RefreshCw,
    question: "Can I pause or stop a sequence for specific recipients?",
    answer: <p>Yes. On the campaign detail page, switch to the Sequence tab. You can pause, resume, or stop individual recipients. You can also pause/stop the entire sequence for all recipients at once.</p>,
  },
  // ─── Template Variables ───
  {
    category: "Templates & Variables",
    icon: Zap,
    question: "How do template variables work with CSV imports?",
    answer: (
      <div className="space-y-2">
        <p>When you import a CSV, the first column must be email addresses. Additional columns become template variables. For example, a CSV with columns <code className="bg-gray-100 px-1 rounded text-xs">email, name, company</code> lets you use <code className="bg-gray-100 px-1 rounded text-xs">{"{{name}}"}</code> and <code className="bg-gray-100 px-1 rounded text-xs">{"{{company}}"}</code> in your subject and body.</p>
        <p>Variables are resolved per-recipient when the campaign is created. Unmatched variables (no CSV column) are left as-is in the email. The Variable Preview panel shows you exactly what each recipient will see.</p>
      </div>
    ),
  },
  {
    category: "Templates & Variables",
    icon: FileText,
    question: "What&apos;s the difference between templates and template variables?",
    answer: (
      <div className="space-y-2">
        <p>Templates are saved subject/body pairs you can reuse across campaigns — like a &ldquo;cold outreach&rdquo; template or a &ldquo;follow-up&rdquo; template. You create them in the Templates page.</p>
        <p>Template variables (<code className="bg-gray-100 px-1 rounded text-xs">{"{{variable}}"}</code>) are placeholders that get replaced with per-recipient data from your CSV. They work inside any email, whether you started from a template or wrote it from scratch.</p>
      </div>
    ),
  },
  // ─── Attachments ───
  {
    category: "Attachments",
    icon: Paperclip,
    question: "What are the attachment limits?",
    answer: (
      <div className="space-y-2">
        <p>10 MB per file, 25 MB total per campaign, up to 10 files. Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, GIF.</p>
        <p>The 25 MB limit matches Gmail&apos;s attachment limit — exceeding it would cause emails to bounce.</p>
      </div>
    ),
  },
  // ─── Campaign Controls ───
  {
    category: "Campaign Controls",
    icon: Shield,
    question: "What happens when I pause a campaign?",
    answer: (
      <div className="space-y-2">
        <p>Pending emails stop being sent immediately. Emails already in the process of sending will complete. When you resume, any emails whose scheduled time has passed are rescheduled starting from now, preserving the original order and delay settings.</p>
      </div>
    ),
  },
  {
    category: "Campaign Controls",
    icon: Shield,
    question: "What happens when I cancel a campaign?",
    answer: <p>All pending emails are immediately marked as cancelled and won&apos;t be sent. Emails already sent are not affected. Cancellation is permanent — you can&apos;t resume a cancelled campaign.</p>,
  },
  // ─── Security ───
  {
    category: "Security",
    icon: Shield,
    question: "How are my Gmail credentials stored?",
    answer: (
      <div className="space-y-2">
        <p>Your Google App Password is encrypted using AES-256-CBC with a unique random initialization vector before being stored in the database. The encryption key is a server-side secret that never leaves the server.</p>
        <p>Credentials are only decrypted momentarily in memory when the worker needs to send an email, then discarded. They are never included in API responses, logs, or error messages.</p>
      </div>
    ),
  },
  {
    category: "Security",
    icon: Mail,
    question: "What is a Google App Password and why do I need one?",
    answer: (
      <div className="space-y-2">
        <p>Google App Passwords are 16-character codes that let third-party apps access your Gmail via SMTP without using your main password. Google requires them since they disabled "Less Secure App" access in 2022.</p>
        <p>To generate one: go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-semibold">myaccount.google.com/apppasswords</a> (requires 2-Step Verification enabled). Create one specifically for SharaSpot and paste it when adding a sender.</p>
      </div>
    ),
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
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <Link href="/guide" className="hover:text-brand transition-colors">Guide</Link>
            <Link href="/faq" className="text-brand">FAQ</Link>
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
            <Link href="/guide" className="block text-sm font-semibold text-gray-900" onClick={() => setMobileNav(false)}>Guide</Link>
            <Link href="/faq" className="block text-sm font-semibold text-gray-900" onClick={() => setMobileNav(false)}>FAQ</Link>
            <Button className="w-full" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="py-16 md:py-20 bg-white border-b border-gray-100">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-xs font-bold text-brand mb-6 uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Got questions? We&apos;ve got answers.
          </h1>
          <p className="mt-4 text-base text-text-secondary max-w-lg mx-auto font-medium">
            Everything you need to know about warmup, throttling, sequences, and more.
          </p>

          {/* Search */}
          <div className="relative mt-8 max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-brand transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-bold transition-all",
              !activeCategory
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold transition-all",
                activeCategory === cat
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <HelpCircle className="h-10 w-10 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-text-secondary font-medium">No matching questions found.</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                className="text-sm text-brand font-bold hover:underline mt-2"
              >
                Clear filters
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
        <div className="mt-16 rounded-xl bg-gray-900 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">Check out our detailed guide or get started and explore the features yourself.</p>
            <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
              <Button className="w-full" onClick={() => router.push("/guide")}>
                Read the Guide <ArrowRight className="ml-1.5 h-3.5 w-3.5 inline" />
              </Button>
              <button
                onClick={() => router.push("/contact")}
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Contact Support Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <Link href="/" aria-label="Go to homepage"><Logo size="sm" /></Link>
          <nav className="flex flex-wrap justify-center gap-8">
            <Link href="/guide" className="text-sm font-medium text-text-secondary hover:text-brand">Guide</Link>
            <Link href="/faq" className="text-sm font-medium text-text-secondary hover:text-brand">FAQ</Link>
            <Link href="/privacy" className="text-sm font-medium text-text-secondary hover:text-brand">Privacy</Link>
            <Link href="/terms" className="text-sm font-medium text-text-secondary hover:text-brand">Terms</Link>
          </nav>
          <span className="text-sm text-text-muted">&copy; 2026 SharaSpot Global</span>
        </div>
      </footer>
    </div>
  );
}

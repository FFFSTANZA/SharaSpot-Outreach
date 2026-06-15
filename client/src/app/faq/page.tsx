"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  ChevronDown, HelpCircle, Menu, X,
  Search, BookOpen, Target, Activity,
  Lock, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME, absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  desc: string;
}

const categories: FAQCategory[] = [
  { id: "start", label: "Getting Started", icon: BookOpen, desc: "Set up your account and start sending" },
  { id: "delivery", label: "Sending & Delivery", icon: Send, desc: "Limits, warmup, and multi-account rotation" },
  { id: "campaigns", label: "Campaigns & Sequences", icon: Target, desc: "Compose, track, and automate follow-ups" },
  { id: "features", label: "Features", icon: Activity, desc: "PRM, calls, MCP, team, and more" },
  { id: "security", label: "Security & Privacy", icon: Lock, desc: "Credentials, encryption, and data safety" },
];

const faqItems: FAQItem[] = [
  // ─── GETTING STARTED ───
  {
    category: "start",
    question: "How do I set up my first sender?",
    answer: (
      <div className="space-y-2">
        <p>After signing in with Google, go to the <span className="font-semibold text-slate-900">Senders</span> page. Click <span className="font-semibold text-slate-900">Add Sender</span>, pick your provider (Gmail, Outlook, Zoho, Yahoo, or Custom SMTP), and enter your email address along with an app password. SharaSpot will verify the connection automatically.</p>
        <p>Every new sender starts with a 14-day adaptive warmup that gradually increases daily limits from 20 to 500 emails — building reputation before you scale.</p>
      </div>
    ),
  },
  {
    category: "start",
    question: "What is a Google App Password and why do I need one?",
    answer: (
      <div className="space-y-2">
        <p>Google App Passwords are 16-character codes that let SharaSpot access your Gmail via SMTP without using your main password. Google requires them specifically for high-security third-party access.</p>
        <p>To generate one: go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold hover:underline">myaccount.google.com/apppasswords</a> (requires 2-Step Verification enabled). Select <span className="font-semibold text-slate-900">Mail</span> as the app and <span className="font-semibold text-slate-900">Other</span> for device name, then copy the generated password.</p>
      </div>
    ),
  },
  {
    category: "start",
    question: "Can I skip the warmup period?",
    answer: (
      <div className="space-y-2">
        <p>Yes. When adding a new sender, you can toggle off warmup if the account already has an established sending history. We recommend keeping warmup enabled for any new or rarely-used email account to build reputation gradually.</p>
        <p>Warmup runs for 14 days. The daily limit ramps from 20 to 500 emails, and the system adapts based on your deliverability signals. If bounces or errors spike, it pauses automatically.</p>
      </div>
    ),
  },

  // ─── SENDING & DELIVERY ───
  {
    category: "delivery",
    question: "Can I use multiple email accounts?",
    answer: (
      <div className="space-y-2">
        <p>Yes. SharaSpot is built for scale. You can connect multiple SMTP accounts — Gmail, Workspace, Outlook, Zoho, Yahoo, or custom SMTP — and our multi-sender rotation engine distributes campaign volume across all of them automatically.</p>
        <p>If one sender hits its daily limit, the rest pick up the slack. No manual intervention needed.</p>
      </div>
    ),
  },
  {
    category: "delivery",
    question: "Is there a limit on how many campaigns I can run?",
    answer: (
      <div className="space-y-2">
        <p>No. During our early access period, every active subscription includes unlimited campaigns. You can run parallel outreach for different products, markets, or hiring roles without any artificial caps.</p>
        <p>Each campaign can include up to 10 automated follow-up steps with customizable wait periods.</p>
      </div>
    ),
  },
  {
    category: "delivery",
    question: "What happens when I hit my sending limit?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot enforces per-minute, per-hour, and per-day rate limits. When any limit is reached, pending emails are rescheduled with a small random delay — they are never lost.</p>
        <p>If you use multiple senders, the system rotates to the next available account automatically. If all senders are exhausted, the campaign pauses and auto-resumes when capacity frees up (checked hourly).</p>
      </div>
    ),
  },
  {
    category: "delivery",
    question: "What is Priority Delivery?",
    answer: (
      <div className="space-y-2">
        <p>Priority Delivery is our premium sending infrastructure. It uses adaptive throttling, intelligent routing, and real-time congestion detection to maximize inbox placement rates. Campaigns use it automatically when priority is enabled.</p>
        <p>It&apos;s included in every plan at no extra cost. See the <Link href="/priority" className="text-brand font-semibold hover:underline">Priority page</Link> for detailed benchmarks.</p>
      </div>
    ),
  },
  {
    category: "delivery",
    question: "How does sender rotation work?",
    answer: (
      <div className="space-y-2">
        <p>When a campaign has multiple senders assigned, SharaSpot distributes emails evenly across all of them. Each sender operates within its own daily limit, so volume scales with every account you add.</p>
        <p>You can also set a per-sender delay (in seconds) to spread sends further apart, reducing the chance of provider throttling.</p>
      </div>
    ),
  },

  // ─── CAMPAIGNS & SEQUENCES ───
  {
    category: "campaigns",
    question: "How do follow-up sequences work?",
    answer: (
      <div className="space-y-2">
        <p>You can add up to 10 follow-up steps to any campaign. Each step has its own subject line, body, and wait period (minimum 1 day between steps). When a recipient replies, their sequence stops automatically — no one gets a follow-up after responding.</p>
        <p>From the campaign detail page, you can pause, resume, or stop sequences for individual recipients or the entire campaign at once.</p>
      </div>
    ),
  },
  {
    category: "campaigns",
    question: "How does open and click tracking work?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot adds a tiny transparent 1x1 pixel image to each outgoing email. When the recipient loads the image, the server records an open event. Links are wrapped in a tracking redirect so clicks are recorded too. This is the industry-standard method used by all professional outreach platforms.</p>
        <p>You can toggle tracking on or off per campaign in the Engagement Tracking section of the compose settings.</p>
      </div>
    ),
  },
  {
    category: "campaigns",
    question: "Can I use email templates?",
    answer: (
      <div className="space-y-2">
        <p>Yes. Save any campaign&apos;s subject and body as an email template, and save follow-up structures separately from the Sequences page. When composing a new campaign, you can pick a saved template and reuse your best-performing emails. Templates support personalization variables from your CSV columns.</p>
      </div>
    ),
  },
  {
    category: "campaigns",
    question: "How does email validation work?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot checks every recipient before sending. It catches typos, disposable addresses, role-based accounts (like info@, support@), and domains that cannot receive email. Each address gets a risk score so you can decide what to keep or remove.</p>
        <p>Use the Validate button in the compose form to check your list before sending.</p>
      </div>
    ),
  },

  // ─── FEATURES ───
  {
    category: "features",
    question: "What is the PRM (Partner Relationship Management) feature?",
    answer: (
      <div className="space-y-2">
        <p>PRM helps you organize channel partners, resellers, and business relationships. Create contact lists, tag contacts, and move them through lifecycle stages (Cold, Warm, Hot, Replied, Converted, Bounced). Import existing data from CSV, send direct emails from contact profiles, and set automated follow-ups so no relationship goes cold.</p>
      </div>
    ),
  },
  {
    category: "features",
    question: "How does Call Tracking work?",
    answer: (
      <div className="space-y-2">
        <p>The Calls page lets you manage phone outreach alongside your email campaigns. View your scheduled call queue, filter by pipeline stage (Pending, Follow-up Required, Interested, Not Interested, Converted, Closed), and log outcomes after each call.</p>
        <p>Available dispositions: No Answer, Connected, Interested, Booked Meeting, Not a Fit, and Do Not Call. Terminal outcomes like Do Not Call prevent future call tasks automatically. Every call is linked to a PRM contact for full context.</p>
      </div>
    ),
  },
  {
    category: "features",
    question: "What are MCP Integrations?",
    answer: (
      <div className="space-y-2">
        <p>MCP (Model Context Protocol) lets you connect SharaSpot to AI coding assistants like Claude, Cursor, Windsurf, and VS Code. Create API keys with granular permissions — Read Only, Read/Write Selected, or Full Access — and choose which data each key can access.</p>
        <p>Personal keys are scoped to your account; Organization keys (for admins and owners) give workspace-wide access. Setup snippets are provided for each editor.</p>
      </div>
    ),
  },
  {
    category: "features",
    question: "How does Team Collaboration work?",
    answer: (
      <div className="space-y-2">
        <p>You can invite up to 5 team members to your workspace with role-based access. Roles include Owner (full control), Admin (can manage members and invites), Member (can create and edit), and Viewer (read-only access).</p>
        <p>Invite links expire after 7 days. All campaigns, contacts, senders, and templates are shared within the workspace.</p>
      </div>
    ),
  },
  {
    category: "features",
    question: "How does the inbox handle replies?",
    answer: (
      <div className="space-y-2">
        <p>When someone replies to your campaign, the conversation appears in the SharaSpot inbox. You can read, reply, star, or archive it without leaving the app. Reply detection also stops the recipient&apos;s follow-up sequence automatically — no embarrassing follow-ups after they have responded.</p>
      </div>
    ),
  },

  // ─── SECURITY & PRIVACY ───
  {
    category: "security",
    question: "How are my Gmail credentials stored?",
    answer: (
      <div className="space-y-2">
        <p>Your Google App Password is encrypted using AES-256-CBC with a unique random initialization vector before being stored in the database. The encryption key is a server-side secret that never leaves the server.</p>
        <p>Credentials are only decrypted momentarily in memory when the worker needs to send an email, then discarded immediately.</p>
      </div>
    ),
  },
  {
    category: "security",
    question: "Can I revoke access at any time?",
    answer: (
      <div className="space-y-2">
        <p>Yes. You can delete any sender from the Senders page at any time. You can also revoke the app password directly from your Google Account settings under <span className="font-semibold text-slate-900">Security &gt; App Passwords</span>.</p>
      </div>
    ),
  },
  {
    category: "security",
    question: "What data does SharaSpot collect?",
    answer: (
      <div className="space-y-2">
        <p>SharaSpot only stores what is needed to send and track your campaigns: sender credentials (encrypted), recipient email addresses, campaign content, and engagement data (opens, clicks, replies). We do not sell or share your data with third parties. See our <Link href="/privacy" className="text-brand font-semibold hover:underline">Privacy Policy</Link> for details.</p>
      </div>
    ),
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
    {
      "@type": "FAQPage",
      "name": `${SITE_NAME} FAQ`,
      "url": absoluteUrl("/faq"),
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I set up my first sender?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "After signing in, go to Senders, add a sender, choose your provider, and connect it with an app password. New senders can start with adaptive warmup to build reputation gradually."
          }
        },
        {
          "@type": "Question",
          "name": "Can I use multiple email accounts?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. SharaSpot supports multiple SMTP accounts and automatically rotates campaign volume across them so you can scale outreach without overloading one mailbox."
          }
        },
        {
          "@type": "Question",
          "name": "What happens when I hit my sending limit?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SharaSpot enforces rate limits and reschedules pending emails instead of dropping them. If multiple senders are connected, the system rotates to the next available account automatically."
          }
        },
        {
          "@type": "Question",
          "name": "How do follow-up sequences work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can add follow-up steps with separate wait periods, subject lines, and copy. Sequences stop automatically when a recipient replies."
          }
        },
        {
          "@type": "Question",
          "name": "How are my credentials stored?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sender credentials are encrypted before storage and only decrypted briefly in memory when needed for sending."
          }
        }
      ]
    }
  ]
};

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const filtered = faqItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      item.question.toLowerCase().includes(q);
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/guide" className="hover:text-slate-900 transition-colors">Guide</Link>
            <Link href="/priority" className="hover:text-slate-900 transition-colors">Priority</Link>
            <Link href="/faq" className="text-brand">FAQ</Link>
          </div>
          <Button className="hidden md:block w-auto px-5 py-2 rounded-lg text-sm font-semibold" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-2 bg-white">
            <Link href="/guide" className="block text-sm font-medium text-slate-600 py-2">Guide</Link>
            <Link href="/priority" className="block text-sm font-medium text-slate-600 py-2">Priority</Link>
            <Link href="/faq" className="block text-sm font-medium text-brand py-2">FAQ</Link>
            <Button className="w-full rounded-lg mt-2" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="py-20 lg:py-28 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-6">
            <HelpCircle size={12} /> Support & Knowledge
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Your questions, <span className="text-brand">answered.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Everything you need to know about warmup, sending, features, and security.
          </p>

          {/* Search */}
          <div className="relative mt-10 max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full h-12 rounded-xl bg-white border border-slate-200 pl-11 pr-4 text-sm text-slate-700 outline-none shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/10 placeholder:text-slate-300 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border",
              !activeCategory
                ? "bg-brand text-white border-brand"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border",
                activeCategory === cat.id
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
              )}
            >
              <cat.icon size={12} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-400 mb-8">
          {filtered.length} {filtered.length === 1 ? "question" : "questions"}
          {activeCategory && ` in this category`}
          {searchQuery && ` matching &quot;${searchQuery}&quot;`}
        </p>

        {/* FAQ items by category */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
            <HelpCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-base font-bold text-slate-400">No matching questions found.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
              className="text-xs text-brand font-bold uppercase tracking-widest mt-4 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => {
              const items = filtered.filter((i) => i.category === cat.id);
              if (items.length === 0) return null;

              return (
                <section key={cat.id}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center">
                      <cat.icon size={17} className="text-brand" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{cat.label}</h2>
                      <p className="text-xs text-slate-500">{cat.desc}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {items.map((item) => {
                      const realIndex = faqItems.indexOf(item);
                      return (
                        <div key={realIndex}>
                          <button
                            onClick={() => setOpenIndex(openIndex === realIndex ? null : realIndex)}
                            className="w-full flex items-center gap-3 py-5 text-left"
                          >
                            <span className="flex-1 text-sm font-semibold text-slate-900">{item.question}</span>
                            <ChevronDown size={15} className={cn(
                              "text-slate-400 shrink-0 transition-transform duration-200",
                              openIndex === realIndex && "rotate-180"
                            )} />
                          </button>
                          {openIndex === realIndex && (
                            <div className="pb-6 text-sm text-slate-600 leading-relaxed pl-0 border-l-2 border-brand/30 pl-5 space-y-2">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-slate-900 p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/[0.08] rounded-full blur-[120px]" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">Still have questions?</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">Our documentation and support team are here to ensure your outreach engine never stops.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold" onClick={() => router.push("/guide")}>
                View Documentation
              </Button>
              <button
                onClick={() => window.open("https://tally.so/r/aQee69", "_blank")}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold text-white border border-white/10 hover:bg-white/5 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-border-light bg-[#F8F9FA]">
        <div className="mx-auto max-w-5xl px-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <nav className="flex items-center gap-6">
            <Link href="/guide" className="text-xs font-semibold text-text-muted hover:text-text-primary">Guide</Link>
            <Link href="/priority" className="text-xs font-semibold text-text-muted hover:text-text-primary">Priority</Link>
            <Link href="/faq" className="text-xs font-semibold text-text-muted hover:text-text-primary">FAQ</Link>
            <Link href="/privacy" className="text-xs font-semibold text-text-muted hover:text-text-primary">Privacy</Link>
            <Link href="/terms" className="text-xs font-semibold text-text-muted hover:text-text-primary">Terms</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand hover:text-brand/80">Support</a>
          </nav>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-text-muted">&copy; 2026 SharaSpot</span>
            <p className="text-[10px] text-text-muted">Hire me as GTM engineer — <a href="mailto:fffstanza@gmail.com" className="text-brand hover:text-brand/80 transition-colors">fffstanza@gmail.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
